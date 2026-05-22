import { test, expect } from "bun:test";
import { tileToScreen, TILE_W, TILE_H } from "./iso.ts";

test("origin tile maps to origin", () => {
  expect(tileToScreen(0, 0)).toEqual({ x: 0, y: 0 });
});

test("moving +1 in tile.x shifts screen right and down by half tile", () => {
  expect(tileToScreen(1, 0)).toEqual({ x: TILE_W / 2, y: TILE_H / 2 });
});

test("moving +1 in tile.y shifts screen left and down by half tile", () => {
  expect(tileToScreen(0, 1)).toEqual({ x: -TILE_W / 2, y: TILE_H / 2 });
});

test("diagonal +1,+1 shifts straight down by one tile height", () => {
  expect(tileToScreen(1, 1)).toEqual({ x: 0, y: TILE_H });
});

test("projection is a linear sum of basis vectors", () => {
  for (let x = -3; x <= 3; x++) {
    for (let y = -3; y <= 3; y++) {
      const p = tileToScreen(x, y);
      expect(p.x).toBe((x - y) * (TILE_W / 2));
      expect(p.y).toBe((x + y) * (TILE_H / 2));
    }
  }
});
