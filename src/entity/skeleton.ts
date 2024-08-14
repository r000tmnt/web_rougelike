import { enemy } from 'src/model/character';

export default class Skeleton {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  data: enemy;
  index: number;
  tileSize: number;
  map: number[][];
  ready: boolean;

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
    this.init(x, y, texture, player, groundLayer);
    this.map = map;
    this.tileSize = tileSize;
    this.ready = false;
  }

  init(
    x: number,
    y: number,
    texture: string,
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    groundLayer: Phaser.Tilemaps.TilemapLayer
  ) {
    this.sprite = this.scene.physics.add.sprite(x, y, texture);
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

    this.#setCollision(player, groundLayer);
  }

  #setCollision(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    groundLayer: Phaser.Tilemaps.TilemapLayer
  ) {
    if (this.sprite) {
      console.log('setting enemy collision');

      this.scene.physics.add.collider(groundLayer, this.sprite);
      this.addCollision(this.sprite, player);
      this.ready = true;

      console.log('enemy? ', this.sprite);
    }
  }

  addCollision(target: any) {
    if (this.sprite) {
      console.log('target :>>>', target);
      this.scene.physics.add.collider(
        target,
        this.sprite,
        this.#onCollide,
        null,
        this
      );
    }
  }

  checkDistance(player: any) {
    if (this.sprite) {
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
      if (player.y >= viewAxisYTop && player.y <= viewAxisYBottom) {
        // Check x axis
        if (player.x >= viewAxisXleft && player.x <= viewAxisXRight) {
          if (player.x < this.sprite.x) {
            // console.log('follow player');
            this.sprite.setFlipX(false);
            this.sprite.anims.play(`enemy${this.index}-walking`, true);
            // Follow player
            this.scene.physics.moveToObject(this.sprite, player, this.tileSize);
          }

          if (player.x > this.sprite.x) {
            // console.log('follow player');
            this.sprite.setFlipX(true);
            this.sprite.anims.play(`enemy${this.index}-walking`, true);
            // Follow player
            this.scene.physics.moveToObject(this.sprite, player, this.tileSize);
          }
        } else {
          //   console.log('stop follow player');
          //   this.sprite.anims.play(`enemy${this.index}-idle`);
          //   this.sprite.body.setVelocity(0);
        }
      } else {
        console.log('stop follow player');
        this.sprite.anims.play(`enemy${this.index}-idle`, true);
        this.sprite.body.setVelocity(0);
      }
    }
  }

  updateData(data: enemy) {
    this.data = data;
  }

  #onCollide(self: any, target: any) {
    console.log('self', self);
    console.log('target', target);
  }
}
