import type Phaser from "phaser";
import type { BuildingDescriptor } from "../shared/types.ts";
import { tileToScreen, UNIT_HEIGHT } from "./iso.ts";
import { PALETTE } from "./palette.ts";

export function drawBuilding(
  g: Phaser.GameObjects.Graphics,
  d: BuildingDescriptor,
): void {
  const { tile, footprint, heightTiers, paletteIndex } = d;

  const N = tileToScreen(tile.x, tile.y);
  const E = tileToScreen(tile.x + footprint.w, tile.y);
  const S = tileToScreen(tile.x + footprint.w, tile.y + footprint.h);
  const W = tileToScreen(tile.x, tile.y + footprint.h);
  const z = heightTiers * UNIT_HEIGHT;

  const faces = PALETTE[paletteIndex] ?? PALETTE[0]!;

  g.fillStyle(faces.left, 1);
  g.beginPath();
  g.moveTo(W.x, W.y);
  g.lineTo(S.x, S.y);
  g.lineTo(S.x, S.y - z);
  g.lineTo(W.x, W.y - z);
  g.closePath();
  g.fillPath();

  g.fillStyle(faces.right, 1);
  g.beginPath();
  g.moveTo(S.x, S.y);
  g.lineTo(E.x, E.y);
  g.lineTo(E.x, E.y - z);
  g.lineTo(S.x, S.y - z);
  g.closePath();
  g.fillPath();

  g.fillStyle(faces.top, 1);
  g.beginPath();
  g.moveTo(W.x, W.y - z);
  g.lineTo(N.x, N.y - z);
  g.lineTo(E.x, E.y - z);
  g.lineTo(S.x, S.y - z);
  g.closePath();
  g.fillPath();
}
