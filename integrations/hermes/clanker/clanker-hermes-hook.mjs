#!/usr/bin/env node
// Command & Clanker Hermes adapter. Hermes shell hooks pipe a JSON payload on
// stdin (hook_event_name, tool_name, tool_input, cwd) with its own event and
// tool names; this translates that into the /ingest contract the backend parses
// and forwards it tagged as the "hermes" tool. Only acts inside a Command &
// Clanker terminal (CLANKER_SESSION is injected there); fast and silent.
import process from "node:process";

const session = process.env.CLANKER_SESSION;
const ingest = process.env.CLANKER_INGEST;
const token = process.env.CLANKER_TOKEN ?? "";
if (!session || !ingest) process.exit(0);

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let ev;
try {
  ev = JSON.parse(raw);
} catch {
  process.exit(0);
}

// Hermes event names -> the Claude-shaped lifecycle names the backend expects.
const EVENT = {
  on_session_start: "SessionStart",
  on_session_end: "SessionEnd",
  post_tool_call: "PostToolUse",
};
const hookEventName = EVENT[ev.hook_event_name];
if (!hookEventName) process.exit(0); // ignore pre_* / llm events

const input = ev.tool_input && typeof ev.tool_input === "object" ? ev.tool_input : {};
const tool = String(ev.tool_name ?? "").toLowerCase();

// Bucket Hermes tools into the Read / Bash / write the backend distinguishes.
let toolName = "Write";
if (tool.includes("read")) toolName = "Read";
else if (tool === "terminal" || /bash|shell|exec/.test(tool)) toolName = "Bash";

const filePath = input.file_path ?? input.path ?? input.filepath ?? input.filename;
const command = input.command ?? input.cmd;

const body = {
  hook_event_name: hookEventName,
  tool_name: toolName,
  tool_input: {
    ...(filePath ? { file_path: filePath } : {}),
    ...(command ? { command } : {}),
  },
  cwd: ev.cwd ?? "",
};

try {
  await fetch(ingest, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${token}`,
      "x-clanker-session": session,
      "x-clanker-tool": "hermes",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(1000),
  });
} catch {
  // fast and silent — never block the agent
}
process.exit(0);
