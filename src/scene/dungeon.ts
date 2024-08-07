import { Scene } from 'phaser';
import DungeonGenerator from 'src/utils/dungeonGenerator';

export default class Dungeon extends Scene {
  content: DungeonGenerator | null;
  theme: string;
  map: Phaser.Tilemaps.Tilemap | null;
  groundLayer: Phaser.Tilemaps.TilemapLayer | null;
  stuffLayer: Phaser.Tilemaps.TilemapLayer | null;
  camera: Phaser.Cameras.Scene2D.Camera | null;

  constructor() {
    super('Dungeon');
    this.content = null;
    this.theme = 'demo';
    this.map = null;
    this.groundLayer = null;
    this.stuffLayer = null;
    this.camera = null;
  }

  setTheme(theme: string) {
    this.theme = theme;
  }

  preload() {
    // Generate a part of dungeon
    this.content = new DungeonGenerator(this);

    // Load tiles
    this.load.image('tiles', '/assets/demo_tiles_test_48.png');
  }

  create() {
    // Generate tileMap
    if (this.content !== null) {
      const room = this.content.level.find((room) => room.length);
      console.log('room :>>>', room);

      if (room) {
        this.map = this.make.tilemap({
          tileHeight: 48, // Need to match the height of the image for each tile
          tileWidth: 48, // Need to match the width of the image for each tile
          data: room,
        });

        console.log('map :>>>', this.map);

        const tileset = this.map.addTilesetImage('tiles');
        this.groundLayer = this.map.createLayer(
          0,
          tileset ? tileset : [],
          0,
          0
        );
        // this.groundLayer = this.map.createBlankLayer('Layer 1', tileset);
        // this.stuffLayer = this.map.createBlankLayer('Stuff', tileset);

        console.log('tileset :>>>', tileset);
        console.log('groundLayer :>>>', this.groundLayer);
        // console.log('stuffLayer :>>>', this.stuffLayer);

        this.camera = this.cameras.main;

        let cameraDragStartX: number | undefined;
        let cameraDragStartY: number | undefined;

        this.input.on('pointerdown', () => {
          cameraDragStartX = this.camera?.x;
          cameraDragStartY = this.camera?.y;
        });

        this.input.on('pointermove', (pointer: any) => {
          if (pointer.isDown) {
            if (this.camera !== null) {
              this.camera.x = cameraDragStartX
                ? cameraDragStartX
                : 0 + (pointer.downX - pointer.x);
              this.camera.y = cameraDragStartY
                ? cameraDragStartY
                : 0 + (pointer.downY - pointer.y);
            }
          }
        });
      }
    }
  }

  update() {
    //
  }
}
