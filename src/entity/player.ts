// import { modifier } from './../model/item';
import { player } from 'src/model/character';
import { Input, Animations } from 'phaser';
import { useGameStore } from 'src/stores/game';
import { item } from 'src/model/item';
import unit from './unit';
import { addTexture, setAnimation } from 'src/utils/asset';
import Dungeon from 'src/scene/dungeon';

export default class Player extends unit {
  target: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;

  private zone!: Phaser.GameObjects.Zone;
  private cursor!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fKey!: Input.Keyboard.Key;
  private wKey!: Input.Keyboard.Key;
  private aKey!: Input.Keyboard.Key;
  private sKey!: Input.Keyboard.Key;
  private dKey!: Input.Keyboard.Key;
  private pointer!: Input.Pointer;

  constructor(
    scene: Dungeon,
    x: number,
    y: number,
    texture: string,
    data: player,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    map: number[][],
    tileSize: number,
    reset = true
  ) {
    super(scene, x, y, texture, data, tileSize, map, false, false);
    this.target = [];
    this.init(texture, groundLayer, reset);
  }

  init(
    texture: string,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    reset: boolean
  ) {
    //Prepare textures
    addTexture(
      this.scene,
      `${texture}_idle`,
      texture,
      this.tileSize,
      this.tileSize
    );
    addTexture(this.scene, `${texture}_attack`, texture, 56, 64);
    addTexture(
      this.scene,
      `${texture}_lose`,
      texture,
      this.tileSize,
      this.tileSize
    );

    // Set animation
    setAnimation(this.scene, `${texture}_idle`, `${texture}_idle`, 0, 0, 0, 0);
    setAnimation(
      this.scene,
      `${texture}_walking`,
      `${texture}_idle`,
      3,
      5,
      5,
      -1
    );
    setAnimation(
      this.scene,
      `${texture}_take_damage`,
      `${texture}_idle`,
      6,
      6,
      0,
      0
    );
    setAnimation(
      this.scene,
      `${texture}_attack`,
      `${texture}_attack`,
      0,
      2,
      10,
      0
    );
    setAnimation(this.scene, `${texture}_lose`, `${texture}_lose`, 0, 1, 24, 0);

    // Animation event listener
    this.on(Animations.Events.ANIMATION_START, this.#animationStart, this);

    // Animation event listener
    this.on(Animations.Events.ANIMATION_UPDATE, this.#animationUpdate, this);

    // Animation event listener
    this.on(
      Animations.Events.ANIMATION_COMPLETE,
      this.#animationComplete,
      this
    );

    this.addCollision(groundLayer, this.onCollide);
    this.#setCustomEvent();
    this.#addContorl();
    this.#setZone();

    if (reset) {
      this.calculateData();

      // Check if there's equipment to count
      if ('equip' in this.data.values && this.data.values.equip) {
        Object.entries(this.data.values.equip).forEach((e) => {
          if (
            e[1] &&
            typeof e[1] === 'object' &&
            'id' in e[1] &&
            'name' in e[1]
          ) {
            this.applyEquip(e[1] as item);
          }
        });
      }
    }
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

    this.on('destroy', () => {
      this.scene.events.off('update', this.#update);
    });
  }

  #setZone() {
    if (this) {
      this.zone = this.scene.add.zone(
        this.x - this.tileSize / 4,
        this.y + this.tileSize / 2,
        this.tileSize / 2,
        this.tileSize
      );

      this.scene.physics.world.enable(this.zone);

      // this.zone.setOrigin(0.5, 0.5);
      // console.log('zone ', this.zone);
    }
  }

  #setCustomEvent() {
    const gameStore = useGameStore();
    gameStore.emitter.on('chase-countdown-calling', () => {
      gameStore.emitter.emit('chase-countdown-start', this);
    });

    gameStore.emitter.on('player-take-damage', (dmg: number) => {
      this.status = 'hit';

      this.body?.setVelocity(0);

      const data = gameStore.getPlayer;
      data.total_attribute.hp -=
        dmg > data.total_attribute.hp ? data.total_attribute.hp : dmg;

      // console.log('current hp ', this.data.values.base_attribute.hp
      this.setFrame(
        this.scene.anims.get(`${this.name}_take_damage`).frames[0].textureFrame
      );
      this.scene.juice.shake(this, { x: 1, repeat: 2 });

      // If player lose
      if (data.total_attribute.hp === 0) {
        this.active = false;
        this.status = 'dead';
        this.scene.camera?.pan(this.x, this.y, 200, 'Power2');
        this.scene.camera?.zoomTo(2, 200);
        setTimeout(() => {
          this.anims.play(`${this.name}_lose`);

          setTimeout(() => {
            this.setFrame(
              this.scene.anims.get(`${this.name}_lose`).frames[1].textureFrame
            );
            // Tint the sprite with Decimal number
            // this.setTint(8519680)
            // this.setTintFill(8519680)

            //FX Wipe
            this.scene.time.delayedCall(500, () => {
              const wipe = this.preFX?.addWipe(0.1, 0, 0);
              this.scene.tweens.add({
                targets: wipe,
                progress: 1,
                repeat: 0,
                duration: 2000,
              });
              this.scene.time.delayedCall(2000, () => {
                //Show Game over screen
                gameStore.setGameOver(true);
                this.scene.physics.pause();
              });
            });
          }, 500);
        }, 500);
      } else {
        setTimeout(() => {
          this.status = '';
          this.anims.play(`${this.name}_lose`);
          this.keys['mouseLeft'] = 0;
        }, 200);
      }
      gameStore.setPlayerStatus(data);
    });

    gameStore.emitter.on('player-level-up', () => {
      try {
        this.status = 'levelUp';
        this.statText.setPosition(this.x, this.y - this.tileSize / 2);
        this.statText.setText('LEVEL UP');
        this.statText.setStyle({ color: '#FFB343' });
        this.statText.setFontSize(this.tileSize * 0.4);

        // const glow = this.statText.postFX.addGlow(0xffffff, 0, 0, false, 0.1, 24);

        this.statText.setVisible(true);

        // this.scene.tweens.add({
        //   targets: glow,
        //   outerStrength: 4,
        //   yoyo: true,
        //   loop: -1,
        //   ease: 'sine.inout',
        // });

        this.scene.tweens.chain({
          targets: this.statText,
          tweens: [
            {
              scale: 1.5,
              duration: 1500,
              yoyo: true,
              ease: 'quad.out',
            },
            {
              alpha: { from: 1, to: 0 },
              ease: 'sine.inout',
              duration: 1500,
            },
          ],
          loop: 0,
          onComplete: () => {
            console.log('tweens chain complete');
            this.status = '';
            this.statText.setVisible(false);
            this.statText.alpha = 1;
            this.statText.scale = 1;
          },
        });
      } catch (error) {
        console.log(error);
      }
    });

    gameStore.emitter.on('player-update', (data: player) => {
      this.setData(data);
    });

    gameStore.emitter.on('player-equip', (item: item) => {
      this.applyEquip(item);
    });

    gameStore.emitter.on('player-unequip', (item: item) => {
      this.unEquip(item);
    });
  }

  addOverlap(target: any) {
    this.scene.physics.add.overlap(this.zone, target, () => {
      // console.log('overlap with ', target);
      this.overlap = true;

      if (!this.target.find((t) => t.name === target.name))
        this.target.push(target);
    });
  }

  applyEquip(item: item) {
    const { effect, modifier } = item;

    for (const key in effect) {
      switch (key) {
        case 'bag':
          if ('bag' in this.data.values.attribute_limit)
            this.data.values.attribute_limit.bag += effect[key].value;
          break;
        default:
          const valueBeforeChange = this.data.values.add_attribute[key];

          switch (effect[key].type) {
            case 0:
              this.data.values.add_attribute[key] += effect[key].value;
              break;
            case 1:
              this.data.values.add_attribute[key] +=
                this.data.values.base_attribute[key] *
                Math.floor(effect[key].value / 100);
              break;
            case 2:
              this.data.values.add_attribute[key] -= effect[key].value;
              break;
            case 3:
              this.data.values.add_attribute[key] -=
                this.data.values.base_attribute[key] *
                Math.floor(effect[key].value / 100);
              break;
            // and more?
          }

          // Update the limit of the attribute
          this.data.values.attribute_limit[key] =
            this.data.values.base_attribute[key] +
            this.data.values.add_attribute[key];

          // Update the total attribute by the difference between the old and the new one
          this.data.values.total_attribute[key] +=
            this.data.values.add_attribute[key] - valueBeforeChange;
          break;
      }
    }
  }

  unEquip(item: item) {
    const { effect, modifier } = item;

    for (const key in effect) {
      switch (key) {
        case 'bag':
          if ('bag' in this.data.values.attribute_limit)
            this.data.values.attribute_limit.bag -= effect[key].value;
          // If the quantity of items are bigger then the size of the bag
          // Drop items
          break;
        default:
          const valueBeforeChange = this.data.values.add_attribute[key];

          switch (effect[key].type) {
            case 0:
              this.data.values.add_attribute[key] -= effect[key].value;
              break;
            case 1:
              this.data.values.add_attribute[key] -=
                this.data.values.base_attribute[key] *
                Math.floor(effect[key].value / 100);
              break;
            case 2:
              this.data.values.add_attribute[key] += effect[key].value;
              break;
            case 3:
              this.data.values.add_attribute[key] +=
                this.data.values.base_attribute[key] *
                Math.floor(effect[key].value / 100);
              break;
            // and more?
          }

          // Update the limit of the attribute
          this.data.values.attribute_limit[key] =
            this.data.values.base_attribute[key] +
            this.data.values.add_attribute[key];

          // Update the total attribute by the difference between the old and the new one
          this.data.values.total_attribute[key] +=
            this.data.values.add_attribute[key] - valueBeforeChange;
          break;
      }
    }
  }

  #update() {
    // console.log('listen to scene update');
    // Listen to key press
    if (
      this?.body &&
      !this.status.includes('hit') &&
      !this.status.includes('dead')
    ) {
      if (this.status === 'levelUp') {
        this.statText.setPosition(this.x, this.y - this.tileSize / 2);
      }

      this.target.forEach((t) => {
        if (this.scene.physics.overlap(this.zone, t)) {
          this.overlap = true;
          return;
        } else {
          this.overlap = false;
        }
      });

      // Reset target
      if (!this.overlap) this.target.splice(0);

      if (this.fKey && this.fKey.isDown) {
        const gameStore = useGameStore();
        const doorIndex = gameStore.getDoorIndex;

        if (doorIndex >= 0) gameStore.emitter.emit('open-door');
      }

      // Mouse left click
      if (this.pointer.isDown) {
        console.log('mouse left clicked ', this.pointer);
        if (!this.keys['mouseLeft'] || this.keys['mouseLeft'] === 0) {
          this.keys['mouseLeft'] = 1;
          this?.anims.play(`${this.name}_attack`, true);
        } else {
          console.log('lock key');
        }
      }

      if (this.keys['mouseLeft'] !== 1 && this.body) {
        if (this.cursor?.left.isDown || this.aKey.isDown) {
          this.anims.play(`${this.name}_walking`, true);
          this.setFlipX(false);
          // Update zone
          this.zone.setPosition(
            this.x - this.tileSize / 4,
            this.y + this.tileSize / 2
          );
          // this.zone.setSize(this.tileSize / 2, this.tileSize);
          this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
          this.setVelocityX(-this.tileSize * 2.5);
        } else if (this.cursor?.right.isDown || this.dKey.isDown) {
          this.anims.play(`${this.name}_walking`, true);
          this.setFlipX(true);

          // Update zone
          this.zone.setPosition(
            this.x + this.tileSize + this.tileSize / 3,
            this.y + this.tileSize / 2
          );
          // this.zone.setSize(this.tileSize / 2, this.tileSize);
          this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
          this.setVelocityX(this.tileSize * 2.5);
        } else if (this.cursor?.up.isDown || this.wKey.isDown) {
          this.anims.play(`${this.name}_walking`, true);
          // Update zone
          this.zone.setPosition(
            this.x + this.tileSize / 2,
            this.y - this.tileSize / 4
          );
          // this.zone.setSize(this.tileSize, this.tileSize / 2);
          this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
          this.setVelocityY(-this.tileSize * 2.5);
        } else if (this.cursor?.down.isDown || this.sKey.isDown) {
          this.anims.play(`${this.name}_walking`, true);
          // Update zone
          this.zone.setPosition(
            this.x + this.tileSize / 2,
            this.y + this.tileSize * 1.5 - this.tileSize / 5
          );
          // this.zone.setSize(this.tileSize, this.tileSize / 2);
          this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
          this.setVelocityY(this.tileSize * 2.5);
        } else {
          this.body?.setVelocity(0);
          if (!this.anims.currentAnim?.key.includes('attack')) {
            this.anims.play(`${this.name}_idle`, true);
          }
        }
      }
    }
  }

  #animationStart(anim: any, frame: any, sprite: any, frameKey: any) {
    // console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack')) {
      console.log('scene player data :>>>', this.data.values);
      // console.log('change sprite position');
      // Stop moving if needed
      this.body?.setSize(this.tileSize, this.tileSize);
      this.body?.setVelocity(0);
      // Temporary disable key captures

      const diffX = sprite.width - this.tileSize;
      const diffY = sprite.height - this.tileSize;

      // this.setSize(sprite.width, sprite.height);
      if (this.flipX) {
        this.setDisplayOrigin(-diffX / 2, diffY);
        this.setOffset(-diffX / 2, diffY);
      } else {
        this.setDisplayOrigin(diffX, diffY);
        this.setOffset(diffX, diffY);
      }
    }
  }

  #animationUpdate(anim: any, frame: any, sprite: any, frameKey: any) {
    // console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack') && frameKey === '1') {
      // Check overlap
      if (this.overlap) {
        // console.log('zoon overlap with the enemy');
        this.target.forEach((t) => {
          const enemyIndex = Number(t.name.split('_')[1]);

          if (
            this.scene.enemies[enemyIndex] &&
            this.scene.enemies[enemyIndex].data.values.total_attribute.hp > 0
          ) {
            this.attack(this.scene.enemies[enemyIndex], true);
          }
        });
      } else {
        // console.log('zoon not overlap with the enemy');
      }
    }
  }

  #animationComplete(context: any) {
    // console.log('context :>>>', context);
    // Check if the attack animation finished
    if (context.key.includes('attack')) {
      this.setSize(this.tileSize, this.tileSize);
      this.setDisplayOrigin(0.5, 0.5);
      this.setOffset(0, 0);
      this.anims.play(`${this.name}_idle`);
      this.scene.time.delayedCall(300, () => {
        // release key
        this.keys['mouseLeft'] = 0;
      });
    }
  }

  onCollide(
    self: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    target: any
  ) {
    if (target.name && target.name.includes('enemy')) {
      self.body.stop();
    }
  }
}
