import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";
import { buildWorld, releaseRegion, type TerminalInfo } from "./world-builder.ts";
import { loadCache, saveCache } from "./persistence.ts";
import { TerminalManager, type TermClient } from "./terminals.ts";
import type { World } from "../shared/types.ts";
import type { AgentSnapshot, FileActivity } from "../shared/proc-types.ts";

const PORT = Number(process.env.TTY_API_PORT ?? 3001);
const TICK_MS = 1000;
const WORK_DIR_TTL_MS = 15000;
const ACTIVITY_TTL_MS = 6000;
const CACHE_PATH =
  process.env.ISOTOP_CACHE ?? join(process.cwd(), ".isotop-cache.json");
const INGEST_TOKEN = process.env.AISO_TOKEN ?? randomUUID();

const placements = await loadCache(CACHE_PATH);
const workDirLastActive = new Map<string, number>();
const knownTerminals = new Set<string>();
const liveClients = new Set<WebSocket>();
let worldDirty = false;

// Absolute path to the Claude adapter, injected as AISO_PATH so agents can be
// launched with `claude --plugin-dir $AISO_PATH`.
const PLUGIN_DIR = resolve(
  import.meta.dirname,
  "..",
  "integrations",
  "claude",
  "aiso",
);

const terminals = new TerminalManager({
  url: `http://127.0.0.1:${PORT}/ingest`,
  token: INGEST_TOKEN,
  pluginDir: PLUGIN_DIR,
});

// One robot's worth of state, built from adapter events rather than /proc.
type Agent = {
  id: string;
  terminal: string;
  kind: "agent" | "subagent";
  parent: string | null;
  tool: string;
  label: string;
  activity: FileActivity | null;
  activityTs: number;
};
const agents = new Map<string, Agent>();

function subId(session: string, agentId: unknown): string {
  return `${session}:sub:${agentId ?? "anon"}`;
}

function ensureAgent(session: string): Agent {
  let a = agents.get(session);
  if (!a) {
    a = {
      id: session,
      terminal: session,
      kind: "agent",
      parent: null,
      tool: "claude",
      label: "claude",
      activity: null,
      activityTs: 0,
    };
    agents.set(session, a);
  }
  return a;
}

function removeSession(session: string): void {
  for (const [id, a] of agents) {
    if (a.terminal === session) agents.delete(id);
  }
}

function touchWorkDir(dir: string, now: number): void {
  if (!workDirLastActive.has(dir)) worldDirty = true;
  workDirLastActive.set(dir, now);
}

// Normalize a Claude Code hook payload into agent/world state. The terminal
// island id arrives out of band in the X-Aiso-Session header.
type ClaudeHook = {
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: { file_path?: unknown; command?: unknown };
  agent_id?: unknown;
  agent_type?: unknown;
};

function ingestClaude(session: string, body: ClaudeHook): void {
  const now = Date.now();
  switch (body.hook_event_name) {
    case "SessionStart":
      ensureAgent(session);
      return;
    case "SessionEnd":
    case "Stop":
      removeSession(session);
      worldDirty = true;
      return;
    case "SubagentStart": {
      const id = subId(session, body.agent_id);
      agents.set(id, {
        id,
        terminal: session,
        kind: "subagent",
        parent: session,
        tool: "claude",
        label: typeof body.agent_type === "string" ? body.agent_type : "subagent",
        activity: null,
        activityTs: 0,
      });
      return;
    }
    case "SubagentStop":
      agents.delete(subId(session, body.agent_id));
      return;
    case "PreToolUse":
    case "PostToolUse": {
      const id = body.agent_id ? subId(session, body.agent_id) : session;
      const agent = agents.get(id) ?? ensureAgent(session);
      const file = body.tool_input?.file_path;
      if (typeof file === "string" && file.startsWith("/")) {
        agent.activity = {
          path: file,
          dir: dirname(file),
          direction: body.tool_name === "Read" ? "read" : "write",
        };
        agent.activityTs = now;
        touchWorkDir(agent.activity.dir, now);
      }
      return;
    }
    default:
      return;
  }
}

async function terminalInfos(): Promise<TerminalInfo[]> {
  return Promise.all(
    terminals.refs().map(async ({ id, pid }) => {
      let label = id;
      try {
        label = await readlink(`/proc/${pid}/cwd`);
      } catch {
        /* keep id */
      }
      return { id, label };
    }),
  );
}

async function buildWorldFor(): Promise<World> {
  const infos = await terminalInfos();
  const world = buildWorld(infos, [...workDirLastActive.keys()], placements);
  void saveCache(CACHE_PATH, placements);
  return world;
}

function agentSnapshots(): AgentSnapshot[] {
  return [...agents.values()].map((a) => ({
    id: a.id,
    terminal: a.terminal,
    kind: a.kind,
    parent: a.parent,
    tool: a.tool,
    label: a.label,
    activity: a.activity,
  }));
}

function broadcast(message: string): void {
  for (const ws of liveClients) {
    if (ws.readyState === ws.OPEN) ws.send(message);
  }
}

function broadcastAgents(): void {
  broadcast(
    JSON.stringify({
      kind: "agents",
      capturedAt: Date.now(),
      agents: agentSnapshots(),
    }),
  );
}

async function broadcastWorld(): Promise<void> {
  const world = await buildWorldFor();
  broadcast(JSON.stringify({ kind: "world-delta", regions: world.regions }));
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const { pathname } = url;
  const method = req.method ?? "GET";

  if (pathname === "/health") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (pathname === "/ingest" && method === "POST") {
    if (req.headers["authorization"] !== `Bearer ${INGEST_TOKEN}`) {
      return sendJson(res, 401, { ok: false });
    }
    const session = String(req.headers["x-aiso-session"] ?? "");
    let body: ClaudeHook = {};
    try {
      body = (await readBody(req)) as ClaudeHook;
    } catch {
      /* ignore malformed */
    }
    if (session) {
      ingestClaude(session, body);
      broadcastAgents();
    }
    // Ack immediately; hooks are synchronous and must not block the agent.
    return sendJson(res, 200, {});
  }

  if (pathname === "/term/new" && method === "POST") {
    let cols: number | undefined;
    let rows: number | undefined;
    try {
      const body = (await readBody(req)) as { cols?: number; rows?: number };
      cols = body.cols;
      rows = body.rows;
    } catch {
      /* defaults */
    }
    const id = terminals.create(cols, rows);
    console.log(`[term] created ${id} (${cols ?? 80}x${rows ?? 24})`);
    return sendJson(res, 200, { id });
  }

  if (pathname === "/term/kill" && method === "POST") {
    try {
      const { id } = (await readBody(req)) as { id?: unknown };
      terminals.kill(String(id));
      return sendJson(res, 200, { ok: true });
    } catch {
      return sendJson(res, 400, { ok: false });
    }
  }

  if (pathname === "/world") {
    const world = await buildWorldFor();
    console.log(`[world] ${world.regions.length} islands`);
    return sendJson(res, 200, world);
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}

const httpServer = createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.warn(`[http] ${(err as Error).message}`);
    if (!res.headersSent) sendJson(res, 500, { error: "internal" });
  });
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/live") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      liveClients.add(ws);
      console.log("[ws] client connected");
      ws.on("close", () => {
        liveClients.delete(ws);
        console.log("[ws] client disconnected");
      });
    });
    return;
  }
  if (url.pathname === "/term") {
    const id = url.searchParams.get("id") ?? "";
    const term = terminals.get(id);
    if (!term) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      const client: TermClient = {
        send: (data) => {
          if (ws.readyState === ws.OPEN) ws.send(data);
        },
      };
      term.attach(client);
      ws.on("message", (raw) => {
        const text = raw.toString();
        let msg: { i?: string; r?: [number, number] } | null = null;
        try {
          msg = JSON.parse(text);
        } catch {
          term.write(text);
          return;
        }
        if (typeof msg?.i === "string") term.write(msg.i);
        else if (Array.isArray(msg?.r)) term.resize(msg.r[0], msg.r[1]);
      });
      ws.on("close", () => term.detach(client));
    });
    return;
  }
  socket.destroy();
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] map is driven by agent events at POST /ingest`);
});

setInterval(() => {
  if (liveClients.size === 0) return;
  const now = Date.now();

  for (const [dir, last] of workDirLastActive) {
    if (now - last > WORK_DIR_TTL_MS) {
      workDirLastActive.delete(dir);
      releaseRegion(placements, dir);
      worldDirty = true;
    }
  }
  for (const a of agents.values()) {
    if (a.activity && now - a.activityTs > ACTIVITY_TTL_MS) a.activity = null;
  }

  const liveTerms = new Set(terminals.list());
  for (const id of liveTerms) {
    if (!knownTerminals.has(id)) {
      knownTerminals.add(id);
      worldDirty = true;
    }
  }
  for (const id of [...knownTerminals]) {
    if (!liveTerms.has(id)) {
      knownTerminals.delete(id);
      removeSession(id);
      releaseRegion(placements, id);
      worldDirty = true;
    }
  }

  if (worldDirty) {
    worldDirty = false;
    void broadcastWorld();
  }
  broadcastAgents();
}, TICK_MS);
