import { Scene, Display, Input } from 'phaser';
import DungeonGenerator from 'src/utils/dungeonGenerator';
import { useGameStore } from 'src/stores/game';
import skeleton from 'src/data/skeleton';
import { levelUp, setInitialStatus } from 'src/utils/battle';
import Skeleton from 'src/entity/skeleton';
import { enemy } from 'src/model/character';
// import { Direction, GridEngine } from 'grid-engine';

export default class Dungeon extends Scene {
  content: DungeonGenerator | null;
  theme: string;
  map: Phaser.Tilemaps.Tilemap | null;
  groundLayer: Phaser.Tilemaps.TilemapLayer | null;
  stuffLayer: Phaser.Tilemaps.TilemapLayer | null;
  camera: Phaser.Cameras.Scene2D.Camera | null;
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
  playerIdleCount: number;
  offsetX: number;
  offsetY: number;
  cursor: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  doors: Phaser.GameObjects.Zone[];
  doorTouching: number;
  enemies: Skeleton[];
  enemyContact: number;
  limitWidth: number;
  limitHeight: number;

  private fKey!: Input.Keyboard.Key | undefined;
  private iKey!: Input.Keyboard.Key | undefined;
  private cKey!: Input.Keyboard.Key | undefined;

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
    this.playerIdleCount = 0;
    this.enemies = [];
    this.offsetX = 0;
    this.offsetY = 0;
    this.cursor = undefined;
    this.doors = [];
    this.doorTouching = -1;
    this.enemyContact = -1;
    this.limitWidth = 0;
    this.limitHeight = 0;
  }

  setTheme(theme: string) {
    this.theme = theme;
  }

  init(data: any | undefined) {
    console.log('scene init');

    // Generate a part of dungeon
    if (Object.entries(data).length) {
      // Restart scene with new data
      console.log('init with new data :>>>', data);

      const { roomIndex, direction } = data;
      // Create a new map or load existing content
      this.content?.setRoom(roomIndex, direction);
    } else {
      const gameStore = useGameStore();
      const tileSize = gameStore.getTileSize;

      this.content = new DungeonGenerator(tileSize);
    }
  }

  preload() {
    console.log('scene preload');

    const gameStore = useGameStore();
    const tileSize = gameStore.getTileSize;

    // Load tiles
    this.load.image('tiles', '/assets/demo_tiles_test_48.png');
    this.load.spritesheet('demo-player', '/assets/demo_player_idle.png', {
      frameWidth: tileSize,
      frameHeight: tileSize,
    });
    this.load.spritesheet('demo-enemy', '/assets/demo_enemy_idle.png', {
      frameWidth: tileSize,
      frameHeight: tileSize,
    });
  }

  create() {
    console.log('scene create');

    // Bind keyborad input
    this.fKey = this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.F);

    // Generate tileMap
    if (
      this.content !== null &&
      this.content.ready &&
      this.content.level[this.content.roomIndex].length
    ) {
      this.#setUpDungeon();
      // Listen to the mouse event
      // this.input.on('pointermove', (pointer: any) => {
      //   if (pointer.isDown) {
      //     if (this.camera !== null) {
      //       // this.camera.stopFollow();
      //       this.camera.scrollX -=
      //         (pointer.x - pointer.prevPosition.x) / this.camera.zoom;
      //       this.camera.scrollY -=
      //         (pointer.y - pointer.prevPosition.y) / this.camera.zoom;
      //     }
      //   } else {
      //     // this.camera?.startFollow(this.player);
      //   }
      // });

      // Init key events
      if (this.input.keyboard) this.input.keyboard.enabled = true;
      this.cursor = this.input.keyboard?.createCursorKeys();

      // Show the collide tiles and none collide tiles for debug
      // const tileColor = new Display.Color(105, 210, 231, 200);
      // const colldingTileColor = new Display.Color(243, 134, 48, 200);
      // const faceColor = new Display.Color(40, 39, 37, 255);
      // this.map.renderDebug(this.add.graphics(), {
      //   tileColor: tileColor, // Non-colliding tiles
      //   collidingTileColor: colldingTileColor, // Colliding tiles
      //   faceColor: faceColor, // Interesting faces, i.e. colliding edges
      // });
    } else {
      // Wait for dungeon generator
      const dungeonGeneratorWatcher = setInterval(() => {
        if (this.content?.ready) {
          clearInterval(dungeonGeneratorWatcher);
          this.create();
        }
      }, 100);
    }
  }

  update() {
    // console.log('scene update');

    const gameStore = useGameStore();
    const tileSize = gameStore.getTileSize;

    if (
      this.content &&
      this.cursor &&
      this.player &&
      this.input.keyboard?.enabled
    ) {
      // const room = this.content.roomIndex;
      // Listen to key press
      if (this.cursor.left.isDown) {
        this.player.setVelocityX(-tileSize * 2.5);
        this.player.setFlipX(false);
        this.player.anims.play('player-walk-left', true);
        // this.gridEngine.move('player', Direction.LEFT);
      } else if (this.cursor?.right.isDown) {
        this.player.setVelocityX(tileSize * 2.5);
        this.player.setFlipX(true);
        this.player.anims.play('player-walk-left', true);
        // this.gridEngine.move('player', Direction.RIGHT);
      } else if (this.cursor?.up.isDown) {
        this.player.setVelocityY(-tileSize * 2.5);
        // this.gridEngine.move('player', Direction.UP);
      } else if (this.cursor?.down.isDown) {
        this.player.setVelocityY(tileSize * 2.5);
        // this.gridEngine.move('player', Direction.DOWN);
      } else {
        this.player.body.setVelocity(0);
        this.player.anims.play('player-idle', true);
      }

      if (this.doorTouching >= 0 && this.doorTouching < this.doors.length) {
        // console.log('checking overlap :>>>', this.doorTouching);
        if (!this.doors[this.doorTouching].body.embedded) {
          // console.log('Not overlapping');
          gameStore.setTextContent('');
          this.doorTouching = -1;
          return;
        }

        // If F key press detected
        if (this.fKey && this.fKey.isDown) {
          console.log(
            `Open the door ${this.content.doors[this.doorTouching].direction}`
          );

          // Mark the room cleared?
          this.content.markRoomCleared(this.content.roomIndex);

          switch (this.content.doors[this.doorTouching].direction) {
            case 'up':
              this.#updateContent(this.content.roomIndex - 3, gameStore);
              break;
            case 'right':
              this.#updateContent(this.content.roomIndex + 1, gameStore);
              break;
            case 'down':
              this.#updateContent(this.content.roomIndex + 3, gameStore);
              break;
            case 'left':
              this.#updateContent(this.content.roomIndex - 1, gameStore);
              break;
          }
        }
      }

      this.enemies.forEach((enemy) => enemy.checkDistance(this.player));
    }

    // Check the distance between the player and enemies
  }

  /**
   * Render the dungeon based from the two-dimentional array from the generator and setting up playerm, camera, collision...etc
   */
  #setUpDungeon() {
    const gameStore = useGameStore();
    const windowWidth = gameStore.getWindowWidth;
    const windowHeight = gameStore.getWindowHeight;
    const tileSize = gameStore.getTileSize;

    const room = this.#getRoom(tileSize);
    console.log('room :>>>', room);

    this.#setTileMap(room, tileSize);
    console.log('map :>>>', this.map);

    this.#setCamera(windowWidth, windowHeight);

    // Set collision on doors
    this.#setDoorZones(tileSize);

    // Set up player
    this.#setPlayer(tileSize);

    // Set up enemy
    this.#setEnemy(tileSize, gameStore);

    // Set collision on tileMap and enable zones
    this.#setCollision(room, gameStore);
  }

  #getRoom(tileSize: number) {
    const room = this.content?.level[this.content.roomIndex];

    if (room) {
      this.limitWidth = room[0].length * tileSize;
      this.limitHeight = room.length * tileSize;

      return room;
    } else {
      return [];
    }
  }

  #setTileMap(room: number[][], tileSize: number) {
    this.map = this.make.tilemap({
      tileHeight: tileSize, // Need to match the height of the image for each tile
      tileWidth: tileSize, // Need to match the width of the image for each tile
      data: room,
    });

    console.log('map :>>>', this.map);

    const tileset = this.map.addTilesetImage('tiles');

    // Create a new layer
    this.groundLayer = this.map.createLayer(0, tileset ? tileset : [], 0, 0);
    // this.stuffLayer = this.map.createBlankLayer('Stuff', tileset);

    console.log('tileset :>>>', tileset);
    console.log('groundLayer :>>>', this.groundLayer);
    console.log('groundLayer tileset :>>>', this.groundLayer?.tileset);
    // console.log('stuffLayer :>>>', this.stuffLayer);
  }

  #setCamera(windowWidth: number, windowHeight: number) {
    console.log('windowWidth :>>>', windowWidth);
    console.log('limitWidth :>>>', this.limitWidth);
    console.log('windowHeight :>>>', windowHeight);
    console.log('limitHeight :>>>', this.limitHeight);

    // If the map is smaller then the window, move the layer position
    if (this.limitWidth < windowWidth || this.limitHeight < windowHeight) {
      this.offsetX =
        this.limitWidth < windowWidth
          ? Math.floor((windowWidth - this.limitWidth) / 2)
          : Math.floor((this.limitWidth - windowWidth) / 2);

      this.offsetY =
        this.limitHeight < windowHeight
          ? Math.floor((windowHeight - this.limitHeight) / 2)
          : Math.floor((this.limitHeight - windowHeight) / 2);

      this.groundLayer?.setPosition(this.offsetX, this.offsetY);

      console.log('off set x :>>>', this.offsetX);
      console.log('off set y :>>>', this.offsetY);
    }

    // Initialize camera
    this.camera = this.cameras.main.setBounds(
      0,
      0,
      this.limitWidth + this.offsetX,
      this.limitHeight + this.offsetY
    );

    this.camera.scrollX -= this.offsetX;
    this.camera.scrollY -= this.offsetY;
  }

  #setDoorZones(tileSize: number) {
    this.content?.doors.forEach((door) => {
      const doorX = door.col * tileSize;
      const doorY = door.row * tileSize;
      const halfHeight = tileSize / 2;

      switch (door.direction) {
        case 'up':
          this.doors.push(
            this.add.zone(
              doorX + this.offsetX,
              doorY + this.offsetY + halfHeight,
              tileSize,
              tileSize
            )
          );
          break;
        case 'right':
          this.doors.push(
            this.add.zone(
              doorX + this.offsetX - halfHeight,
              doorY + this.offsetY,
              tileSize,
              tileSize
            )
          );
          break;
        case 'down':
          this.doors.push(
            this.add.zone(
              doorX + this.offsetX,
              doorY + this.offsetY - halfHeight,
              tileSize,
              tileSize
            )
          );
          break;
        case 'left':
          this.doors.push(
            this.add.zone(
              doorX + this.offsetX + halfHeight,
              doorY + this.offsetY,
              tileSize,
              tileSize
            )
          );
          break;
      }

      // this.groundLayer.setTileIndexCallback(2, this.#doorHit, this);
    });
  }

  #setPlayer(tileSize: number) {
    if (this.content && this.map) {
      console.log('player starting position: >>>', this.content.startingPoint);
      const playerX = this.content.startingPoint[1] * tileSize;
      const playerY = this.content.startingPoint[0] * tileSize;

      // Initialize player
      this.player = this.physics.add.sprite(
        playerX + this.offsetX,
        playerY + this.offsetY,
        'demo-player'
      );
      // this.player = this.physics.add.sprite(0, 0, 'demo-player');

      this.player.setOrigin(0, 0);
      this.player.setPushable(false);
      // Set animation
      this.anims.create({
        key: 'player-idle',
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
      //   if (context.key === 'player-idle') {
      //     this.player?.anims.pause(); // Pause the animation
      //     this.playerIdleCount += 1;
      //     // Play the animation back and forth
      //     if (this.playerIdleCount % 2 === 0) {
      //       this.player?.anims.play('player-idle', true);
      //     } else {
      //       this.player?.anims.playReverse('player-idle');
      //     }
      //   }
      // });

      console.log('player :>>>', this.player);

      // Set the camera to follow the player
      this.camera?.startFollow(this.player, true);

      // Play animation
      this.player.anims.play('player-idle', true);

      // Config grid movement & player
      // try {
      //   this.gridEngine.create(this.map, {
      //     characters: [
      //       {
      //         id: 'player',
      //         sprite: this.player,
      //         walkingAnimationMapping: 0,
      //         startPosition: {
      //           x: this.content.startingPoint[1] + this.offsetX / tileSize,
      //           y: this.content.startingPoint[0] + this.offsetY / tileSize,
      //         },
      //       },
      //     ],
      //   });
      // } catch (error) {
      //   console.log('failed to use grid-engine :>>>', error);
      // }

      // Check player position
      // this.player.setPosition(playerX + this.offsetX, playerY + this.offsetY);
    }
  }

  #setEnemy(tileSize: number, gameStore: any) {
    // Set enemies
    if (this.content && this.player && this.groundLayer) {
      const enemyPosition = this.content.enemyPositions[this.content.roomIndex];

      const storedEnemy = gameStore.getEnemyIntheRoom(this.content.roomIndex);

      // If there's no enemy in the gameStore
      if (!storedEnemy.length) {
        // Create new enemy
        const levelRange = [
          gameStore.player.lv,
          gameStore.player.lv + 1,
          gameStore.player.lv + 2,
        ];

        console.log('levelRange :>>>', levelRange);

        for (let i = 0; i < enemyPosition.length; i++) {
          const enemy = new Skeleton(
            this,
            enemyPosition[i].x * tileSize + this.offsetX,
            enemyPosition[i].y * tileSize + this.offsetY,
            'demo-enemy',
            skeleton,
            i,
            this.player,
            this.groundLayer,
            this.content.level[this.content.roomIndex],
            tileSize
          );

          const randomLv =
            levelRange[Math.floor(Math.random() * levelRange.length)];

          let newEnemyData = JSON.parse(JSON.stringify(skeleton));

          newEnemyData = setInitialStatus(newEnemyData, randomLv);

          // console.log('new enemy entity :>>>', enemy);
          console.log('new enemy data :>>>', newEnemyData);

          enemy.updateData(newEnemyData);

          this.enemies.push(enemy);
        }
      } else {
        // Create enemy from stored data
        for (let i = 0; i < enemyPosition.length; i++) {
          const enemy = new Skeleton(
            this,
            enemyPosition[i].x * tileSize + this.offsetX,
            enemyPosition[i].y * tileSize + this.offsetY,
            'demo-enemy',
            storedEnemy[i],
            i,
            this.player,
            this.groundLayer,
            this.content.level[this.content.roomIndex],
            tileSize
          );

          console.log('stored enemy data :>>>', storedEnemy[i]);

          this.enemies.push(enemy);
        }
      }
    }
  }

  #setCollision(room: number[][], gameStore: any) {
    // Set collision
    if (this.groundLayer && this.player && this.content) {
      this.groundLayer?.setCollisionBetween(
        1,
        room.length * room[0].length,
        true,
        false
      );

      // Create collider
      this.physics.add.collider(this.groundLayer, this.player);
      this.physics.world.bounds.width = this.limitWidth + this.offsetX;
      this.physics.world.bounds.height = this.limitHeight + this.offsetY;
      this.player?.setCollideWorldBounds(true);

      // Add collision to each other
      this.enemies.forEach((enemy, i) => {
        enemy.sprite?.setCollideWorldBounds(true);
        const others = this.enemies.filter((e, n) => n !== i);

        others.forEach((o) => enemy.addCollision(o.sprite));
      });

      // Enable zone
      // create overlap
      this.doors.forEach((door, index) => {
        door.setOrigin(0, 0);
        this.physics.add.existing(door, false);
        if (door.body) door.body.moves = false;

        this.physics.add.overlap(door, this.player, (player, zone) => {
          // console.log('overlap!');
          gameStore.setTextContent('[F] OPEN');
          this.doorTouching = index;
        });
      });
    }
  }

  #updateContent(roomIndex: number, gameStore: any) {
    if (this.content) {
      // Clear zones
      this.doors.splice(0);
      // Remove collider
      this.physics.world.colliders.destroy();
      // Remove layer
      this.groundLayer?.destroy();
      // Keep enemies if any
      if (this.enemies.length) {
        const copy = this.enemies.map((e) => {
          if (e.sprite)
            // Update position
            e.data.position = {
              x: e.sprite.x - this.offsetX,
              y: e.sprite.y - this.offsetY,
            };

          return e.data;
        });
        gameStore.storeEnemyIntheRoom(copy, this.content.roomIndex);
      }
      // Reset offset
      this.offsetX = 0;
      this.offsetY = 0;
      // Clear enemy array
      this.enemies.splice(0);
      // Disable key input event
      if (this.input.keyboard) this.input.keyboard.enabled = false;

      this.scene.restart({
        roomIndex: roomIndex,
        direction: this.content.doors[this.doorTouching].direction,
        // And more...
      });
    }
  }

  #getPosition(target: any, tileSize: number) {
    const { x, y } = target;
    const row = Math.floor((y - this.offsetY) / tileSize);
    const col = Math.floor((x - this.offsetX) / tileSize);

    return { row, col };
  }
}
