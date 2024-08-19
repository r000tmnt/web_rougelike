import { player } from 'src/model/character';
import { Input, Events, Animations } from 'phaser';
import { useGameStore } from 'src/stores/game';

export default class Player {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  eventEmitter: Phaser.Events.EventEmitter | null;
  data: player;
  tileSize: number;
  map: number[][];
  ready: boolean;

  private zone!: Phaser.GameObjects.Zone;
  private cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fKey!: Input.Keyboard.Key | undefined;
  private iKey!: Input.Keyboard.Key | undefined;
  private cKey!: Input.Keyboard.Key | undefined;
  private dKey!: Input.Keyboard.Key | undefined;

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
    this.sprite = this.scene.physics.add.sprite(x, y);
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
    this.sprite.name = 'player';
    this.sprite.setSize(this.tileSize, this.tileSize);
    this.sprite.setOrigin(0, 0);
    this.sprite.setOffset(0, 0); // Adjust rendering position
    this.sprite.setPushable(false);

    //Prepare textures
    this.scene.textures.addSpriteSheetFromAtlas(`${texture}_idle`, {
      atlas: texture,
      frame: `${texture}_idle`,
      frameWidth: this.tileSize,
      frameHeight: this.tileSize,
    });

    this.scene.textures.addSpriteSheetFromAtlas(`${texture}_attack`, {
      atlas: texture,
      frame: `${texture}_attack`,
      frameWidth: 56,
      frameHeight: 64,
    });

    // Set animation
    this.scene.anims.create({
      key: 'player-idle',
      frames: this.scene.anims.generateFrameNames(`${texture}_idle`, {
        start: 0,
        end: 0,
      }),
      frameRate: 0,
      repeat: 0,
    });

    this.scene.anims.create({
      key: 'player-walking',
      frames: this.scene.anims.generateFrameNames(`${texture}_idle`, {
        start: 3,
        end: 5,
      }),
      frameRate: 5,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'player-attack',
      frames: this.scene.anims.generateFrameNames(`${texture}_attack`, {
        start: 0,
        end: 2,
      }),
      frameRate: 10,
    });

    // Animation event listener
    this.sprite.on(
      Animations.Events.ANIMATION_START,
      this.#animationStart,
      this
    );

    // Animation event listener
    this.sprite.on(
      Animations.Events.ANIMATION_UPDATE,
      this.#animationUpdate,
      this
    );

    // Animation event listener
    this.sprite.on(
      Animations.Events.ANIMATION_COMPLETE,
      this.#animationComplete,
      this
    );

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
    // Bind key events
    if (this.scene.input.keyboard) {
      this.cursor = this.scene.input.keyboard.createCursorKeys();
      this.fKey = this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.F);
      this.dKey = this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.D);
    }
    this.scene.events.on('update', this.#update, this);
  }

  #setZone() {
    if (this.sprite) {
      this.zone = this.scene.add.zone(
        this.sprite.x - this.tileSize / 4,
        this.sprite.y + this.tileSize / 2,
        this.tileSize / 2,
        this.tileSize
      );
      // this.zone.setOrigin(0.5, 0.5);
      console.log('zone ', this.zone);
      this.scene.physics.add.existing(this.zone, false);
    }
  }

  addOverlap(target: any) {
    if (this.sprite) {
      this.scene.physics.add.overlap(this.sprite, target, () => {
        console.log('overlap with ', target);
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
      if (this.fKey && this.eventEmitter) {
        if (this.fKey.isDown) {
          const gameStore = useGameStore();
          const doorIndex = gameStore.getDoorIndex;

          if (doorIndex >= 0) this.eventEmitter.emit('open-door');
        }
      }

      if (this.dKey && this.dKey.isDown) {
        this.sprite?.anims.play('player-attack', true);
      } else if (this.cursor?.left.isDown) {
        this.sprite.setVelocityX(-this.tileSize * 2.5);
        this.sprite.setFlipX(false);
        this.sprite.anims.play('player-walking', true);
        // Update zone
        this.zone.setPosition(
          this.sprite.x - this.tileSize / 4,
          this.sprite.y + this.tileSize / 2
        );
        // this.zone.setSize(this.tileSize / 2, this.tileSize);
        this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
      } else if (this.cursor?.right.isDown) {
        this.sprite.setVelocityX(this.tileSize * 2.5);
        this.sprite.setFlipX(true);
        this.sprite.anims.play('player-walking', true);
        // Update zone
        this.zone.setPosition(
          this.sprite.x + this.tileSize + this.tileSize / 3,
          this.sprite.y + this.tileSize / 2
        );
        // this.zone.setSize(this.tileSize / 2, this.tileSize);
        this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
      } else if (this.cursor?.up.isDown) {
        this.sprite.setVelocityY(-this.tileSize * 2.5);
        // Update zone
        this.zone.setPosition(
          this.sprite.x + this.tileSize / 2,
          this.sprite.y - this.tileSize / 4
        );
        // this.zone.setSize(this.tileSize, this.tileSize / 2);
        this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
      } else if (this.cursor?.down.isDown) {
        this.sprite.setVelocityY(this.tileSize * 2.5);
        // Update zone
        this.zone.setPosition(
          this.sprite.x + this.tileSize / 2,
          this.sprite.y + this.tileSize * 1.5 - this.tileSize / 5
        );
        // this.zone.setSize(this.tileSize, this.tileSize / 2);
        this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
      } else {
        this.sprite.body.setVelocity(0);
        if (!this.sprite.anims.currentAnim?.key.includes('attack')) {
          this.sprite.anims.play('player-idle', true);
        }
      }
    }
  }

  #animationStart(anim: any, frame: any, sprite: any, frameKey: any) {
    console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack')) {
      // console.log('change sprite position');
      // Stop moving if needed
      this.sprite.body.setVelocity(0);
      // Temporary disable key captures

      this.sprite.setSize(sprite.width, sprite.height);
      this.sprite.setDisplayOrigin(
        sprite.width - this.tileSize,
        sprite.height - this.tileSize
      );
    }
  }

  #animationUpdate(anim: any, frame: any, sprite: any, frameKey: any) {
    console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack')) {
      console.log('inspecting animation');
      // Check overlap
      // if (frameKey === '0') {
      //   console.log('change sprite position');
      //   this.sprite.setSize(sprite.width, sprite.height);
      //   this.sprite.setPosition(
      //     this.sprite.x - (sprite.width - this.tileSize),
      //     this.sprite.y - (sprite.height - this.tileSize)
      //   );
      //   // this.sprite.setOffset(
      //   //   -(sprite.width - this.tileSize),
      //   //   -(sprite.height - this.tileSize)
      //   // );
      // }
    }
  }

  #animationComplete(context: any) {
    console.log('context :>>>', context);
    // Check if the attack animation finished
    if (context.key.includes('attack')) {
      this.sprite.setSize(this.tileSize, this.tileSize);
      this.sprite.setDisplayOrigin(
        // context.frames[0].frame.width - this.tileSize,
        // context.frames[0].frame.height - this.tileSize
        0.5,
        0.5
      );
      this.sprite.setOffset(0, 0);
      this.sprite.anims.play('player-idle');
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
