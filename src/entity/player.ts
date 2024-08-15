import { player } from 'src/model/character';
import { Input, Events } from 'phaser';
import { useGameStore } from 'src/stores/game';

export default class Player {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  eventEmitter: Phaser.Events.EventEmitter | undefined;
  data: player;
  tileSize: number;
  map: number[][];
  ready: boolean;

  private zone!: Phaser.GameObjects.Zone;
  private cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fKey!: Input.Keyboard.Key | undefined;
  private iKey!: Input.Keyboard.Key | undefined;
  private cKey!: Input.Keyboard.Key | undefined;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    data: player,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    map: number[][],
    tileSize: number,
    eventEmitter: Events.EventEmitter
  ) {
    this.scene = scene;
    this.sprite = undefined;
    this.data = data;
    this.tileSize = tileSize;
    this.init(x, y, texture, groundLayer);
    this.map = map;
    this.ready = false;
    this.eventEmitter = eventEmitter;
  }

  init(
    x: number,
    y: number,
    texture: string,
    groundLayer: Phaser.Tilemaps.TilemapLayer
  ) {
    this.sprite = this.scene.physics.add.sprite(x, y, texture);
    this.sprite.setOrigin(0, 0);
    this.sprite.setPushable(false);

    // Set animation
    this.scene.anims.create({
      key: 'player-idle',
      frames: this.scene.anims.generateFrameNames(texture, {
        start: 0,
        end: 0,
      }),
      frameRate: 5,
      repeat: 0,
    });

    this.scene.anims.create({
      key: 'player-walking',
      frames: this.scene.anims.generateFrameNames(texture, {
        start: 3,
        end: 5,
      }),
      frameRate: 5,
      repeat: -1,
    });

    this.#setCollision(groundLayer);
    this.#addContorl();
    this.#setZone();
  }

  #setCollision(groundLayer: Phaser.Tilemaps.TilemapLayer) {
    if (this.sprite) {
      console.log('setting player collision');

      this.scene.physics.add.collider(this.sprite, groundLayer);
      this.ready = true;

      console.log('player? ', this.sprite);
    }
  }

  #addContorl() {
    if (this.scene.input.keyboard) {
      this.cursor = this.scene.input.keyboard.createCursorKeys();
      this.fKey = this.scene.input.keyboard?.addKey(Input.Keyboard.KeyCodes.F);

      // Bind key events
      this.scene.events.on('update', this.#update, this);
    }
  }

  #setZone() {
    if (this.sprite) {
      this.zone = this.scene.add.zone(
        this.sprite.x - this.tileSize / 2,
        this.sprite.y,
        this.tileSize / 2,
        this.tileSize
      );
      this.zone.setOrigin(0, 0);
      this.scene.physics.add.existing(this.zone, false);
    }
  }

  addOverlap(target: any) {
    if (this.sprite) {
      this.scene.physics.add.overlap(this.sprite, target, () => {
        // console.log('overlap!');
      });
    }
  }

  //   addCollision(target: any) {
  //     if (this.sprite) {
  //       console.log('target :>>>', target);
  //       this.scene.physics.add.collider(
  //         target,
  //         this.sprite,
  //         this.#onCollide,
  //         null,
  //         this
  //       );
  //     }
  //   }

  #update() {
    // console.log('listen to scene update');
    // Listen to key press
    if (this.sprite?.body) {
      if (this.cursor?.left.isDown) {
        this.sprite.setVelocityX(-this.tileSize * 2.5);
        this.sprite.setFlipX(false);
        this.sprite.anims.play('player-walking', true);
        // Update zone
        this.zone.setPosition(this.sprite.x - this.tileSize / 2, this.sprite.y);
        // this.zone.setSize(this.tileSize / 2, this.tileSize);
        this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
      } else if (this.cursor?.right.isDown) {
        this.sprite.setVelocityX(this.tileSize * 2.5);
        this.sprite.setFlipX(true);
        this.sprite.anims.play('player-walking', true);
        // Update zone
        this.zone.setPosition(this.sprite.x + this.tileSize, this.sprite.y);
        // this.zone.setSize(this.tileSize / 2, this.tileSize);
        this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
      } else if (this.cursor?.up.isDown) {
        this.sprite.setVelocityY(-this.tileSize * 2.5);
        // Update zone
        this.zone.setPosition(this.sprite.x, this.sprite.y - this.tileSize / 2);
        // this.zone.setSize(this.tileSize, this.tileSize / 2);
        this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
      } else if (this.cursor?.down.isDown) {
        this.sprite.setVelocityY(this.tileSize * 2.5);
        // Update zone
        this.zone.setPosition(this.sprite.x, this.sprite.y + this.tileSize);
        // this.zone.setSize(this.tileSize, this.tileSize / 2);
        this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
      } else {
        this.sprite.body.setVelocity(0);
        this.sprite.anims.play('player-idle', true);
      }

      if (this.fKey && this.eventEmitter) {
        if (this.fKey.isDown) {
          const gameStore = useGameStore();
          const doorIndex = gameStore.getDoorIndex;

          if (doorIndex >= 0) this.eventEmitter.emit('open-door');
        }
      }
    }
  }

  updateData(data: player) {
    this.data = data;
  }

  #onCollide(self: any, target: any) {
    console.log('self', self);
    console.log('target', target);
  }
}
