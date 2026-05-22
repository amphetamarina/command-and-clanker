import Phaser from "phaser";
import type { BuildingDescriptor } from "../shared/types.ts";
import { drawBuilding } from "./building-sprite.ts";
import { TILE_H } from "./iso.ts";

type CitySceneData = { buildings: BuildingDescriptor[] };

export class CityScene extends Phaser.Scene {
  private buildings: BuildingDescriptor[] = [];

  constructor() {
    super("city");
  }

  init(data: CitySceneData) {
    this.buildings = data.buildings ?? [];
  }

  create() {
    const sorted = [...this.buildings].sort((a, b) => {
      const da = a.tile.x + a.tile.y;
      const db = b.tile.x + b.tile.y;
      return da - db;
    });

    const g = this.add.graphics();

    const maxTile = this.buildings.reduce(
      (m, d) => Math.max(m, d.tile.x + d.tile.y),
      0,
    );
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2 - (maxTile * TILE_H) / 4;
    g.setPosition(cx, cy);

    for (const d of sorted) {
      drawBuilding(g, d);
    }

    this.scale.on("resize", (size: Phaser.Structs.Size) => {
      const ncx = size.width / 2;
      const ncy = size.height / 2 - (maxTile * TILE_H) / 4;
      g.setPosition(ncx, ncy);
    });
  }
}
