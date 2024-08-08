import { Scene } from 'phaser';
import DungeonGenerator from 'src/utils/dungeonGenerator';
import { useGameStore } from 'src/stores/game';
import { Direction, GridEngine } from 'grid-engine';

export default class Dungeon extends Scene {
  content: DungeonGenerator | null;
  theme: string;
  map: Phaser.Tilemaps.Tilemap | null;
  groundLayer: Phaser.Tilemaps.TilemapLayer | null;
  stuffLayer: Phaser.Tilemaps.TilemapLayer | null;
  camera: Phaser.Cameras.Scene2D.Camera | null;
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
  playerIdelCount: number;
  offsetX: number;
  offsetY: number;
  cursor: Phaser.Types.Input.Keyboard.CursorKeys | undefined;

  private gridEngine!: GridEngine;

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
    this.offsetX = 0;
    this.offsetY = 0;
    this.cursor = undefined;
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
      frameWidth: 44,
      frameHeight: 42,
    });
  }

  create() {
    const gameStore = useGameStore();
    const windowWidth = gameStore.getWindowWidth;
    const windowHeight = gameStore.getWindowHeight;
    const tileSize = gameStore.getTileSize;

    // Generate tileMap
    if (this.content !== null) {
      const room = this.content?.level[this.content.roomIndex];
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

        console.log('windowWidth :>>>', windowWidth);
        console.log('limitWidth :>>>', limitWidth);
        console.log('windowHeight :>>>', windowHeight);
        console.log('limitHeight :>>>', limitHeight);

        // If the map is smaller then the window, move the layer position
        if (limitWidth < windowWidth || limitHeight < windowHeight) {
          this.offsetX =
            limitWidth < windowWidth
              ? Math.floor((windowWidth - limitWidth) / 2)
              : Math.floor((limitWidth - windowWidth) / 2);

          this.offsetY =
            limitHeight < windowHeight
              ? Math.floor((windowHeight - limitHeight) / 2)
              : Math.floor((limitHeight - windowHeight) / 2);

          this.groundLayer?.setPosition(this.offsetX, this.offsetY);

          console.log('off set x :>>>', this.offsetX);
          console.log('off set y :>>>', this.offsetY);

          this.camera = this.cameras.main.setBounds(
            0,
            0,
            limitWidth + this.offsetX,
            limitHeight + this.offsetY
          );
        } else {
          // Limit camera movement based on the size of the tileMap
          this.camera = this.cameras.main.setBounds(
            0,
            0,
            limitWidth,
            limitHeight
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
        const playerX = this.content.startingPoint[1] * tileSize;
        const playerY = this.content.startingPoint[0] * tileSize;
        this.player = this.physics.add.sprite(0, 0, 'demo-player');

        this.player.setOrigin(0, 0);
        this.player.setCollideWorldBounds(true);
        console.log('player :>>>', this.player);

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
          // console.log('context :>>>', context);
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

        // Set the camera to follow the player
        this.camera.startFollow(this.player, true);

        // Init key events
        this.cursor = this.input.keyboard?.createCursorKeys();

        // Config grid movement & player
        try {
          this.gridEngine.create(this.map, {
            characters: [
              {
                id: 'player',
                sprite: this.player,
                walkingAnimationMapping: 0,
                startPosition: {
                  x: playerX + this.offsetX,
                  y: playerY + this.offsetY,
                },
              },
            ],
          });
        } catch (error) {
          console.log('failed to use grid-engine :>>>', error);
        }
      }
    }
  }

  update() {
    // const gameStore = useGameStore();
    // const tileSize = gameStore.getTileSize;

    // let walkingDistance = 0

    if (this.content) {
      // Listen to key press
      if (this.cursor?.left.isDown) {
        this.gridEngine.move('player', Direction.LEFT);
      } else if (this.cursor?.right.isDown) {
        this.gridEngine.move('player', Direction.RIGHT);
      } else if (this.cursor?.up.isDown) {
        this.gridEngine.move('player', Direction.UP);
      } else if (this.cursor?.down.isDown) {
        this.gridEngine.move('player', Direction.DOWN);
      }
    }
  }

  #getPosition(target: any, tileSize: number) {
    const { x, y } = target;
    const row = Math.floor((y - this.offsetY) / tileSize);
    const col = Math.floor((x - this.offsetX) / tileSize);

    return { row, col };
  }
}
