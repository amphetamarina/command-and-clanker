# AIso adapter for Claude Code

This plugin streams every Claude Code tool call and subagent event to a
running AIso server (`POST /ingest`), so the agent's activity is rendered on
the map. It is the event source that replaces `/proc` scraping.

## How it ties to a terminal island

When you build a terminal inside AIso, the server injects three env vars into
that shell:

- `AISO_SESSION` — the terminal island id (e.g. `t1`)
- `AISO_INGEST` — the ingest URL (default `http://127.0.0.1:3001/ingest`)
- `AISO_TOKEN` — a per-run token authorizing the endpoint

The hooks send `AISO_SESSION` and `AISO_TOKEN` as headers, so the server knows
which island the events belong to. Run Claude Code **inside an AIso terminal**
and its reads/writes/subagents animate on that terminal's island.

## Install

From the repo, run `bun run setup` once: it merges these hooks (as an absolute
command path) into `~/.claude/settings.json`, so any `claude` launched inside an
AIso terminal reports automatically. The hook is gated on `AISO_SESSION` and
runs with `curl --max-time 1`, so it is silent and non-blocking everywhere else.

No-install alternative: the AIso terminal injects `AISO_PATH` (this plugin's
directory), so you can run `claude --plugin-dir $AISO_PATH` instead.

To share it as a plugin, this directory's parent carries a
`.claude-plugin/marketplace.json`; add it with
`/plugin marketplace add <repo>/integrations/claude` and install `aiso`.

## Events sent

`SessionStart`, `SessionEnd`, `PostToolUse`, `SubagentStart`, `SubagentStop`.
The server reads `tool_name` + `tool_input.file_path` to decide which folder a
robot walks to (read vs write), and uses `agent_id` to distinguish subagents.

> Note: the ingest URL is currently hardcoded to port 3001 in `hooks.json`. If
> you run the AIso server on another port, edit the `url` fields (the installer
> will template this later).
