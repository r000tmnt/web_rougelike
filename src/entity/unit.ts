import { player, enemy, action } from 'src/model/character';
import Dungeon from 'src/scene/dungeon';
import { useGameStore } from 'src/stores/game';
import { calculateDamage } from 'src/utils/battle';

export default class unit {
  scene: Dungeon;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
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
    this.scene = scene;
    this.sprite = this.scene.physics.add.sprite(x, y);
    this.sprite.setData(data);
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
    this.sprite.name = texture;
    this.sprite.setSize(this.tileSize, this.tileSize);
    this.sprite.setOrigin(0, 0);
    this.sprite.setOffset(0, 0); // Adjust rendering position
    this.sprite.setPushable(false);
  }

  setData() {
    Object.entries(this.sprite.getData('total_attribute')).forEach((a) => {
      const key = a[0];
      // console.log(key);
      this.sprite.data.values.total_attribute[key] =
        this.sprite.data.values.base_attribute[key] +
        this.sprite.data.values.add_attribute[key];
    });

    console.log('total ', this.sprite.data.values.total_attribute);
  }

  addCollision(target: any, callback: any) {
    if (this.sprite) {
      // console.log('target :>>>', target);
      this.scene.physics.add.collider(
        this.sprite,
        target,
        callback,
        null,
        this
      );
    }
  }

  attack(target: any, isPlayer: boolean) {
    const result = calculateDamage(
      this.sprite.data.values,
      target.sprite.data.values
    );

    this.dmgText.setPosition(
      target.sprite.x,
      target.sprite.y - this.tileSize / 2
    );

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
