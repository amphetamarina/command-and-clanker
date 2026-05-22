import { test, expect } from "bun:test";
import {
  npcSpriteKey,
  npcWorldPosition,
  NPC_VARIANT_KEYS,
} from "./npc.ts";
import type { BuildingDescriptor } from "../shared/types.ts";

const building: BuildingDescriptor = {
  id: "/usr/bin/bash",
  district: "running",
  tile: { x: 4, y: 6 },
  footprint: { w: 1, h: 1 },
  spriteKey: "building/foerderturm/1",
  hashShort: "00000000",
  size: 1,
};

test("npcSpriteKey is deterministic for a given pid", () => {
  for (let i = 0; i < 100; i++) {
    expect(npcSpriteKey(42)).toBe(npcSpriteKey(42));
  }
});

test("npcSpriteKey distributes across variants", () => {
  const seen = new Set<string>();
  for (let pid = 0; pid < 30; pid++) {
    seen.add(npcSpriteKey(pid));
  }
  expect(seen.size).toBe(NPC_VARIANT_KEYS.length);
});

test("npcWorldPosition is deterministic for a given pid and building", () => {
  const a = npcWorldPosition(123, building);
  const b = npcWorldPosition(123, building);
  expect(a).toEqual(b);
});

test("npcWorldPosition places different pids at different adjacent tiles", () => {
  const positions = new Set<string>();
  for (let pid = 0; pid < 4; pid++) {
    const p = npcWorldPosition(pid, building);
    positions.add(`${p.screen.x},${p.screen.y}`);
  }
  expect(positions.size).toBe(4);
});

test("npc tileSum is one greater or less than building's tile sum", () => {
  const buildingTileSum = building.tile.x + building.tile.y;
  for (let pid = 0; pid < 8; pid++) {
    const p = npcWorldPosition(pid, building);
    expect(Math.abs(p.tileSum - buildingTileSum)).toBe(1);
  }
});
