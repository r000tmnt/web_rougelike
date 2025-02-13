import { player, enemy, action } from 'src/model/character';
import Dungeon from 'src/scene/dungeon';
import { useGameStore } from 'src/stores/game';
import { calculateDamage } from 'src/utils/battle';

export default class unit extends Phaser.Physics.Arcade.Sprite {
  scene: Dungeon;
  tileSize: number;
  map: number[][];
  ready: boolean;
  overlap: boolean;
  status: string;
  dmgText: Phaser.GameObjects.Text;
  statText: Phaser.GameObjects.Text;
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

  attack(target: any, isPlayer: boolean) {
    const result = calculateDamage(this.data.values, target.data.values);

    this.dmgText.setPosition(target.x, target.y - this.tileSize / 2);

    // Check demage
    if (result.value === 0) {
      // Miss!
      this.dmgText.setText('MISS');
      this.dmgText.setVisible(true);
    } else {
      console.log('ENEMY HIT!');
      if (result.type.includes('crit')) {
        this.dmgText.setText(`${result.value}`);
        this.dmgText.setStyle({ color: '#FFB343' });
        this.dmgText.setFontSize(this.tileSize * 0.4);
        this.dmgText.setVisible(true);
      } else {
        this.dmgText.setText(`${result.value}`);
        this.dmgText.setVisible(true);
      }

      const gameStore = useGameStore();

      gameStore.emitter.emit(
        `${isPlayer ? 'enemy' : 'player'}-take-damage`,
        isPlayer
          ? {
              index: target.index,
              result: result.value,
            }
          : result.value
      );
    }

    setTimeout(() => {
      this.dmgText.setVisible(false);
      this.dmgText.setFontSize(this.tileSize * 0.3);
      this.dmgText.setStyle({ color: '#ffffff' });
    }, 500);
  }
}
