import { enemy } from 'src/model/character';
import { Animations, Math } from 'phaser';
import { getPosition } from 'src/utils/path';

export default class Skeleton {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  data: enemy;
  index: number;
  tileSize: number;
  map: number[][];
  ready: boolean;
  overlap: boolean;
  ray: Raycaster.Ray | null;

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
    tileSize: number,
    raycaster: Raycaster
  ) {
    this.scene = scene;
    this.sprite = this.scene.physics.add.sprite(x, y);
    this.data = data;
    this.index = index;
    this.tileSize = tileSize;
    this.map = map;
    this.ready = false;
    this.overlap = false;
    this.ray = null;
    this.init(x, y, texture, player, groundLayer, raycaster);
  }

  init(
    x: number,
    y: number,
    texture: string,
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    groundLayer: Phaser.Tilemaps.TilemapLayer,
    raycaster: Raycaster
  ) {
    this.sprite.name = `enemy_${this.index}`;
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

    // Set animation
    this.scene.anims.create({
      key: 'enemy_idle',
      frames: this.scene.anims.generateFrameNames(`${texture}_idle`, {
        start: 0,
        end: 0,
      }),
      frameRate: 0,
      repeat: 0,
    });

    this.scene.anims.create({
      key: 'enemy_walking',
      frames: this.scene.anims.generateFrameNames(`${texture}_idle`, {
        start: 0,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'enemy_attack',
      frames: this.scene.anims.generateFrameNames(`${texture}_idle`, {
        start: 3,
        end: 7,
      }),
      frameRate: 10,
    });

    // Animation listener
    this.sprite.on(
      Animations.Events.ANIMATION_UPDATE,
      this.#animationUpdate,
      this
    );

    // Animation listener
    this.sprite.on(
      Animations.Events.ANIMATION_COMPLETE,
      this.#animationComplete,
      this
    );

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

      // Check distance
      if (this.sprite) {
        const pointerX = this.sprite.flipX
          ? this.sprite.x + this.tileSize
          : this.sprite.x;
        const pointerY =
          this.sprite.y < player.y
            ? this.sprite.y + this.tileSize
            : this.sprite.y;

        if (
          (player.x - pointerX <= 5 && player.x - pointerX >= 0) ||
          (player.y - pointerY <= 5 && player.y - pointerY >= 0)
        ) {
          this.sprite?.body.setVelocity(0);
          this.sprite?.anims.play('enemy_attack', true);
        }
      }
    });

    //Create ray
    this.ray = raycaster.createRay();
    //set ray position
    this.ray.setOrigin(x, y);
    //set ray direction (in radians)
    this.ray.setAngle(2);
    //set ray direction (in degrees)
    this.ray.setAngleDeg(90);
    //cast single ray and get closets intersection, hit mapped object and hit segment
    // const intersection = this.ray.cast();
    //enable auto slicing field of view
    this.ray.autoSlice = true;
    //enable arcade physics body
    this.ray.enablePhysics();
    //set collision (field of view) range
    this.ray.setCollisionRange(this.tileSize * this.data.base_attribute.vd);
    //cast ray
    this.ray.castCircle();

    //get all game objects in field of view (which bodies overlap ray's field of view)
    let visibleObjects = this.ray.overlap();

    //get objects in field of view
    // visibleObjects = this.ray.overlap(group.getChildren());

    //check if object is in field of view
    visibleObjects = this.ray.overlap(player);

    //add overlap collider (require passing ray.processOverlap as process callback)
    this.scene.physics.add.overlap(
      this.ray,
      player,
      function (rayFoVCircle, target) {
        /*
         * What to do with game objects in line of sight.
         */
      },
      this.ray.processOverlap.bind(this.ray)
    );

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

        if (!this.overlap) {
          // Check y axis & x axis
          if (
            player.y >= viewAxisYTop &&
            player.y <= viewAxisYBottom &&
            player.x >= viewAxisXleft &&
            player.x <= viewAxisXRight
          ) {
            const radain = Math.Angle.BetweenPoints(this.sprite, player);
            const angle = Math.RadToDeg(radain);
            let playerHide = false;

            console.log('angle ', angle);

            if (angle <= -45 && angle >= -135) {
              // Check if the sight hits the wall
              playerHide = this.#ifPlayerOutofSight(
                Math.RoundTo(viewAxisYTop / this.tileSize, 0),
                Math.RoundTo(viewAxisXleft / this.tileSize, 0),
                Math.RoundTo(viewAxisXRight / this.tileSize, 0),
                'up',
                player
              );

              console.log('enemy go up');
              // Update zone
              this.zone.setPosition(
                this.sprite.x,
                this.sprite.y - this.tileSize / 2
              );
              this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
            } else if (angle <= 45 && angle >= -45) {
              // Check if the sight hits the wall
              playerHide = this.#ifPlayerOutofSight(
                Math.RoundTo(viewAxisYTop / this.tileSize, 0),
                Math.RoundTo(this.sprite.x / this.tileSize, 0),
                Math.RoundTo(viewAxisXRight / this.tileSize, 0),
                'right',
                player
              );

              console.log('enemy go right');
              this.sprite.setFlipX(true);
              // Update zone
              this.zone.setPosition(
                this.sprite.x + this.tileSize,
                this.sprite.y
              );
              this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
            } else if (angle <= 135 && angle >= 45) {
              // Check if the sight hits the wall
              playerHide = this.#ifPlayerOutofSight(
                Math.RoundTo(this.sprite.y / this.tileSize, 0),
                Math.RoundTo(viewAxisXleft / this.tileSize, 0),
                Math.RoundTo(viewAxisXRight / this.tileSize, 0),
                'down',
                player
              );

              console.log('enemy go down');
              // Update zone
              this.zone.setPosition(
                this.sprite.x,
                this.sprite.y + this.tileSize
              );
              this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
            } else if (angle <= 255 && angle >= 135) {
              // Check if the sight hits the wall
              playerHide = this.#ifPlayerOutofSight(
                Math.RoundTo(viewAxisYTop / this.tileSize, 0),
                Math.RoundTo(viewAxisXleft / this.tileSize, 0),
                Math.RoundTo(this.sprite.x / this.tileSize, 0),
                'left',
                player
              );

              console.log('enemy go left');
              this.sprite.setFlipX(false);
              // Update zone
              this.zone.setPosition(
                this.sprite.x - this.tileSize / 2,
                this.sprite.y
              );
              this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
            }

            this.sprite.anims.play('enemy_walking', true);
            // Follow player
            this.scene.physics.moveToObject(this.sprite, player, this.tileSize);

            if (playerHide) {
              // Keep chasing for one second
              setTimeout(() => {
                this.sprite.anims.play('enemy_idle', true);
                this.sprite.body.setVelocity(0);
              }, 1000);
            }
          } else {
            // console.log('stop follow player');
            this.sprite.anims.play('enemy_idle', true);
            this.sprite.body.setVelocity(0);
          }
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

  /**
   * Check if the player is hide behind the wall
   * @param viewTop - The starting row to check
   * @param viewLeft - The starting col to check
   * @param viewRight - The last col to check
   * @param direction - The direction this entity is facing
   * @param player - The target
   * @returns
   */
  #ifPlayerOutofSight(
    viewTop: number,
    viewLeft: number,
    viewRight: number,
    direction: string,
    player: any
  ) {
    const wall: number[][] = [];
    let hitWall = false;

    const { x, y } = getPosition(player, this.tileSize);

    // In case if stepping out of map
    if (viewRight > this.map[0].length - 1) {
      viewRight = this.map[0].length - 1;
    }
    // In case if stepping out of map
    if (this.map[viewTop] === undefined) {
      viewTop = 0;
    }
    // In case if stepping out of map
    const viewDown =
      viewTop + 4 > this.map.length - 1 ? this.map.length - 1 : viewTop + 4;

    for (let i = viewTop; i <= viewDown; i++) {
      for (let j = viewLeft; j <= viewRight; j++) {
        if (this.map[i][j] === 1) {
          wall.push([i, j]);
        }
      }
    }

    switch (direction) {
      case 'up':
        for (let i = 0; i < wall.length; i++) {
          if (y < wall[i][0] && x === wall[i][1]) {
            hitWall = true;
            break;
          }
        }
        break;
      case 'right':
        for (let i = 0; i < wall.length; i++) {
          if (y === wall[i][0] && x > wall[i][1]) {
            hitWall = true;
            break;
          }
        }
        break;
      case 'down':
        for (let i = 0; i < wall.length; i++) {
          if (y > wall[i][0] && x === wall[i][1]) {
            hitWall = true;
            break;
          }
        }
        break;
      case 'left':
        for (let i = 0; i < wall.length; i++) {
          if (y === wall[i][0] && x < wall[i][1]) {
            hitWall = true;
            break;
          }
        }
        break;
    }

    return hitWall;
  }

  #animationUpdate(anim: any, frame: any, sprite: any, frameKey: any) {
    console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack') && frameKey === '4') {
      // Check overlap
      if (this.overlap) {
        // Check demage
        console.log('ENEMY HIT!');
      }
    }
  }

  #animationComplete(context: any) {
    // console.log('context :>>>', context);
    // Check if the attack animation finished
    if (context.key.includes('attack')) {
      this.sprite?.anims.play('enemy_idle');
    }
  }
}
