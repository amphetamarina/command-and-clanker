// `bun run setup` — wire the AIso adapters into Claude Code and opencode so you
// do not have to pass plugin paths by hand. Both adapters only do anything
// inside an AIso terminal (where AISO_SESSION is injected), so this is safe to
// run once globally. Idempotent.

import { mkdir, readFile, writeFile, symlink, rm, chmod } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const repo = resolve(import.meta.dirname, "..");
const claudeHook = resolve(repo, "integrations/claude/aiso/aiso-hook.sh");
const opencodePlugin = resolve(repo, "integrations/opencode/aiso/aiso.js");
const home = homedir();

const CLAUDE_EVENTS = [
  "SessionStart",
  "SessionEnd",
  "PostToolUse",
  "SubagentStart",
  "SubagentStop",
];

async function installClaude(): Promise<string> {
  const path = join(home, ".claude", "settings.json");
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  } catch {
    /* fresh */
  }
  const hooks = (settings.hooks ?? {}) as Record<string, unknown[]>;
  const entry = { hooks: [{ type: "command", command: claudeHook }] };
  for (const ev of CLAUDE_EVENTS) {
    const list = Array.isArray(hooks[ev]) ? hooks[ev] : [];
    // Drop any prior AIso entry, then add a fresh one (idempotent).
    const cleaned = list.filter((e) => !JSON.stringify(e).includes("aiso-hook.sh"));
    cleaned.push(entry);
    hooks[ev] = cleaned;
  }
  settings.hooks = hooks;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`);
  await chmod(claudeHook, 0o755);
  return path;
}

async function installOpencode(): Promise<string> {
  const dir = join(home, ".config", "opencode", "plugin");
  const link = join(dir, "aiso.js");
  await mkdir(dir, { recursive: true });
  try {
    await rm(link);
  } catch {
    /* nothing to remove */
  }
  await symlink(opencodePlugin, link);
  return link;
}

const claude = await installClaude();
const opencode = await installOpencode();
console.log("AIso adapters installed:");
console.log(`  Claude hooks   -> ${claude}`);
console.log(`  opencode plugin -> ${opencode}`);
console.log(
  "They only report inside AIso terminals (AISO_SESSION is injected there),",
);
console.log("so they stay quiet everywhere else. Run an agent and watch the map.");
