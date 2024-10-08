import { Scene, Display, Events } from 'phaser';
import DungeonGenerator from 'src/utils/dungeonGenerator';
import { useGameStore } from 'src/stores/game';
import skeleton from 'src/data/skeleton';
import swordsman from 'src/data/swordsman';
import { setInitialStatus } from 'src/utils/battle';
import Skeleton from 'src/entity/skeleton';
import Player from 'src/entity/player';
// import { Direction, GridEngine } from 'grid-engine';
import PhaserRaycaster from 'phaser-raycaster';
import { PhaserNavMeshPlugin } from 'phaser-navmesh';
import phaserJuice from '../lib/phaserJuice.min.js';
export default class Dungeon extends Scene {
  content: DungeonGenerator | null;
  theme: string;
  map: Phaser.Tilemaps.Tilemap | null;
  groundLayer: Phaser.Tilemaps.TilemapLayer | null;
  stuffLayer: Phaser.Tilemaps.TilemapLayer | null;
  camera: Phaser.Cameras.Scene2D.Camera | null;
  player: Player | null;
  playerIdleCount: number;
  offsetX: number;
  offsetY: number;
  cursor: Phaser.Types.Input.Keyboard.CursorKeys | null;
  doors: Phaser.GameObjects.Zone[];
  doorTouching: number;
  enemies: Skeleton[];
  enemyContact: number;
  limitWidth: number;
  limitHeight: number;
  raycaster: Raycaster | null;
  navMesh: any;

  // private gridEngine!: GridEngine;
  private raycasterPlugin!: PhaserRaycaster;
  private navMeshPlugin!: PhaserNavMeshPlugin;
  private juice!: phaserJuice;
  private eventsToRemove!: string[];

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
    this.cursor = null;
    this.doors = [];
    this.doorTouching = -1;
    this.enemyContact = -1;
    this.limitWidth = 0;
    this.limitHeight = 0;
    this.raycaster = null;
    this.eventsToRemove = [
      'chase-countdown-start',
      'chase-countdown-calling',
      'player-equip',
      'player-unequip',
      'open-door',
      'reset',
    ];
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

      gameStore.setCurrentScene(2);

      this.content = new DungeonGenerator(tileSize);
    }
  }

  preload() {
    console.log('scene preload');

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

  /**
   * Render the dungeon based from the two-dimentional array from the generator and setting up playerm, camera, collision...etc
   */
  create() {
    console.log('scene create');
    // Generate tileMap
    if (
      this.content !== null &&
      this.content.ready &&
      this.content.level[this.content.roomIndex].length
    ) {
      this.physics.resume();
      this.juice = new phaserJuice(this);

      console.log('phaser juice :>>>', this.juice);

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

      this.#setRayCaster();

      this.#setNavMesh();

      // Set collision on doors
      this.#setDoorZones(tileSize);

      // Set up player
      this.#setPlayer(tileSize);

      // Set up enemy
      this.#setEnemy(tileSize, gameStore);

      // Set collision on tileMap and enable zones
      this.#setCollision(room, gameStore);

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

    // Check the distance between the player and enemies
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

    this.groundLayer?.setCollisionBetween(
      1,
      room.length * room[0].length,
      true,
      false
    );

    // console.log('tileset :>>>', tileset);
    console.log('groundLayer :>>>', this.groundLayer);
    // console.log('groundLayer tileset :>>>', this.groundLayer?.tileset);
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

  #setRayCaster() {
    const bounds = this.groundLayer?.getBounds();

    // Init raycaster
    this.raycaster = this.raycasterPlugin.createRaycaster({
      boundingBox: bounds,
      debug: {
        enabled: true, //enable debug mode
        maps: true, //enable maps debug
        rays: true, //enable rays debug
        graphics: {
          ray: 0x00ff00, //debug ray color; set false to disable
          rayPoint: 0xff00ff, //debug ray point color; set false to disable
          mapPoint: 0x00ffff, //debug map point color; set false to disable
          mapSegment: 0x0000fe, //debug map segment color; set false to disable
          mapBoundingBox: 0xff0000, //debug map bounding box color; set false to disable
        },
      },
    });

    // Set raycaster to collide with the tileMap
    this.raycaster.mapGameObjects(this.groundLayer, false, {
      collisionTiles: [1, 2],
    });
  }

  #setNavMesh() {
    // Automatically generate mesh from colliding tiles in a layer or layers:
    this.navMesh = this.navMeshPlugin.buildMeshFromTilemap('mesh', this.map, [
      this.groundLayer,
    ]);

    console.log('navMesh :>>>', this.navMesh);
    // const path = navMesh.findPath({ x: 0, y: 0 }, { x: 300, y: 400 });
    // ⮡  path will either be null or an array of Phaser.Geom.Point objects

    // Alternatively, you can load a navmesh created by hand in Tiled that is stored in an object
    // layer. See the creating a navmesh guide for more info on this.
    // const objectLayer = tilemap.getObjectLayer("navmesh");
    // const navMesh = this.navMeshPlugin.buildMeshFromTiled("mesh1", objectLayer, 12.5);

    // this.navMesh.enableDebug(); // Creates a Phaser.Graphics overlay on top of the screen
    // this.navMesh.debugDrawClear(); // Clears the overlay
    // // Visualize the underlying navmesh
    // this.navMesh.debugDrawMesh({
    //   drawCentroid: true,
    //   drawBounds: false,
    //   drawNeighbors: true,
    //   drawPortals: true,
    // });

    // this.navMesh.debugGraphics.x = this.groundLayer?.x;
    // this.navMesh.debugGraphics.y = this.groundLayer?.y;

    // Adjust the position of nodes and poligons
    // this.navMesh.graph.nodes.forEach(node => {
    //   node.centroid.x += this.offsetX
    //   node.centroid.y += this.offsetY

    //   node.edges.forEach(edge => {
    //     edge.bottom += this.offsetY
    //     edge.end.x += this.offsetX
    //     edge.end.y += this.offsetY
    //     edge.left += this.offsetX
    //     edge.right += this.offsetX
    //     edge.start.x += this.offsetX
    //     edge.start.y += this.offsetY
    //     edge.top += this.offsetY
    //   });

    //   node.neighbors.forEach(neighbor => {
    //     neighbor.centroid.x += this.offsetX
    //     neighbor.centroid.y += this.offsetY

    //     neighbor.edges.forEach(nedge => {
    //       nedge.bottom += this.offsetY
    //       nedge.end.x += this.offsetX
    //       nedge.end.y += this.offsetY
    //       nedge.left += this.offsetX
    //       nedge.right += this.offsetX
    //       nedge.start.x += this.offsetX
    //       nedge.start.y += this.offsetY
    //       nedge.top += this.offsetY
    //     });
    //   });
    // });

    // this.navMesh.debugGraphics.displayOriginX = this.offsetX;
    // this.navMesh.debugGraphics.displayOriginY = this.offsetY;
    // Visualize an individual path
    // this.navMesh.debugDrawPath(path, 0xffd900);
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
    if (this.content && this.map && this.groundLayer) {
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
          false
        );
        this.player.data = playerData;
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
          tileSize
        );
      }

      console.log('player :>>>', this.player);
      gameStore.setPlayerStatus(this.player.data);

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
    if (
      this.content &&
      this.player?.sprite &&
      this.groundLayer &&
      this.raycaster
    ) {
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
            tileSize,
            this.navMesh
          );

          const randomLv =
            levelRange[Math.floor(Math.random() * levelRange.length)];

          let newEnemyData = JSON.parse(JSON.stringify(skeleton));

          newEnemyData = setInitialStatus(
            newEnemyData,
            randomLv,
            this.player?.data.lv
          );

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
            tileSize,
            this.navMesh
          );

          console.log('stored enemy data :>>>', storedEnemy[i]);

          this.enemies.push(enemy);
        }
      }

      this.#storeEnemyData(gameStore);
    }
  }

  #setEventEmitter() {
    const gameStore = useGameStore();
    gameStore.emitter.on('open-door', () => {
      this.physics.pause();
      this.#updateContent(gameStore);
    });

    gameStore.emitter.on('reset', () => {
      // this.physics.pause();
      this.#updateContent(gameStore, true);
    });
  }

  #setCollision(room: number[][], gameStore: any) {
    // Set collision
    if (this.player) {
      // Add collision to each other
      this.enemies.forEach((enemy, i) => {
        this.player?.addOverlap(enemy.sprite);
        this.player?.addCollision(enemy.sprite);
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

  #updateContent(gameStore: any, restart = false) {
    if (this.content) {
      // Clear zones
      this.doors.splice(0);
      // Remove collider
      this.physics.world.colliders.destroy();
      //remove mapped objects
      // this.raycaster?.removeMappedObjects(this.groundLayer);
      // Store player data
      gameStore.setPlayerStatus(this.player?.data);
      // Destory ray
      this.enemies.forEach((e) => {
        e.ray?.destroy();
      });
      // Keep enemies if any
      this.#storeEnemyData(gameStore);
      // destroy raycaster
      this.raycaster?.destroy();
      // Remove layer
      this.groundLayer?.destroy();
      // Destroy navMesh
      this.navMesh = null;
      // // Remove all scene event listener
      // gameStore.emitter.destroy();
      // // Create a new scene event listener
      // gameStore.setEmiiter();

      // Remove scene event
      this.eventsToRemove.forEach((e) => {
        gameStore.emitter.removeListener(e);
      });

      // Reset offset
      this.offsetX = 0;
      this.offsetY = 0;
      // Clear enemy array
      this.enemies.splice(0);
      // Disable key input event
      if (this.input.keyboard) this.input.keyboard.enabled = false;

      if (restart) {
        gameStore.setPlayerStatus({});
        this.scene.restart();
      } else {
        const direction = this.content.doors[gameStore.doorIndex].direction;
        console.log(`Open the door ${direction}`);
        // Mark the room visited
        this.content.markRoomVisited(this.content.roomIndex);
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

  #storeEnemyData(gameStore: any) {
    if (this.enemies.length && this.content) {
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
  }
}
