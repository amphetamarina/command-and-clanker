# AIso



https://github.com/user-attachments/assets/4b686165-1887-4f58-a574-95c35fa02fb7



`top`, but isometric — a live pixel-art map of what your terminals are
running. Build a terminal inside AIso and it becomes an EXAPUNKS-style host
island; every process it spawns is a robot living on that island, and the
folders its agents touch become islands wired to it by cables. (The
repository and package are still named `isotop`.)

## Quick start

```sh
mise install   # bun + node, pinned in mise.toml
bun install    # installs deps and compiles node-pty's native PTY
bun run dev    # Node backend + Vite frontend
```

Open <http://localhost:5173>. The first load scans `/proc`, hashes the
running binaries, then streams live updates over a WebSocket.

> The backend runs under **Node** (for `node-pty`); the test suite runs
> under **Bun**. `bun install` compiles `node-pty`, which needs a C/C++
> toolchain (`python3`, `make`, `g++`) — present on most dev machines.

## What you see

- **Terminal islands.** Each terminal you build is a flat rose panel with a
  faint isometric grid and beveled edges, labelled with the shell's working
  directory. Its processes live here.
- **Folder islands.** Each folder an agent touches becomes its own island,
  wired by a cable to the terminal whose agent is working there.
- **Robots = agents.** One per agent (and one per subagent it spawns)
  running in a terminal. `claude` walks the Claude robot, subagents are
  smaller; opencode and others get their own/generic art. When an agent
  reads or writes a file, its robot walks to that file's folder island and
  back — driven by real tool calls, not guesswork.
- **Left sidebar.** The AIso logo, a "+ Terminal" button, a tab per open
  terminal, and the active terminal docked inline — a real shell over
  `node-pty`, sized to the sidebar and reflowing live, so Claude Code,
  opencode, and other full-screen TUIs render correctly.

AIso renders what agents report, not your whole machine: an agent's tool
calls reach the map through an adapter (see `integrations/`), so only
instrumented agents (Claude Code today, opencode next) appear.

## Controls

Pan: drag · Zoom: wheel · Hover a building or robot for details.

## Architecture

A Node backend accepts agent events at `POST /ingest` (agents are launched
from AIso's `node-pty` terminals, which inject the ingest URL, a token, and
the terminal-island id into the shell). It turns those events into terminal
and folder islands and a robot per agent, and streams the world plus agent
snapshots over WebSocket (the `ws` library). A Vite + Phaser 3 frontend
renders the isometric scene. See
[`docs/architecture.md`](docs/architecture.md) and `integrations/` for the
agent adapters.

```
server/        Node backend: /ingest event sink, world builder,
               node-pty terminals, HTTP + WebSocket (ws)
shared/        types shared by server and client
src/           Vite + Phaser 3 frontend: scene, islands, robots, sidebar,
               docked terminals
integrations/  agent adapters (Claude Code plugin; opencode next)
assets/        vendored sprite pack + logo
docs/     vision, architecture, original v0 spec
```

## Scripts

```sh
bun run dev         # Node backend + Vite frontend on :5173
bun run dev:server  # backend only (node --watch)
bun run typecheck   # tsc --noEmit
bun test            # test runner (Bun)
bun run build       # production build into dist/
```

## Not yet

- The claude robot art is a top-down sprite, out of style with the
  3/4-view codex/opencode robots; it needs regenerating.
- Distinguishing a main agent from its subagents visually (size/labels).
