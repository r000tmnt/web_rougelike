import { Scene } from 'phaser';
import DungeonGenerator from 'src/utils/dungeonGenerator';

export default class Dungeon extends Scene {
  content: DungeonGenerator | null;
  constructor() {
    super('Dungeon');
    this.content = null;

    this.init();
  }

  init() {
    this.content = new DungeonGenerator(this);
  }

  preload() {
    //
  }

  create() {
    //
  }

  update() {
    //
  }
}
