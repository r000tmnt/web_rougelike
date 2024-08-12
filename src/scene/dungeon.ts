import { Scene, Display, Input } from 'phaser';
import DungeonGenerator from 'src/utils/dungeonGenerator';
import { useGameStore } from 'src/stores/game';
// import { Direction, GridEngine } from 'grid-engine';

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
  doors: Phaser.GameObjects.Zone[];
  doorAnchor: string[];
  doorTouching: number;

  private enteractKey!: Key | undefined;

  // private gridEngine!: GridEngine;

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
    this.doors = [];
    this.doorAnchor = [];
    this.doorTouching = -1;
  }

  setTheme(theme: string) {
    this.theme = theme;
  }

  init() {
    // Generate a part of dungeon
    this.content = new DungeonGenerator(this);
  }

  preload() {
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

    // Bind keyborad input
    this.enteractKey = this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.F);

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

          this.camera.scrollX -= this.offsetX;
          this.camera.scrollY -= this.offsetY;
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
              // this.camera.stopFollow();
              this.camera.scrollX -=
                (pointer.x - pointer.prevPosition.x) / this.camera.zoom;
              this.camera.scrollY -=
                (pointer.y - pointer.prevPosition.y) / this.camera.zoom;
            }
          } else {
            // this.camera?.startFollow(this.player);
          }
        });

        console.log(
          'player starting position: >>>',
          this.content.startingPoint
        );

        // Set collision on doors
        // this.doors = this.physics.add.staticGroup();
        this.content.doors.forEach((door) => {
          const doorX = door.col * tileSize;
          const doorY = door.row * tileSize;
          const halfHeight = tileSize / 2;
          // const doorCollide = this.doors
          //   ?.create(doorX + this.offsetX, doorY + this.offsetY)
          //   .setScale(1.5);
          // // Reset position origin
          // doorCollide.setOrigin(0, 0);
          this.doorAnchor.push(door.direction);
          switch (door.direction) {
            case 'up':
              {
                const sensor = this.add.zone(
                  doorX + this.offsetX,
                  doorY + this.offsetY + halfHeight,
                  tileSize,
                  tileSize
                );
                this.doors.push(sensor);
              }
              break;
            case 'right':
              {
                const sensor = this.add.zone(
                  doorX + this.offsetX - halfHeight,
                  doorY + this.offsetY,
                  tileSize,
                  tileSize
                );
                this.doors.push(sensor);
              }
              break;
            case 'down':
              {
                const sensor = this.add.zone(
                  doorX + this.offsetX,
                  doorY + this.offsetY - halfHeight,
                  tileSize,
                  tileSize
                );
                this.doors.push(sensor);
              }
              break;
            case 'left':
              {
                const sensor = this.add.zone(
                  doorX + this.offsetX + halfHeight,
                  doorY + this.offsetY,
                  tileSize,
                  tileSize
                );
                this.doors.push(sensor);
              }
              break;
          }

          // this.groundLayer.setTileIndexCallback(2, this.#doorHit, this);
        });
        // Set up player
        const playerX = this.content.startingPoint[1] * tileSize;
        const playerY = this.content.startingPoint[0] * tileSize;
        this.player = this.physics.add.sprite(
          playerX + this.offsetX,
          playerY + this.offsetY,
          'demo-player'
        );

        this.player.setOrigin(0, 0);
        // this.player.setCollideWorldBounds(true);

        // Check player position
        if (
          this.player.x - this.offsetX !== playerX ||
          this.player.y - this.offsetY !== playerY
        ) {
          this.player.setPosition(
            playerX + this.offsetX,
            playerY + this.offsetY
          );
        }

        console.log('player :>>>', this.player);

        // Set animation
        this.anims.create({
          key: 'player-idel',
          frames: this.anims.generateFrameNames('demo-player', {
            start: 0,
            end: 0,
          }),
          frameRate: 5,
          repeat: 0,
        });

        this.anims.create({
          key: 'player-walk-left',
          frames: this.anims.generateFrameNames('demo-player', {
            start: 3,
            end: 5,
          }),
          frameRate: 5,
          repeat: -1,
        });

        // this.player.on('animationcomplete', (context: any) => {
        //   // console.log('context :>>>', context);
        //   // Check animation name
        //   if (context.key === 'player-idel') {
        //     this.player?.anims.pause(); // Pause the animation
        //     this.playerIdelCount += 1;
        //     // Play the animation back and forth
        //     if (this.playerIdelCount % 2 === 0) {
        //       this.player?.anims.play('player-idel', true);
        //     } else {
        //       this.player?.anims.playReverse('player-idel');
        //     }
        //   }
        // });

        // Play animation
        this.player.anims.play('player-idel', true);

        // Set the camera to follow the player
        this.camera.startFollow(this.player, true);

        // Init key events
        this.cursor = this.input.keyboard?.createCursorKeys();

        // Set collision
        this.groundLayer?.setCollisionBetween(
          1,
          room.length * room[0].length,
          true,
          false
        );
        this.physics.add.collider(this.groundLayer, this.player);
        this.physics.world.bounds.width = limitWidth + this.offsetX;
        this.physics.world.bounds.height = limitHeight + this.offsetY;
        this.player.setCollideWorldBounds(true);

        // Enable zoom
        this.doors.forEach((door, index) => {
          door.setOrigin(0, 0);
          this.physics.add.existing(door, false);
          if (door.body) door.body.moves = false;

          this.physics.add.overlap(door, this.player, (player, zone) => {
            console.log('overlap!');
            gameStore.setTextContent('OPEN (F)');
            this.doorTouching = index;
          });
        });

        // Show the collide tiles and none collide tiles for debug
        // const tileColor = new Display.Color(105, 210, 231, 200);
        // const colldingTileColor = new Display.Color(243, 134, 48, 200);
        // const faceColor = new Display.Color(40, 39, 37, 255);
        // this.map.renderDebug(this.add.graphics(), {
        //   tileColor: tileColor, // Non-colliding tiles
        //   collidingTileColor: colldingTileColor, // Colliding tiles
        //   faceColor: faceColor, // Interesting faces, i.e. colliding edges
        // });

        // Config grid movement & player
        // try {
        //   this.gridEngine.create(this.map, {
        //     characters: [
        //       {
        //         id: 'player',
        //         sprite: this.player,
        //         walkingAnimationMapping: 0,
        //         startPosition: {
        //           x: playerX + this.offsetX,
        //           y: playerY + this.offsetY,
        //         },
        //       },
        //     ],
        //   });
        // } catch (error) {
        //   console.log('failed to use grid-engine :>>>', error);
        // }
      }
    }
  }

  update() {
    const gameStore = useGameStore();
    const tileSize = gameStore.getTileSize;

    // let walkingDistance = 0

    if (this.content) {
      // const room = this.content.roomIndex;
      // Listen to key press
      if (this.cursor?.left.isDown) {
        this.player?.setVelocityX(-tileSize * 2.5);
        this.player?.setFlipX(false);
        this.player?.anims.play('player-walk-left', true);
        // this.#watchAnimation('left', tileSize, room);
        // this.gridEngine.move('player', Direction.LEFT);
      } else if (this.cursor?.right.isDown) {
        this.player?.setVelocityX(tileSize * 2.5);
        this.player?.setFlipX(true);
        this.player?.anims.play('player-walk-left', true);
        // this.#watchAnimation('right', tileSize, room);
        // this.gridEngine.move('player', Direction.RIGHT);
      } else if (this.cursor?.up.isDown) {
        this.player?.setVelocityY(-tileSize * 2.5);
        // this.#watchAnimation('up', tileSize, room);
        // this.gridEngine.move('player', Direction.UP);
      } else if (this.cursor?.down.isDown) {
        this.player?.setVelocityY(tileSize * 2.5);
        // this.#watchAnimation('down', tileSize, room);
        // this.gridEngine.move('player', Direction.DOWN);
      } else {
        this.player?.setVelocityX(0);
        this.player?.setVelocityY(0);
        this.player.anims.play('player-idel', true);
      }

      if (this.doorTouching >= 0 && this.doors !== undefined) {
        console.log('checking overlap :>>>');
        if (!this.doors[this.doorTouching].body.embedded) {
          gameStore.setTextContent('');
          this.doorTouching = -1;
        }

        if (this.enteractKey.isDown) {
          console.log(`Open the door ${this.doorAnchor[this.doorTouching]}`);

          switch (this.doorAnchor[this.doorTouching]) {
            case 'up':
              break;
            case 'right':
              break;
            case 'down':
              break;
            case 'left':
              break;
          }
        }
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
