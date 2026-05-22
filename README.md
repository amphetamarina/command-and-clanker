# isotop

`top`, but isometric. A live, isometric pixel-art rendering of your
Unix environment: every running binary is a building, every running
process is a mech NPC standing on the street next to its building.

## Quick start

```sh
mise install     # installs bun
bun install
bun run dev
```

Then open <http://localhost:5173>.

The first page load triggers a scan of `/proc` and a SHA-256 of each
unique exe found there (a few seconds). After that, the page opens a
WebSocket to the Bun API on port 3001 and live updates stream in:
NPCs appear and disappear as processes spawn and exit, new buildings
appear when previously-unseen executables start running.

## What you see

- **Buildings = tools.** Each pixel-art building is one binary that
  has at least one running process using it as its executable image.
  The silhouette and colour variant are deterministically derived
  from the SHA-256 of the binary's contents, so the same binary on
  the same machine always looks the same.
- **Streets between buildings.** Tiles are placed on a sparse grid
  so every building has walkable street tiles around it.
- **NPCs = processes.** One small mech per PID, standing on a
  cardinal-neighbour street tile of its building. Mech colour is a
  deterministic function of the PID. NPCs appear when a process
  spawns and disappear within ~2s of it exiting.
- **Hover for details.** Hovering a building shows its full path,
  hash prefix, and size on disk. Hovering an NPC shows its PID,
  comm name, and exe.

## Controls

- **Pan**: click and drag.
- **Zoom**: mouse wheel.

## Status

- **v0** (shipped): static city of buildings keyed by SHA-256.
- **v1** (shipped): live NPC layer.
- **v1.1** (shipped): custom Tiberian-Sun-style sprite pack
  (`assets/isotop-assets/`), darker solid ground, organic sub-tile
  offsets so the layout looks less rigid, NPCs wander between
  street tiles via Phaser tweens (no walk animation yet), world
  auto-updates when a new exe starts running, WebSocket push
  replaces HTTP polling.

## What isotop deliberately is not yet

- NPCs slide rather than walk. The pack ships walk-cycle frames
  in 8 directions; v2 will use them.
- The WebSocket connects directly to the Bun API port (3001) in
  dev because Vite's WS proxy is unreliable here. In a deployed
  single-port setup it would proxy normally.
- No persistence: the placement cache lives in process memory, so
  restarting the server reshuffles building positions on next
  page load.
- The pack's ground tileset is unused; the procedural dark
  diamond floor in `src/ground.ts` pairs better with the cool
  sprite palette than the pack's warmer terrain tiles would.

See `docs/v0-spec.md` for the original scope statement; `docs/idea.md`
and `docs/architecture.md` for the broader design.

## Project layout

```
assets/      - vendored CC0 sprite pack (acdrnx)
docs/        - vision, architecture sketch, v0 spec
server/      - Bun backend: /proc reader, hasher, world builder, /world + /procs
shared/      - types shared between server and client
src/         - Vite + Phaser 3 frontend (scene, npcs, iso projection)
scripts/     - dev orchestrator (spawns server + vite)
mise.toml    - pins bun
```

## Scripts

```sh
bun run dev         # backend + frontend on localhost:5173
bun run typecheck   # tsc --noEmit
bun test            # bun's built-in test runner
bun run build       # vite production build into dist/
```

## Read next

- [`docs/idea.md`](docs/idea.md) - the broader vision
- [`docs/architecture.md`](docs/architecture.md) - architecture sketch
- [`docs/v0-spec.md`](docs/v0-spec.md) - what v0 was scoped to
- [`assets/sci-fi-acdrnx/LICENSE.md`](assets/sci-fi-acdrnx/LICENSE.md) - asset pack provenance
