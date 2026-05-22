import Phaser from "phaser";
import { CityScene } from "./scene.ts";
import type { BuildingDescriptor } from "../shared/types.ts";

const sampleBuildings: BuildingDescriptor[] = [];
for (let y = 0; y < 5; y++) {
  for (let x = 0; x < 5; x++) {
    const idx = y * 5 + x;
    sampleBuildings.push({
      id: `sample/${idx}`,
      district: "/sample",
      tile: { x, y },
      footprint: { w: 1, h: 1 },
      heightTiers: 1 + ((idx * 7) % 5),
      paletteIndex: idx % 8,
      hashShort: idx.toString(16).padStart(8, "0"),
      size: 1000 + idx,
    });
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0a0a12",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
});

game.scene.add("city", CityScene, true, { buildings: sampleBuildings });
