import { enemy } from 'src/model/character';
import { Animations } from 'phaser';

export default class Skeleton {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  data: enemy;
  index: number;
  tileSize: number;
  map: number[][];
  ready: boolean;
  overlap: boolean;

  private zone!: Phaser.GameObjects.Zone;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    data: enemy,
    index: number,
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    map: number[][],
    tileSize: number
  ) {
    this.scene = scene;
    this.sprite = undefined;
    this.data = data;
    this.index = index;
    this.tileSize = tileSize;
    this.map = map;
    this.ready = false;
    this.overlap = false;
    this.init(x, y, texture, player, groundLayer);
  }

  init(
    x: number,
    y: number,
    texture: string,
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    groundLayer: Phaser.Tilemaps.TilemapLayer
  ) {
    this.sprite = this.scene.physics.add.sprite(x, y, texture);
    this.sprite.name = `enemy${this.index}`;
    this.sprite.setOrigin(0, 0);
    this.sprite.setPushable(false);

    // Set animation
    this.scene.anims.create({
      key: `enemy${this.index}-idle`,
      frames: this.scene.anims.generateFrameNames(texture, {
        start: 0,
        end: 0,
      }),
      frameRate: 5,
      repeat: 0,
    });

    this.scene.anims.create({
      key: `enemy${this.index}-walking`,
      frames: this.scene.anims.generateFrameNames(texture, {
        start: 0,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });

    this.scene.anims.create({
      key: `enemy${this.index}-attack`,
      frames: this.scene.anims.generateFrameNames(texture, {
        start: 3,
        end: 7,
      }),
      frameRate: 10,
    });

    this.sprite.on(
      Animations.Events.ANIMATION_UPDATE,
      (anim: any, frame: any, sprite: any, frameKey: any) => {
        //  We can run our effect when we get frame0004:
        // console.log('anim :>>>', anim);
        // console.log('frame :>>>', frame);
        // console.log('frameKey :>>>', frameKey);
        if (anim.key === `enemy${this.index}-attack` && frameKey === 6) {
          // Check demage
        }
      },
      this
    );

    this.sprite.on('animationcomplete', (context: any) => {
      // console.log('context :>>>', context);
      // Check if the attack animation finished
      if (context.key.includes('attack')) {
        this.sprite?.anims.play(`enemy${this.index}-idle`);
      }
    });

    console.log('setting enemy collision');

    this.addCollision(groundLayer);
    this.addCollision(player);
    this.ready = true;

    this.zone = this.scene.add.zone(
      this.sprite.x - this.tileSize / 2,
      this.sprite.y,
      this.tileSize / 2,
      this.tileSize
    );
    this.zone.setOrigin(0, 0);
    this.scene.physics.add.existing(this.zone, false);

    this.scene.physics.add.overlap(this.zone, player, () => {
      // console.log('overlap with player');
      this.overlap = true;
      this.sprite?.body.setVelocity(0);
      this.sprite?.anims.play(`enemy${this.index}-attack`, true);
    });

    console.log('enemy? ', this.sprite);
  }

  addCollision(target: any) {
    if (this.sprite) {
      // console.log('target :>>>', target);
      this.scene.physics.add.collider(
        this.sprite,
        target,
        this.#onCollide,
        null,
        this
      );
    }
  }

  checkDistance(player: any) {
    if (this.sprite) {
      if (!this.zone.body.embedded) {
        this.overlap = false;
      }

      if (!this.sprite.anims.currentAnim?.key.includes('attack')) {
        // const borders = []

        // for(let i=0; i < this.data.base_attribute.vd; i++){
        //     const count = this.data.base_attribute.vd - i
        //     if(this.map[this.sprite.y - count] !== undefined){
        //         borders.push([this.sprite.y - count][this.sprite.x])

        //         if(i > 0){
        //             for(let j = 0; j < i; j++){

        //             }
        //         }
        //         continue
        //     }

        // }
        const distance = this.data.base_attribute.vd * this.tileSize;

        const viewAxisYTop = this.sprite.y - distance;
        const viewAxisYBottom = this.sprite.y + distance;
        const viewAxisXleft = this.sprite.x - distance;
        const viewAxisXRight = this.sprite.x + distance;

        // Check y axis
        if (
          player.y >= viewAxisYTop &&
          player.y <= viewAxisYBottom &&
          !this.overlap
        ) {
          // Check x axis
          if (player.x >= viewAxisXleft && player.x <= viewAxisXRight) {
            if (player.x < this.sprite.x) {
              // console.log('follow player');
              this.sprite.setFlipX(false);
              this.sprite.anims.play(`enemy${this.index}-walking`, true);
              // Follow player
              this.scene.physics.moveToObject(
                this.sprite,
                player,
                this.tileSize
              );
              // Update zone
              this.zone.setPosition(
                this.sprite.x - this.tileSize / 2,
                this.sprite.y
              );
              this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
            } else if (player.x > this.sprite.x) {
              // console.log('follow player');
              this.sprite.setFlipX(true);
              this.sprite.anims.play(`enemy${this.index}-walking`, true);
              // Follow player
              this.scene.physics.moveToObject(
                this.sprite,
                player,
                this.tileSize
              );
              // Update zone
              this.zone.setPosition(
                this.sprite.x + this.tileSize,
                this.sprite.y
              );
              this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
            } else if (player.y < this.sprite.y) {
              // Follow player
              this.scene.physics.moveToObject(
                this.sprite,
                player,
                this.tileSize
              );
              // Update zone
              this.zone.setPosition(
                this.sprite.x,
                this.sprite.y - this.tileSize / 2
              );
              this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
            } else if (player.y > this.sprite.y) {
              // Follow player
              this.scene.physics.moveToObject(
                this.sprite,
                player,
                this.tileSize
              );
              // Update zone
              this.zone.setPosition(
                this.sprite.x,
                this.sprite.y + this.tileSize
              );
              this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
            }
          } else {
            //   console.log('stop follow player');
            this.sprite.anims.play(`enemy${this.index}-idle`, true);
            this.sprite.body.setVelocity(0);
          }
        } else {
          // console.log('stop follow player');
          // this.sprite.anims.play(`enemy${this.index}-idle`, true);
          this.sprite.body.setVelocity(0);
        }
      }
    }
  }

  updateData(data: enemy) {
    this.data = data;
  }

  #onCollide(self: any, target: any) {
    // console.log('self', self);
    // console.log('target', target);
    if (target.body) {
      target.body.setVelocity(0);
    }
  }
}
