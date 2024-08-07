import { Scene } from 'phaser';
import DungeonGenerator from 'src/utils/dungeonGenerator';
import { useGameStore } from 'src/stores/game';

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
    const gameStore = useGameStore();
    const windowWidth = gameStore.getWindowWidth;
    const windowHeight = gameStore.getWindowHeight;

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

        // Initialize the camera and limit the movement based on the size of the tileMap

        const limitWidth: number = room[0].length * 48;
        const limitHeight: number = room.length * 48;

        // Limit camera movement based on the size of the tileMap
        this.camera = this.cameras.main.setBounds(
          0,
          0,
          limitWidth,
          limitHeight
        );

        console.log('windowWidth :>>>', windowWidth);
        console.log('limitWidth :>>>', limitWidth);
        console.log('windowHeight :>>>', windowHeight);
        console.log('limitHeight :>>>', limitHeight);

        // If the map is smaller then the window, move the layer position
        if (limitWidth < windowWidth || limitHeight < windowHeight) {
          const offSetX =
            limitWidth < windowWidth
              ? (windowWidth - limitWidth) / 2
              : (limitWidth - windowWidth) / 2;

          const offSetY =
            limitHeight < windowHeight
              ? (windowHeight - limitHeight) / 2
              : (limitHeight - windowHeight) / 2;

          this.groundLayer?.setPosition(offSetX, offSetY);
          // this.camera.scrollX = -windowWidth / 2;
          // this.camera.scrollY = -windowHeight / 2;

          this.camera = this.cameras.main.setBounds(
            0,
            0,
            limitWidth + offSetX,
            limitHeight + offSetY
          );
        }

        // Listen to the mouse event
        this.input.on('pointermove', (pointer: any) => {
          if (pointer.isDown) {
            if (this.camera !== null) {
              this.camera.scrollX -=
                (pointer.x - pointer.prevPosition.x) / this.camera.zoom;
              this.camera.scrollY -=
                (pointer.y - pointer.prevPosition.y) / this.camera.zoom;
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
