import type Phaser from "phaser";
import { tileToScreen } from "./iso.ts";

export const FLOOR_COUNT = 8;

function floorVariant(x: number, y: number): number {
  const h = Math.abs((x * 73856093) ^ (y * 19349663));
  return h % FLOOR_COUNT;
}

export function buildGroundTiles(
  scene: Phaser.Scene,
  floorKeys: string[],
  extentX: number,
  extentY: number,
  padding: number,
  depth: number,
): Phaser.GameObjects.Image[] {
  const tiles: Phaser.GameObjects.Image[] = [];
  for (let y = -padding; y < extentY + padding; y++) {
    for (let x = -padding; x < extentX + padding; x++) {
      const s = tileToScreen(x, y);
      const img = scene.add
        .image(s.x, s.y, floorKeys[floorVariant(x, y)]!)
        .setOrigin(0.5, 0)
        .setDepth(depth);
      tiles.push(img);
    }
  }
  return tiles;
}
