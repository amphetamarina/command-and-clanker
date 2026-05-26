import type Phaser from "phaser";
import type { Region } from "../shared/types.ts";
import { tileToScreen } from "./iso.ts";

const THICKNESS = 14;
// Beveled slab faces, in a dark mauve so the pink top reads as lit.
const SIDE_LEFT = 0x342330;
const SIDE_RIGHT = 0x281a24;
// Top-edge highlight and folder-tinted outline.
const EDGE_HI = 0xf6d8e6;
const BORDER = 0xe7c2d2;
// Panel surfaces: a soft rose for plain folders, brighter for active ones.
const PANEL_NORMAL = 0xc79cb0;
const PANEL_WORK = 0xe6b1ca;
const GRID_LIGHT = 0xffffff;
const GRID_DARK = 0x7c5165;

type Pt = { x: number; y: number };

function corners(r: Region): { N: Pt; E: Pt; S: Pt; W: Pt } {
  const { x: ox, y: oy } = r.origin;
  const { w, h } = r.size;
  return {
    N: tileToScreen(ox, oy),
    E: tileToScreen(ox + w, oy),
    S: tileToScreen(ox + w, oy + h),
    W: tileToScreen(ox, oy + h),
  };
}

function poly(g: Phaser.GameObjects.Graphics, pts: Pt[]): void {
  g.beginPath();
  g.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i]!.x, pts[i]!.y);
  g.closePath();
  g.fillPath();
}

function centerScreen(r: Region): Pt {
  return tileToScreen(r.origin.x + r.size.w / 2, r.origin.y + r.size.h / 2);
}

// The deepest ancestor region whose path contains this one's path.
function parentOf(r: Region, regions: Region[]): Region | null {
  let best: Region | null = null;
  for (const o of regions) {
    if (o === r || o.path === r.path) continue;
    const prefix = o.path.endsWith("/") ? o.path : `${o.path}/`;
    if (!r.path.startsWith(prefix)) continue;
    if (!best || o.path.length > best.path.length) best = o;
  }
  return best;
}

const LINK_BASE = 0x2a1a24;
const LINK_CORE = 0x6e4256;

// EXAPUNKS-style cables linking each island to its parent folder. Drawn below
// the island tops so they slip under the edges and only show across the gaps.
export function drawIslandLinks(
  g: Phaser.GameObjects.Graphics,
  regions: Region[],
): void {
  for (const r of regions) {
    const parent = parentOf(r, regions);
    if (!parent) continue;
    const a = centerScreen(r);
    const b = centerScreen(parent);
    g.lineStyle(4, LINK_BASE, 0.9);
    g.lineBetween(a.x, a.y, b.x, b.y);
    g.lineStyle(1.5, LINK_CORE, 0.85);
    g.lineBetween(a.x, a.y, b.x, b.y);
  }
}

// The extruded slab sides, drawn below the panel top.
export function drawIslandSides(g: Phaser.GameObjects.Graphics, r: Region): void {
  const { E, S, W } = corners(r);
  const down = (p: Pt): Pt => ({ x: p.x, y: p.y + THICKNESS });
  g.fillStyle(SIDE_LEFT, 1);
  poly(g, [W, S, down(S), down(W)]);
  g.fillStyle(SIDE_RIGHT, 1);
  poly(g, [S, E, down(E), down(S)]);
}

// The island's flat top: a rose panel with a faint isometric grid, the way an
// EXAPUNKS host shows its grid spaces.
export function drawIslandTop(g: Phaser.GameObjects.Graphics, r: Region): void {
  const { N, E, S, W } = corners(r);
  g.fillStyle(r.kind === "work" ? PANEL_WORK : PANEL_NORMAL, 1);
  poly(g, [N, E, S, W]);

  const { x: ox, y: oy } = r.origin;
  const { w, h } = r.size;
  const gridLine = (a: Pt, b: Pt) => {
    g.lineBetween(a.x, a.y, b.x, b.y);
  };
  g.lineStyle(1, GRID_DARK, 0.35);
  for (let i = 1; i < w; i++) {
    gridLine(tileToScreen(ox + i, oy), tileToScreen(ox + i, oy + h));
  }
  for (let j = 1; j < h; j++) {
    gridLine(tileToScreen(ox, oy + j), tileToScreen(ox + w, oy + j));
  }
  g.lineStyle(1, GRID_LIGHT, 0.08);
  for (let i = 1; i < w; i++) {
    gridLine(
      tileToScreen(ox + i, oy + 0.04),
      tileToScreen(ox + i, oy + h + 0.04),
    );
  }
}

// The beveled rim, drawn above the panel: folder-tinted border + lit top edge.
export function drawIslandEdges(g: Phaser.GameObjects.Graphics, r: Region): void {
  const { N, E, S, W } = corners(r);
  g.lineStyle(2, BORDER, 0.85);
  g.beginPath();
  g.moveTo(N.x, N.y);
  g.lineTo(E.x, E.y);
  g.lineTo(S.x, S.y);
  g.lineTo(W.x, W.y);
  g.closePath();
  g.strokePath();
  g.lineStyle(2, EDGE_HI, 0.6);
  g.beginPath();
  g.moveTo(W.x, W.y);
  g.lineTo(N.x, N.y);
  g.lineTo(E.x, E.y);
  g.strokePath();
}
