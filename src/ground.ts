import type Phaser from "phaser";
import type { Region } from "../shared/types.ts";
import { tileToScreen } from "./iso.ts";

const THICKNESS = 12;
const TOP_BIN = 0x343a47;
const TOP_WORK = 0x2b3640;
const GRID = 0x434b5a;
const SIDE_LEFT = 0x1c2029;
const SIDE_RIGHT = 0x252b35;
const EDGE_HI = 0x5c6577;

type Pt = { x: number; y: number };

function poly(g: Phaser.GameObjects.Graphics, pts: Pt[], fill: boolean): void {
  g.beginPath();
  g.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i]!.x, pts[i]!.y);
  g.closePath();
  if (fill) g.fillPath();
  else g.strokePath();
}

// Draws one folder as an EXAPUNKS-style host: a flat beveled panel with a
// subtle internal grid, extruded a little so it reads as a floating slab.
export function drawHostPanel(
  g: Phaser.GameObjects.Graphics,
  r: Region,
): void {
  const { x: ox, y: oy } = r.origin;
  const { w, h } = r.size;
  const N = tileToScreen(ox, oy);
  const E = tileToScreen(ox + w, oy);
  const S = tileToScreen(ox + w, oy + h);
  const W = tileToScreen(ox, oy + h);
  const down = (p: Pt): Pt => ({ x: p.x, y: p.y + THICKNESS });

  g.fillStyle(SIDE_LEFT, 1);
  poly(g, [W, S, down(S), down(W)], true);
  g.fillStyle(SIDE_RIGHT, 1);
  poly(g, [S, E, down(E), down(S)], true);

  g.fillStyle(r.kind === "work" ? TOP_WORK : TOP_BIN, 1);
  poly(g, [N, E, S, W], true);

  g.lineStyle(1, GRID, 0.5);
  for (let ty = oy; ty <= oy + h; ty++) {
    const a = tileToScreen(ox, ty);
    const b = tileToScreen(ox + w, ty);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.strokePath();
  }
  for (let tx = ox; tx <= ox + w; tx++) {
    const a = tileToScreen(tx, oy);
    const b = tileToScreen(tx, oy + h);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.strokePath();
  }

  g.lineStyle(2, r.tint, 0.9);
  poly(g, [N, E, S, W], false);
  g.lineStyle(2, EDGE_HI, 0.7);
  g.beginPath();
  g.moveTo(W.x, W.y);
  g.lineTo(N.x, N.y);
  g.lineTo(E.x, E.y);
  g.strokePath();
}
