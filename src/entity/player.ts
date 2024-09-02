import { player, action } from 'src/model/character';
import { Input, Events, Animations } from 'phaser';
import { useGameStore } from 'src/stores/game';
import { calculateDamage } from 'src/utils/battle';

export default class Player {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  eventEmitter: Phaser.Events.EventEmitter | null;
  data: player;
  tileSize: number;
  map: number[][];
  ready: boolean;
  overlap: boolean;
  collide: boolean;
  status: string;
  target: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
  text: Phaser.GameObjects.Text;
  keys: action;

  private zone!: Phaser.GameObjects.Zone;
  private cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fKey!: Input.Keyboard.Key;
  private wKey!: Input.Keyboard.Key;
  private aKey!: Input.Keyboard.Key;
  private sKey!: Input.Keyboard.Key;
  private dKey!: Input.Keyboard.Key;
  private pointer!: Input.Pointer;

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
    this.status = '';
    this.tileSize = tileSize;
    (this.text = this.scene.add
      .text(x, y - tileSize / 2, '', {
        fontSize: tileSize * 0.3,
        fontFamily: 'pixelify',
      })
      .setVisible(false)),
      (this.map = map);
    this.ready = false;
    this.overlap = false;
    this.collide = false;
    this.target = [];
    this.keys = {};
    this.eventEmitter = eventEmitter;
    this.init(x, y, texture, groundLayer);
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

    this.eventEmitter?.on('chase-countdown-calling', () => {
      this.eventEmitter?.emit('chase-countdown-start', this.sprite);
    });

    this.scene.physics.add.collider(
      this.sprite,
      groundLayer,
      this.#onCollide,
      null,
      this
    );
    this.#addContorl();
    this.#setZone();
  }

  #addContorl() {
    // Bind key events
    if (this.scene.input.keyboard) {
      this.cursor = this.scene.input.keyboard.createCursorKeys();
      this.fKey = this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.F);
      this.wKey = this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.W);
      this.aKey = this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.A);
      this.sKey = this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.S);
      this.dKey = this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.D);

      // Mouse event
      this.pointer = this.scene.input.activePointer;
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
      // console.log('zone ', this.zone);
      this.scene.physics.add.existing(this.zone, false);
    }
  }

  addOverlap(target: any) {
    this.scene.physics.add.overlap(this.zone, target, () => {
      // console.log('overlap with ', target);
      this.overlap = true;

      if (!this.target.find((t) => t.name === target.name))
        this.target.push(target);
    });
  }

  addCollision(target: any) {
    if (this.sprite) {
      console.log('target :>>>', target);
      this.scene.physics.add.collider(
        this.sprite,
        target,
        this.#onCollide,
        null,
        this
      );
    }
  }

  #update() {
    // console.log('listen to scene update');
    // Listen to key press
    if (
      this.sprite?.body &&
      !this.status.includes('hit') &&
      !this.status.includes('dead')
    ) {
      if (!this.zone.body.embedded) {
        this.overlap = false;
        this.target.splice(0);
      }

      if (this.fKey && this.eventEmitter) {
        if (this.fKey.isDown) {
          const gameStore = useGameStore();
          const doorIndex = gameStore.getDoorIndex;

          if (doorIndex >= 0) this.eventEmitter.emit('open-door');
        }
      }

      // if (this.dKey && this.dKey.isDown) {
      //   if (
      //     !this.keys[this.dKey.keyCode] ||
      //     this.keys[this.dKey.keyCode] === 0
      //   ) {
      //     console.log('add key');
      //     this.keys[this.dKey.keyCode] = 1;
      //     this.sprite?.anims.play('player-attack', true);
      //   } else {
      //     console.log('lock key');
      //   }
      // }

      // Mouse left click
      if (this.pointer.isDown) {
        console.log('mouse left clicked ', this.pointer);
        if (!this.keys['mouseLeft'] || this.keys['mouseLeft'] === 0) {
          this.keys['mouseLeft'] = 1;
          this.sprite?.anims.play('player-attack', true);
        } else {
          console.log('lock key');
        }
      }

      if (!this.sprite.anims.currentAnim?.key.includes('attack')) {
        if (this.cursor?.left.isDown || this.aKey.isDown) {
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
        } else if (this.cursor?.right.isDown || this.dKey.isDown) {
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
        } else if (this.cursor?.up.isDown || this.wKey.isDown) {
          this.sprite.setVelocityY(-this.tileSize * 2.5);
          // Update zone
          this.zone.setPosition(
            this.sprite.x + this.tileSize / 2,
            this.sprite.y - this.tileSize / 4
          );
          // this.zone.setSize(this.tileSize, this.tileSize / 2);
          this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
        } else if (this.cursor?.down.isDown || this.sKey.isDown) {
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

    if (this.status === 'hit') {
      // TODO: Lock the player at where it is for a while
      this.sprite.body.setVelocity(0);
      this.scene.time.delayedCall(200, () => {
        this.status = '';
      });
    }

    if (this.status === 'dead') {
      // TODO: Play dead animation
    }
  }

  #animationStart(anim: any, frame: any, sprite: any, frameKey: any) {
    // console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack')) {
      // console.log('change sprite position');
      // Stop moving if needed
      this.sprite.body.setSize(this.tileSize, this.tileSize);
      this.sprite.body.setVelocity(0);
      // Temporary disable key captures

      const diffX = sprite.width - this.tileSize;
      const diffY = sprite.height - this.tileSize;

      // this.sprite.setSize(sprite.width, sprite.height);
      if (this.sprite.flipX) {
        this.sprite.setDisplayOrigin(-diffX / 2, diffY);
        this.sprite.setOffset(-diffX / 2, diffY);
      } else {
        this.sprite.setDisplayOrigin(diffX, diffY);
        this.sprite.setOffset(diffX, diffY);
      }
    }
  }

  #animationUpdate(anim: any, frame: any, sprite: any, frameKey: any) {
    // console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack') && frameKey === '1') {
      // Check overlap
      if (this.overlap) {
        console.log('PLAYER HIT!');
        this.target.forEach((t) => {
          const enemyIndex = Number(t.name.split('_')[1]);

          const result = calculateDamage(
            this.data,
            this.scene.enemies[enemyIndex].data
          );

          this.text.setPosition(t.x, t.y - this.tileSize / 2);

          // Check demage
          if (result.value === 0) {
            // Miss!
            this.text.setText('MISS');
            this.text.setVisible(true);
          } else {
            console.log('ENEMY HIT!');
            if (result.type.includes('crit')) {
              this.text.setText(`${result.value}`);
              this.text.setStyle({ color: '#FFB343' });
              this.text.setFontSize(this.tileSize * 0.4);
              this.text.setVisible(true);
            } else {
              this.text.setText(`${result.value}`);
              this.text.setVisible(true);
            }

            this.scene.enemies[enemyIndex].data.base_attribute.hp -=
              result.value;
            this.scene.enemies[enemyIndex].updateStatus('hit');
          }

          setTimeout(() => {
            this.text.setVisible(false);
            this.text.setFontSize(this.tileSize * 0.3);
            this.text.setStyle({ color: '#ffffff' });
          }, 500);
        });
      }
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
      setTimeout(() => {
        // release key
        // if (this.dKey) this.keys[this.dKey.keyCode] = 0;
        if (this.keys['mouseLeft']) this.keys['mouseLeft'] = 0;
      }, 300);
    }
  }

  updateData(data: player) {
    this.data = data;
  }

  updateStatus(status: string) {
    this.status = status;
  }

  #onCollide(self: any, target: any) {
    // console.log('self', self);
    console.log('player collide with target :>>>', target);

    // if (target.name.includes('enemy')) {
    //   this.sprite.body.setImmovable(true);
    // } else {
    //   this.sprite.body.setImmovable(false);
    // }
  }
}
