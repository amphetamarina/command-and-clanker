import type { BuildingDescriptor } from "../shared/types.ts";
import { TILE_H, tileToScreen, type ScreenPoint } from "./iso.ts";

export const NPC_VARIANT_KEYS = [
  "npc/mech/1",
  "npc/mech/2",
  "npc/mech/3",
] as const;

export type NpcSpriteKey = (typeof NPC_VARIANT_KEYS)[number];

export function npcSpriteKey(pid: number): NpcSpriteKey {
  return NPC_VARIANT_KEYS[pid % NPC_VARIANT_KEYS.length]!;
}

const ADJACENT_OFFSETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

export const WANDER_OFFSETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

export type NpcSpawn = {
  screen: ScreenPoint;
  tile: { x: number; y: number };
  tileSum: number;
};

export function npcWorldPosition(
  pid: number,
  building: BuildingDescriptor,
): NpcSpawn {
  const off = ADJACENT_OFFSETS[pid % ADJACENT_OFFSETS.length]!;
  const tx = building.tile.x + off.x;
  const ty = building.tile.y + off.y;
  const s = tileToScreen(tx, ty);
  return {
    screen: { x: s.x, y: s.y + TILE_H / 2 },
    tile: { x: tx, y: ty },
    tileSum: tx + ty,
  };
}
