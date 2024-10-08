// import { modifier } from './../model/item';
import { player, action, base_attribute } from 'src/model/character';
import { Input, Animations } from 'phaser';
import { useGameStore } from 'src/stores/game';
import { calculateDamage } from 'src/utils/battle';
import { item } from 'src/model/item';

export default class Player {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
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
    reset = true
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
    this.init(texture, groundLayer, reset);
  }

  init(
    texture: string,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    reset: boolean
  ) {
    this.sprite.name = texture;
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

    this.scene.textures.addSpriteSheetFromAtlas(`${texture}_lose`, {
      atlas: texture,
      frame: `${texture}_lose`,
      frameWidth: this.tileSize,
      frameHeight: this.tileSize,
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
      key: 'player-take-damage',
      frames: this.scene.anims.generateFrameNames(`${texture}_idle`, {
        start: 6,
        end: 6,
      }),
      frameRate: 0,
      repeat: 0,
    });

    this.scene.anims.create({
      key: 'player-attack',
      frames: this.scene.anims.generateFrameNames(`${texture}_attack`, {
        start: 0,
        end: 2,
      }),
      frameRate: 10,
    });

    this.scene.anims.create({
      key: 'player-lose',
      frames: this.scene.anims.generateFrameNames(`${texture}_lose`, {
        start: 0,
        end: 1,
      }),
      frameRate: 24,
      repeat: 0,
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

    this.#setCollide(groundLayer);
    this.#setCustomEvent();
    this.#addContorl();
    this.#setZone();

    if (reset) {
      this.#setData();
    }

    // Check if there's equipment to count
    Object.entries(this.data.equip).forEach((e) => {
      if (Object.entries(e[1]).length) {
        this.applyEquip(e[1]);
      }
    });
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

      this.scene.physics.world.enable(this.zone);

      // this.zone.setOrigin(0.5, 0.5);
      // console.log('zone ', this.zone);
    }
  }

  #setData() {
    Object.entries(this.data.total_attribute).forEach((a) => {
      const key = a[0];
      // console.log(key);
      this.data.total_attribute[key as keyof base_attribute] =
        this.data.base_attribute[key as keyof base_attribute] +
        this.data.add_attribute[key as keyof base_attribute];
    });

    console.log('total ', this.data.total_attribute);
  }

  #setCustomEvent() {
    const gameStore = useGameStore();
    gameStore.emitter.on('chase-countdown-calling', () => {
      gameStore.emitter.emit('chase-countdown-start', this.sprite);
    });

    gameStore.emitter.on('player-take-damage', (dmg: number) => {
      this.sprite.body?.setVelocity(0);
      this.data.total_attribute.hp -=
        dmg > this.data.total_attribute.hp ? this.data.total_attribute.hp : dmg;

      // console.log('current hp ', this.data.base_attribute.hp);

      // this.sprite.anims.play({ key: 'player-take-damage', duration: 100 });
      // console.log(this.scene.textures.getTextureKeys(`${texture}_idle`));
      // this.sprite.setTexture(`${this.sprite.name}_idle`, 6);
      this.sprite.setFrame(
        this.scene.anims.get('player-take-damage').frames[0].textureFrame
      );
      this.scene.juice.shake(this.sprite, { x: 1, repeat: 2 });

      // If player lose
      if (this.data.total_attribute.hp === 0) {
        // TODO - Death animation
        // TODO - Game over screen
        this.status = 'dead';
        this.scene.camera?.pan(this.sprite.x, this.sprite.y, 200, 'Power2');
        this.scene.camera?.zoomTo(2, 200);
        setTimeout(() => {
          this.sprite.anims.play('player-lose');
        }, 500);
      } else {
        this.status = 'hit';
        setTimeout(() => {
          this.status = '';
          this.sprite.anims.play('player-lose');
          this.keys['mouseLeft'] = 0;
        }, 200);
      }
      gameStore.setPlayerStatus(this.data);
    });

    gameStore.emitter.on('player-equip', (item: item) => {
      this.applyEquip(item);
    });

    gameStore.emitter.on('player-unequip', (item: item) => {
      this.unEquip(item);
    });
  }

  #setCollide(groundLayer: Phaser.Tilemaps.TilemapLayer) {
    this.scene.physics.add.collider(
      this.sprite,
      groundLayer,
      this.#onCollide,
      null,
      this
    );
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

  applyEquip(item: item) {
    const { effect, modifier } = item;

    for (const key in effect) {
      switch (key) {
        case 'bag':
          this.data.attribute_limit.bag += effect[key].value;
          break;
        default:
          const valueBeforeChange =
            this.data.add_attribute[key as keyof base_attribute];

          switch (effect[key].type) {
            case 0:
              this.data.add_attribute[key as keyof base_attribute] +=
                effect[key].value;
              break;
            case 1:
              this.data.add_attribute[key as keyof base_attribute] +=
                this.data.base_attribute[key as keyof base_attribute] *
                Math.floor(effect[key].value / 100);
              break;
            case 2:
              this.data.add_attribute[key as keyof base_attribute] -=
                effect[key].value;
              break;
            case 3:
              this.data.add_attribute[key as keyof base_attribute] -=
                this.data.base_attribute[key as keyof base_attribute] *
                Math.floor(effect[key].value / 100);
              break;
            // and more?
          }

          // Update the limit of the attribute
          this.data.attribute_limit[key as keyof base_attribute] =
            this.data.base_attribute[key as keyof base_attribute] +
            this.data.add_attribute[key as keyof base_attribute];

          // Update the total attribute by the difference between the old and the new one
          this.data.total_attribute[key as keyof base_attribute] +=
            this.data.add_attribute[key as keyof base_attribute] -
            valueBeforeChange;
          break;
      }
    }
  }

  unEquip(item: item) {
    const { effect, modifier } = item;

    for (const key in effect) {
      switch (key) {
        case 'bag':
          this.data.attribute_limit.bag -= effect[key].value;
          // If the quantity of items are bigger then the size of the bag
          // Drop items
          break;
        default:
          const valueBeforeChange =
            this.data.add_attribute[key as keyof base_attribute];

          switch (effect[key].type) {
            case 0:
              this.data.add_attribute[key as keyof base_attribute] -=
                effect[key].value;
              break;
            case 1:
              this.data.add_attribute[key as keyof base_attribute] -=
                this.data.base_attribute[key as keyof base_attribute] *
                Math.floor(effect[key].value / 100);
              break;
            case 2:
              this.data.add_attribute[key as keyof base_attribute] +=
                effect[key].value;
              break;
            case 3:
              this.data.add_attribute[key as keyof base_attribute] +=
                this.data.base_attribute[key as keyof base_attribute] *
                Math.floor(effect[key].value / 100);
              break;
            // and more?
          }

          // Update the limit of the attribute
          this.data.attribute_limit[key as keyof base_attribute] =
            this.data.base_attribute[key as keyof base_attribute] +
            this.data.add_attribute[key as keyof base_attribute];

          // Update the total attribute by the difference between the old and the new one
          this.data.total_attribute[key as keyof base_attribute] +=
            this.data.add_attribute[key as keyof base_attribute] -
            valueBeforeChange;
          break;
      }
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

      if (this.fKey && this.fKey.isDown) {
        const gameStore = useGameStore();
        const doorIndex = gameStore.getDoorIndex;

        if (doorIndex >= 0) gameStore.emitter.emit('open-door');
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
        const { up, right, down, left } = this.sprite.body.touching;

        if (this.cursor?.left.isDown || this.aKey.isDown) {
          this.sprite.anims.play('player-walking', true);

          if (!down) {
            this.sprite.setVelocityX(-this.tileSize * 2.5);
            this.sprite.setFlipX(false);

            // Update zone
            this.zone.setPosition(
              this.sprite.x - this.tileSize / 4,
              this.sprite.y + this.tileSize / 2
            );
            // this.zone.setSize(this.tileSize / 2, this.tileSize);
            this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
          }
        } else if (this.cursor?.right.isDown || this.dKey.isDown) {
          this.sprite.anims.play('player-walking', true);

          if (!right) {
            this.sprite.setVelocityX(this.tileSize * 2.5);
            this.sprite.setFlipX(true);

            // Update zone
            this.zone.setPosition(
              this.sprite.x + this.tileSize + this.tileSize / 3,
              this.sprite.y + this.tileSize / 2
            );
            // this.zone.setSize(this.tileSize / 2, this.tileSize);
            this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
          }
        } else if (this.cursor?.up.isDown || this.wKey.isDown) {
          this.sprite.anims.play('player-walking', true);

          if (!up) {
            this.sprite.setVelocityY(-this.tileSize * 2.5);

            // Update zone
            this.zone.setPosition(
              this.sprite.x + this.tileSize / 2,
              this.sprite.y - this.tileSize / 4
            );
            // this.zone.setSize(this.tileSize, this.tileSize / 2);
            this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
          }
        } else if (this.cursor?.down.isDown || this.sKey.isDown) {
          this.sprite.anims.play('player-walking', true);
          if (!down) {
            this.sprite.setVelocityY(this.tileSize * 2.5);

            // Update zone
            this.zone.setPosition(
              this.sprite.x + this.tileSize / 2,
              this.sprite.y + this.tileSize * 1.5 - this.tileSize / 5
            );
            // this.zone.setSize(this.tileSize, this.tileSize / 2);
            this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
          }
        } else {
          this.sprite.body.setVelocity(0);
          if (!this.sprite.anims.currentAnim?.key.includes('attack')) {
            this.sprite.anims.play('player-idle', true);
          }
        }
      }
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
            console.log('PLAYER HIT!');
            if (result.type.includes('crit')) {
              this.text.setText(`${result.value}`);
              this.text.setStyle({ color: '#FFB343' });
              this.text.setFontSize(this.tileSize * 0.4);
              this.text.setVisible(true);
            } else {
              this.text.setText(`${result.value}`);
              this.text.setVisible(true);
            }

            this.scene.enemies[enemyIndex].data.total_attribute.hp -=
              result.value;
            this.scene.enemies[enemyIndex].updateStatus('hit');
            const gameStore = useGameStore();
            gameStore.emitter.emit('chase-countdown-start', this.sprite);
          }

          this.scene.time.delayedCall(500, () => {
            this.text.setVisible(false);
            this.text.setFontSize(this.tileSize * 0.3);
            this.text.setStyle({ color: '#ffffff' });
          });
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
      this.scene.time.delayedCall(300, () => {
        // release key
        // if (this.dKey) this.keys[this.dKey.keyCode] = 0;
        if (this.keys['mouseLeft']) this.keys['mouseLeft'] = 0;
      });
    }

    if (context.key.includes('lose')) {
      this.sprite.setFrame(
        this.scene.anims.get('player-lose').frames[1].textureFrame
      );
      // Tint the sprite with Decimal number
      // this.sprite.setTint(8519680)
      // this.sprite.setTintFill(8519680)

      //FX Wipe
      this.scene.time.delayedCall(500, () => {
        const wipe = this.sprite.preFX?.addWipe(0.1, 0, 0);
        this.scene.tweens.add({
          targets: wipe,
          progress: 1,
          repeat: 0,
          duration: 2000,
        });
        this.scene.time.delayedCall(2000, () => {
          //Show Game over screen
          const gameStore = useGameStore();
          gameStore.setGameOver(true);
          this.scene.physics.pause();
        });
      });
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
    // console.log('player collide with target :>>>', target);

    if (target.name && target.name.includes('enemy')) {
      // this.sprite.body.setImmovable(true);
      // target.setPushable(false)
      this.sprite.body.stop();
    }
    // else {
    //   this.sprite.body.setImmovable(false);
    // }
  }
}
