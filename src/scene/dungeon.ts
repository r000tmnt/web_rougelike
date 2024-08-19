import { Scene, Display, Events } from 'phaser';
import DungeonGenerator from 'src/utils/dungeonGenerator';
import { useGameStore } from 'src/stores/game';
import skeleton from 'src/data/skeleton';
import swordsman from 'src/data/swordsman';
import { calculateDamage, levelUp, setInitialStatus } from 'src/utils/battle';
import Skeleton from 'src/entity/skeleton';
import Player from 'src/entity/player';
// import { Direction, GridEngine } from 'grid-engine';

export default class Dungeon extends Scene {
  content: DungeonGenerator | null;
  eventEmitter: Phaser.Events.EventEmitter | undefined;
  theme: string;
  map: Phaser.Tilemaps.Tilemap | null;
  groundLayer: Phaser.Tilemaps.TilemapLayer | null;
  stuffLayer: Phaser.Tilemaps.TilemapLayer | null;
  camera: Phaser.Cameras.Scene2D.Camera | null;
  player: Player | null;
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

  // private gridEngine!: GridEngine;

  constructor() {
    super('Dungeon');
    this.content = null;
    this.eventEmitter = undefined;
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
    // Load sprite sheet atlas
    this.load.atlas(
      'demo_player',
      '/assets/atlas/demo_player_spritesheet.png',
      '/assets/atlas/demo_player_sprites.json'
    );

    this.load.atlas(
      'demo_enemy',
      '/assets/atlas/demo_enemy_spritesheet.png',
      '/assets/atlas/demo_enemy_sprites.json'
    );
  }

  create() {
    console.log('scene create');
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

    if (this.content && this.player && this.input.keyboard?.enabled) {
      this.enemies.forEach((enemy) => enemy.checkDistance(this.player?.sprite));

      const doorIndex = gameStore.getDoorIndex;

      if (doorIndex >= 0 && doorIndex < this.doors.length) {
        // console.log('checking overlap :>>>', doorIndex);
        if (!this.doors[doorIndex].body.embedded) {
          // console.log('Not overlapping');
          gameStore.setTextContent('');
          gameStore.setDoorIndex(-1);
          return;
        }
      }
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

    this.#setEventEmitter();

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
    if (this.content && this.map && this.groundLayer && this.eventEmitter) {
      console.log('player starting position: >>>', this.content.startingPoint);
      const playerX = this.content.startingPoint[1] * tileSize;
      const playerY = this.content.startingPoint[0] * tileSize;
      const gameStore = useGameStore();
      const playerData = gameStore.getPlayer;

      if (Object.entries(playerData).length) {
        // Create player from stored data
        this.player = new Player(
          this,
          playerX + this.offsetX,
          playerY + this.offsetY,
          'demo_player',
          playerData,
          this.groundLayer,
          this.content.level[this.content.roomIndex],
          tileSize,
          this.eventEmitter
        );
      } else {
        // Initialize player
        this.player = new Player(
          this,
          playerX + this.offsetX,
          playerY + this.offsetY,
          'demo_player',
          swordsman,
          this.groundLayer,
          this.content.level[this.content.roomIndex],
          tileSize,
          this.eventEmitter
        );
      }

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
      if (this.player.sprite)
        this.camera?.startFollow(this.player.sprite, true);

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
    }
  }

  #setEnemy(tileSize: number, gameStore: any) {
    // Set enemies
    if (this.content && this.player?.sprite && this.groundLayer) {
      const enemyPosition = this.content.enemyPositions[this.content.roomIndex];

      const storedEnemy = gameStore.getEnemyIntheRoom(this.content.roomIndex);

      // If there's no enemy in the gameStore
      if (!storedEnemy.length) {
        // Create new enemy
        const levelRange = [
          this.player.data.lv,
          this.player.data.lv + 1,
          this.player.data.lv + 2,
        ];

        console.log('levelRange :>>>', levelRange);

        for (let i = 0; i < enemyPosition.length; i++) {
          const enemy = new Skeleton(
            this,
            enemyPosition[i].x * tileSize + this.offsetX,
            enemyPosition[i].y * tileSize + this.offsetY,
            'demo_enemy',
            skeleton,
            i,
            this.player.sprite,
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
            'demo_enemy',
            storedEnemy[i],
            i,
            this.player.sprite,
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

  #setEventEmitter() {
    const gameStore = useGameStore();
    this.eventEmitter = new Events.EventEmitter();
    this.eventEmitter.on('open-door', () => {
      this.#updateContent(gameStore);
    });
    // this.eventEmitter.on('attack', (attacker: any, defender: any, skill?) => {
    //   const dmg = calculateDamage(attacker, defender)
    // })
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

      // Add collision to each other
      this.enemies.forEach((enemy, i) => {
        this.player?.addOverlap(enemy.sprite);
        const others = this.enemies.filter((e, n) => n !== i);

        others.forEach((o) => enemy.addCollision(o.sprite));
      });

      // Enable zone
      // create overlap
      this.doors.forEach((door, index) => {
        door.setOrigin(0, 0);
        this.physics.add.existing(door, false);
        if (door.body) door.body.moves = false;

        if (this.player?.sprite)
          this.physics.add.overlap(door, this.player?.sprite, () => {
            // console.log('overlap!');
            gameStore.setTextContent('[F] OPEN');
            gameStore.setDoorIndex(index);
          });
      });
    }
  }

  #updateContent(gameStore: any) {
    if (this.content) {
      const direction = this.content.doors[gameStore.doorIndex].direction;
      console.log(`Open the door ${direction}`);
      // Mark the room visited
      this.content.markRoomVisited(this.content.roomIndex);
      // Clear zones
      this.doors.splice(0);
      // Remove collider
      this.physics.world.colliders.destroy();
      // Remove layer
      this.groundLayer?.destroy();
      // Store player data
      gameStore.setPlayerStatus = this.player?.data;
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

      let roomIndex = -1;

      switch (direction) {
        case 'up':
          roomIndex = this.content.roomIndex - 3;
          break;
        case 'right':
          roomIndex = this.content.roomIndex + 1;
          break;
        case 'down':
          roomIndex = this.content.roomIndex + 3;
          break;
        case 'left':
          roomIndex = this.content.roomIndex - 1;
          break;
      }

      this.scene.restart({
        roomIndex: roomIndex,
        direction: direction,
        // And more...
      });
    }
  }
}
