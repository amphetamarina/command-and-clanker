# AIso

`top`, but isometric — a live pixel-art map of what your terminals are
running. Build a terminal inside AIso and every process it spawns becomes
a robot walking an EXAPUNKS-style host: folders are rose panels wired
together by cables, binaries are buildings, and processes are robots that
walk to the folders they touch. (The repository and package are still
named `isotop`.)

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

- **Folder islands.** Each directory of interest is a flat rose panel with
  a faint isometric grid and beveled edges, floating on dark and labelled
  with its path. A cable links each island to its parent folder.
- **Robots = processes.** One per process descended from a terminal you
  built here. `claude`, `codex`, and `opencode` walk their own robot;
  everything else gets a generic chassis. Robots wander by their building
  with live CPU/memory bars, and when a process reads or writes a folder
  its robot walks there as the folder lights up as a temporary work
  island.
- **Buildings = binaries.** One per unique running executable, with art
  derived from the SHA-256 of its contents; known tools get dedicated
  sprites.
- **Left sidebar.** The AIso logo, a "+ Terminal" button, a tab per open
  terminal, and the active terminal docked inline — a real shell over
  `node-pty`, sized to the sidebar and reflowing live, so Claude Code,
  opencode, and other full-screen TUIs render correctly.

AIso shows only the processes that descend from terminals built inside it,
not your whole machine.

## Controls

Pan: drag · Zoom: wheel · Hover a building or robot for details.

## Architecture

A Node backend reads `/proc`, hashes binaries, builds a deterministic
world, and streams the world, process snapshots, and terminal I/O over
HTTP + WebSocket (the `ws` library). A Vite + Phaser 3 frontend renders
the isometric scene; terminals run on `node-pty`. See
[`docs/architecture.md`](docs/architecture.md).

```
server/   Node backend: /proc + CPU/mem + file-activity sampling,
          world builder, node-pty terminals, HTTP + WebSocket (ws)
shared/   types shared by server and client
src/      Vite + Phaser 3 frontend: scene, islands, robots, sidebar,
          docked terminals
assets/   vendored sprite pack + logo
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

- Giving each terminal its own island, wired to the folders its agents
  touch, is the next layout step.
- The sprite pack ships richer per-tool art than the world currently uses.
