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
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
  playerIdelCount: number;

  constructor() {
    super('Dungeon');
    this.content = null;
    this.theme = 'demo';
    this.map = null;
    this.groundLayer = null;
    this.stuffLayer = null;
    this.camera = null;
    this.player = null;
    this.playerIdelCount = 0;
  }

  setTheme(theme: string) {
    this.theme = theme;
  }

  preload() {
    // Generate a part of dungeon
    this.content = new DungeonGenerator(this);

    // Load tiles
    this.load.image('tiles', '/assets/demo_tiles_test_48.png');
    this.load.spritesheet('demo-player', '/assets/demo_player_idle.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    const gameStore = useGameStore();
    const windowWidth = gameStore.getWindowWidth;
    const windowHeight = gameStore.getWindowHeight;
    const tileSize = gameStore.getTileSize;

    // Generate tileMap
    if (this.content !== null) {
      const room = this.content.level.find((room) => room.length);
      console.log('room :>>>', room);

      if (room) {
        this.map = this.make.tilemap({
          tileHeight: tileSize, // Need to match the height of the image for each tile
          tileWidth: tileSize, // Need to match the width of the image for each tile
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

        const limitWidth: number = room[0].length * tileSize;
        const limitHeight: number = room.length * tileSize;

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

        console.log(
          'player starting position: >>>',
          this.content.startingPoint
        );

        // Set up player
        this.player = this.physics.add.sprite(
          this.content.startingPoint[1] * tileSize,
          this.content.startingPoint[0] * tileSize,
          'demo-player'
        );

        // Set animation
        this.anims.create({
          key: 'player-idel',
          frames: this.anims.generateFrameNames('demo-player', {
            start: 0,
            end: 2,
          }),
          frameRate: 5,
          repeat: 0,
        });

        this.player.on('animationcomplete', (context: any) => {
          console.log('context :>>>', context);
          // Check animation name
          if (context.key === 'player-idel') {
            this.player?.anims.pause(); // Pause the animation
            this.playerIdelCount += 1;
            // Play the animation back and forth
            if (this.playerIdelCount % 2 === 0) {
              this.player?.anims.play('player-idel', true);
            } else {
              this.player?.anims.playReverse('player-idel');
            }
          }
        });

        // Play animation
        this.player.anims.play('player-idel', true);
      }
    }
  }

  update() {
    //
  }
}
