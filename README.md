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
unique exe found there (a few seconds). After that, the city refreshes
every 2 seconds; NPCs appear and disappear as processes spawn and
exit.

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

- **v0** (shipped): static city of buildings keyed by SHA-256, sprite
  art from the [acdrnx Sci-Fi Strategy](https://opengameart.org/content/sci-fi-strategy-mech-buildings-isometric-asset-pack)
  CC0 pack.
- **v1** (shipped): live NPC layer driven by 2s polling of /procs.

## What isotop deliberately is not yet

- NPCs do not walk. They appear, stand idle, and disappear. Pathing
  + animation is the next milestone.
- Live updates are HTTP polling, not WebSocket. Polling was the
  smaller scope and easier to reason about for v1.
- Buildings whose process was running at page load are the city.
  Binaries that only start running later (with no existing process
  for that exe at startup) will not get a building until the page
  is reloaded. Re-deriving the world without a full reload is a
  follow-up.
- The pack's ground tileset is unused; the procedural dark
  diamond floor in `src/ground.ts` pairs better with the cool
  sprite palette than the pack's warmer terrain tiles would.
- No persistence, no caching, no production deployment story.
  Local dev only.

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
