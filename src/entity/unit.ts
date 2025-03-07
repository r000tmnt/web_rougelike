import { item, RARITY_COLORS } from 'src/model/item';
import { player, enemy, action } from 'src/model/character';
import Dungeon from 'src/scene/dungeon';
import { useGameStore } from 'src/stores/game';
import { calculateDamage } from 'src/utils/battle';
import { getPosition } from 'src/utils/path';

export default class unit extends Phaser.Physics.Arcade.Sprite {
  scene: Dungeon;
  tileSize: number;
  map: number[][];
  ready: boolean;
  overlap: boolean;
  status: string;
  dmgText: Phaser.GameObjects.Text;
  statText: Phaser.GameObjects.Text;
  activeText: Phaser.GameObjects.Text[];
  keys: action;

  constructor(
    scene: Dungeon,
    x: number,
    y: number,
    texture: string,
    data: enemy | player,
    tileSize: number,
    map: number[][],
    ready: boolean,
    overlap: boolean
  ) {
    super(scene, x, y, texture);
    this.scene = scene;
    this.setData(data);
    this.tileSize = tileSize;
    this.map = map;
    this.ready = ready;
    this.overlap = overlap;
    this.status = '';
    (this.dmgText = this.scene.add
      .text(x, y - tileSize / 2, '', {
        fontSize: tileSize * 0.3,
        fontFamily: 'pixelify',
      })
      .setOrigin(0.5)
      .setVisible(false)),
      (this.statText = this.scene.add
        .text(x, y - tileSize / 2, '', {
          fontSize: tileSize * 0.3,
          fontFamily: 'pixelify',
        })
        .setOrigin(0.5)
        .setVisible(false)),
      (this.keys = {});
    this.activeText = [];
    this.#init(texture);
  }

  #init(texture: string) {
    this.name = texture;
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.setSize(this.tileSize, this.tileSize);
    this.setOrigin(0, 0);
    this.setOffset(0, 0); // Adjust rendering position
    this.setPushable(false);
  }

  calculateData() {
    Object.entries(this.getData('total_attribute')).forEach((a) => {
      const key = a[0];
      this.data.values.total_attribute[key] =
        this.data.values.base_attribute[key] +
        this.data.values.add_attribute[key];
    });

    // Update the limit of the attribute
    this.data.values.attribute_limit.hp = this.data.values.total_attribute.hp;
    this.data.values.attribute_limit.mp = this.data.values.total_attribute.mp;

    // console.log('total ', this.data.values.total_attribute);
  }

  addCollision(target: any, callback: any) {
    if (this) {
      // console.log('target :>>>', target);
      this.scene.physics.add.collider(this, target, callback, null, this);
    }
  }

  addOverlap(target: any) {
    this.scene.physics.add.overlap(this, target, () => {
      // console.log('overlap with ', target);
      this.overlap = true;
    });
  }

  attack(target: any, isPlayer: boolean) {
    const result = calculateDamage(this.data.values, target.data.values);

    this.dmgText.setPosition(target.x, target.y - this.tileSize / 2);

    // Check demage
    if (result.value === 0) {
      // Miss!
      this.dmgText.setText('MISS');
      this.dmgText.setVisible(true);
    } else {
      console.log('HIT!');
      if (result.type.includes('crit')) {
        this.dmgText.setText(`${result.value}`);
        this.dmgText.setStyle({ color: '#FFB343' });
        this.dmgText.setFontSize(this.tileSize * 0.4);
        this.dmgText.setVisible(true);
      } else {
        this.dmgText.setText(`${result.value}`);
        this.dmgText.setVisible(true);
      }

      target.takeDamage(result.value, !isPlayer, target);
    }

    this.scene.time.delayedCall(500, () => {
      this.dmgText.setVisible(false);
      this.dmgText.setFontSize(this.tileSize * 0.3);
      this.dmgText.setStyle({ color: '#ffffff' });
    });
  }

  takeDamage(dmg: number, isPlayer: boolean, self: any) {
    const gameStore = useGameStore();
    this.status = 'hit';

    this.body?.setVelocity(0);

    const data = isPlayer ? gameStore.getPlayer : this.data.values;

    data.total_attribute.hp -=
      dmg > data.total_attribute.hp ? data.total_attribute.hp : dmg;

    const name = isPlayer ? this.name : this.name.split('_')[0];

    // console.log('current hp ', this.data.values.base_attribute.hp
    this.setFrame(
      this.scene.anims.get(`${name}_take_damage`).frames[0].textureFrame
    );
    this.scene.juice.shake(this, { x: 1, repeat: 2 });

    // If this unit run out of hp
    if (data.total_attribute.hp === 0) {
      this.status = 'dead';
      // If the player is taking damage
      if (isPlayer) {
        this.active = false;
        this.scene.camera?.pan(this.x, this.y, 200, 'Power2');
        this.scene.camera?.zoomTo(2, 200);

        this.scene.time.delayedCall(500, () => {
          this.anims.play(`${name}_lose`);
          this.setFrame(
            this.scene.anims.get(`${name}_lose`).frames[1].textureFrame
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
        });
      } else {
        // Enemy taking damage
        if (this.active) self.enemyLose();
      }
    } else {
      this.scene.time.delayedCall(200, () => {
        this.status = '';
        this.anims.play(`${name}_idle`);
        this.keys['mouseLeft'] = 0;
        if (!isPlayer && !self.inSight) self.getRandomDirection();
      });
    }

    if (isPlayer) gameStore.setPlayerStatus(data as player);
  }

  prepareDropItems() {
    const rates: number[] = this.data.values.bag.map((d: item) => {
      switch (d.rarity) {
        case 0:
          return 0.7;
        case 1:
          return 0.2;
        case 2:
          return 0.07;
        case 3:
          return 0.03;
        case 4:
          return 0.01;
        default:
          return 0.5;
      }
    });

    const dropItems: item[] = [];

    const random = Math.random();

    rates.forEach((rate: number, index: number) => {
      if (random < rate) {
        dropItems.push(JSON.parse(JSON.stringify(this.data.values.bag[index])));
      }
    });

    if (dropItems.length) {
      this.dropItems(dropItems);
    }
  }

  dropItems(dropItems: item[]) {
    // Store items
    const group = this.scene.droppedItems.length;
    const itemSprites: Phaser.GameObjects.Sprite[] = [];
    // Draw items
    dropItems.forEach((item: item, index: number) => {
      // Check the surrounding tiles
      const { x, y } = getPosition(
        this,
        this.scene.offsetX,
        this.scene.offsetY,
        this.tileSize
      );

      // TOP, RIGHT, BOTTOM, LEFT
      const surroundingTiles = [
        [x, y - 1],
        [x + 1, y],
        [x, y + 1],
        [x - 1, y],
      ];
      const blockedTiles = surroundingTiles.filter(
        (tile) => this.map[tile[1]][tile[0]] > 0
      );

      // Define a range of pixels to drop the item
      const defaultStart = 0 - this.tileSize * 0.5;
      const defaultLimit = this.tileSize * 1.5;
      let startX = defaultStart,
        endX = defaultLimit,
        startY = defaultStart,
        endY = defaultLimit;

      blockedTiles.forEach((tile) => {
        if (tile[0] < x) {
          startX = 0;
        }

        if (tile[0] > x) {
          endX = this.tileSize;
        }

        if (tile[1] < y) {
          startY = 0;
        }

        if (tile[1] > y) {
          endY = this.tileSize;
        }
      });

      const dropX = this.x + Phaser.Math.Between(startX, endX);
      const dropY = this.y + Phaser.Math.Between(startY, endY);
      const newItem = this.scene.add
        .sprite(dropX, dropY, 'demo_item', item.index)
        .setInteractive()
        .setData(item);
      const itemText = this.scene.add
        .text(newItem.x, newItem.y - 12, '', {
          fontSize: this.tileSize * 0.3,
          fontFamily: 'pixelify',
        })
        .setOrigin(0.5)
        .setVisible(false);

      if (newItem.input) {
        newItem.input.alwaysEnabled = true;
      }

      let newItemGlow: Phaser.Tweens.Tween;

      newItem.on('pointerover', () => {
        // Update index
        this.scene.itemIndex[0] = group;
        this.scene.itemIndex[1] = index;

        // Display item name
        itemText.setText(item.name);
        // itemText.setStyle({ color: '#FFB343' });
        // itemText.setFontSize(this.tileSize * 0.4);
        itemText.setVisible(true);

        if (newItem.preFX) {
          newItem.preFX.setPadding(2);
          const fx = newItem.preFX?.addGlow(16756290);
          // Store the glow effect for later
          newItem.setData('fx', fx);
          // Store item data
          newItem.setData(item);

          //  For PreFX Glow the quality and distance are set in the Game Configuration
          newItemGlow = this.scene.tweens.add({
            targets: fx,
            outerStrength: 1,
            yoyo: true,
            loop: -1,
            ease: 'sine.inout',
          });
        }
      });

      newItem.on('pointerout', () => {
        // Update index
        this.scene.itemIndex[0] = -1;
        this.scene.itemIndex[1] = -1;
        // Hide item name
        itemText.setVisible(false);
        // Stop glow effect
        newItemGlow.stop();
        // Remove glow effect
        newItem.preFX?.remove(newItem.data.values.fx);
      });

      newItem.on('pointerdown', () => {
        // TODO - Check pick up distance
        const [group, index] = this.scene.itemIndex;
        if (this.scene.droppedItems[group].value[index]) {
          const pointedItem = this.scene.droppedItems[group].value[index];

          if (this.scene.player) {
            const { x, y } = this.scene.player;
            // If the item is with the pick up range
            const distance = Phaser.Math.Distance.Between(
              x,
              y,
              pointedItem.x,
              pointedItem.y
            );
            if (distance <= this.tileSize)
              this.pickUpItem(newItem, group, index);
          }
        }
      });

      if (this.scene.player) {
        this.scene.physics.add.existing(newItem);
        this.scene.physics.add.overlap(newItem, this.scene.player, () => {
          console.log('overlap with item');
          this.pickUpItem(newItem, group, index);
        });
      }

      // Simulate drop effect
      this.scene.tweens.add({
        targets: newItem,
        x: dropX + 10,
        y: dropY + 10,
        duration: 500,
        ease: 'Bounce.easeOut',
      });

      itemSprites.push(newItem);
    });

    this.scene.droppedItems.push({ group, value: itemSprites });
  }

  pickUpItem(item: Phaser.GameObjects.Sprite, group: number, index: number) {
    if (this.scene.player) {
      const { x, y, data } = this.scene.player;
      // Check if the bag is not full
      const totalItem = data.values.bag.filter(
        (i: item) => i && Object.entries(i).length
      ).length;
      if (totalItem < data.values.attribute_limit.bag) {
        // Pick up the item
        // Display item name on top of player sprite
        let color;
        try {
          color = RARITY_COLORS[item.data.values.rarity].color || '#ffffff';
        } catch (error: any) {
          console.log(error);
          color = '#ffffff';
        }
        const defaultY = y - 20;
        const lastText = this.activeText[this.activeText.length - 1];
        const updateY = lastText ? lastText.y - 20 : defaultY;

        const pickUpText = this.scene.add
          .text(x, y - 20, item.data.values.name, {
            fontSize: this.tileSize * 0.3,
            fontFamily: 'pixelify',
            color: color, // Set color based on rarity
            stroke: '#000', // Black stroke for visibility
            strokeThickness: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: { x: 5, y: 2 },
          })
          .setOrigin(0.5, 1);

        this.activeText.push(pickUpText);

        if (item.data.values.rarity > 2) {
          // Apply text glow effect
          pickUpText.setShadow(2, 2, color, 10);

          // Scale up effect
          this.scene.tweens.add({
            targets: pickUpText,
            scale: { from: 0.8, to: 1.2 },
            duration: 300,
            yoyo: true,
            ease: 'Sine.easeInOut',
          });
        }

        this.scene.tweens.add({
          targets: pickUpText,
          y: updateY, // Slide up
          alpha: { from: 0, to: 1 }, // Fade in
          duration: 500,
          ease: 'Linear',
          onComplete: () => {
            this.scene.time.delayedCall(1000, () => {
              this.scene.tweens.add({
                targets: pickUpText,
                y: updateY - 30, // Continue sliding up
                alpha: 0, // Fade out
                duration: 500,
                ease: 'Linear',
                onComplete: () => {
                  pickUpText.setVisible(false);
                  pickUpText.destroy();
                  this.activeText.shift();
                },
              });
            });
          },
        });

        // Check if the same item is in the bag
        const itemsInBag: item[] = data.values.bag.filter(
          (e: item) => e && e.id === item.data.values.id
        );

        // Check each item that is the same
        let isInTheBag = false;
        for (let i = 0; i < itemsInBag.length; i++) {
          // If the item is not full
          if (itemsInBag[i].amount < itemsInBag[i].limit) {
            itemsInBag[i].amount += 1;
            isInTheBag = true;
            break;
          }
        }

        if (!isInTheBag) {
          const empty = data.values.bag.findIndex(
            (i: item) => !i || !Object.entries(i).length
          );
          if (empty >= 0) {
            data.values.bag[empty] = JSON.parse(
              JSON.stringify(item.data.values)
            );
          } else {
            data.values.bag.push(JSON.parse(JSON.stringify(item.data.values)));
          }
        }

        // Remove the sprite on the screen
        item.setVisible(false);
        item.destroy();
        // Remove item in the array
        this.scene.droppedItems[group].value.splice(index, 1);
        if (!this.scene.droppedItems[group].value.length)
          delete this.scene.droppedItems[group];
      }
    }
  }
}
