import { enemy } from 'src/model/character';
import { Animations, Math } from 'phaser';
import { getPosition } from 'src/utils/path';

export default class Skeleton {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  data: enemy;
  index: number;
  facingAngle: number;
  tileSize: number;
  map: number[][];
  angle: number[];
  ready: boolean;
  overlap: boolean;
  inSight: boolean;
  target: any;
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
    this.inSight = false;
    this.target = null;
    this.ray = null;
    this.angle = [0, 45, 90, 135, -135, -90, -45];
    this.facingAngle = 0;
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

    this.scene.events.on('update', this.#update, this);

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
    //set ray position to the center of the object
    this.ray.setOrigin(x + this.tileSize / 2, y + this.tileSize / 2);
    //set ray direction (in radians)
    // this.ray.setAngle(2);
    //set ray direction (in degrees)
    // this.ray.setAngleDeg(90);
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
      (rayFoVCircle, target) => {
        /*
         * What to do with game objects in line of sight.
         */
        console.log('rayFoVCircle :>>>', rayFoVCircle);
        console.log('target :>>>', target);
        this.inSight = true;
        this.target = target;
      },
      this.ray.processOverlap.bind(this.ray)
    );

    console.log('enemy? ', this.sprite);
    this.sprite.anims.play('enemy_idle');
    this.#getRandomDirection();
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

  updateData(data: enemy) {
    this.data = data;
  }

  #update() {
    if (this.sprite) {
      if (!this.ray?.body.embedded && this.inSight) {
        this.inSight = false;
        // Keep chasing for one second
        setTimeout(() => {
          this.#stopMoving();
        }, 1000);
      }

      if (!this.zone.body.embedded && this.overlap) {
        this.overlap = false;
      }

      this.#startChasing();
    }
  }

  #getRandomDirection() {
    const woundering = setInterval(() => {
      if (!this.inSight) {
        const randomNumber = Math.FloatBetween(0, 1);

        this.facingAngle =
          this.angle[Math.RoundTo(this.angle.length * randomNumber, 0)];
        this.ray?.setAngleDeg(this.facingAngle);

        this.ray?.castCircle();
      } else {
        clearInterval(woundering);
      }
    }, 5000);
  }

  #startChasing(player?: any) {
    if (player) {
      const radain = Math.Angle.BetweenPoints(this.sprite, player);
      this.facingAngle = Math.RadToDeg(radain);
    }

    // let playerHide = false;、
    console.log('this.facingAngle ', this.facingAngle);
    if (this.facingAngle <= -45 && this.facingAngle >= -135) {
      console.log('enemy go up');
      // Update zone
      this.zone.setPosition(this.sprite.x, this.sprite.y - this.tileSize / 2);
      this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
      if (!this.inSight) this.sprite.setVelocityY(-this.tileSize);
    } else if (this.facingAngle <= 45 && this.facingAngle >= -45) {
      console.log('enemy go right');
      this.sprite.setFlipX(true);
      // Update zone
      this.zone.setPosition(this.sprite.x + this.tileSize, this.sprite.y);
      this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
      if (!this.inSight) this.sprite.setVelocityX(this.tileSize);
    } else if (this.facingAngle <= 135 && this.facingAngle >= 45) {
      console.log('enemy go down');
      // Update zone
      this.zone.setPosition(this.sprite.x, this.sprite.y + this.tileSize);
      this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);
      if (!this.inSight) this.sprite.setVelocityY(this.tileSize);
    } else if (this.facingAngle <= 255 && this.facingAngle >= 135) {
      console.log('enemy go left');
      this.sprite.setFlipX(false);
      // Update zone
      this.zone.setPosition(this.sprite.x - this.tileSize / 2, this.sprite.y);
      this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);
      if (!this.inSight) this.sprite.setVelocityX(-this.tileSize);
    }
    this.sprite.anims.play('enemy_walking', true);

    if (this.inSight) {
      // Follow player
      this.scene.physics.moveToObject(this.sprite, this.target, this.tileSize);
    }

    this.ray?.setOrigin(
      this.sprite.x + this.tileSize / 2,
      this.sprite.y + this.tileSize / 2
    );

    this.ray?.castCircle();
  }

  #stopMoving() {
    this.sprite.anims.play('enemy_idle', true);
    this.sprite.body.setVelocity(0);
    this.ray?.setOrigin(this.sprite.x, this.sprite.y);

    // Starting moving again
    setTimeout(() => {
      this.#getRandomDirection();
    }, 500);
  }

  #onCollide(self: any, target: any) {
    // console.log('self', self);
    // console.log('target', target);
    if (target.body) {
      target.body.setVelocity(0);
    }
  }

  // /**
  //  * Check if the player is hide behind the wall
  //  * @param viewTop - The starting row to check
  //  * @param viewLeft - The starting col to check
  //  * @param viewRight - The last col to check
  //  * @param direction - The direction this entity is facing
  //  * @param player - The target
  //  * @returns
  //  */
  // #ifPlayerOutofSight(
  //   viewTop: number,
  //   viewLeft: number,
  //   viewRight: number,
  //   direction: string,
  //   player: any
  // ) {
  //   const wall: number[][] = [];
  //   let hitWall = false;

  //   const { x, y } = getPosition(player, this.tileSize);

  //   // In case if stepping out of map
  //   if (viewRight > this.map[0].length - 1) {
  //     viewRight = this.map[0].length - 1;
  //   }
  //   // In case if stepping out of map
  //   if (this.map[viewTop] === undefined) {
  //     viewTop = 0;
  //   }
  //   // In case if stepping out of map
  //   const viewDown =
  //     viewTop + 4 > this.map.length - 1 ? this.map.length - 1 : viewTop + 4;

  //   for (let i = viewTop; i <= viewDown; i++) {
  //     for (let j = viewLeft; j <= viewRight; j++) {
  //       if (this.map[i][j] === 1) {
  //         wall.push([i, j]);
  //       }
  //     }
  //   }

  //   switch (direction) {
  //     case 'up':
  //       for (let i = 0; i < wall.length; i++) {
  //         if (y < wall[i][0] && x === wall[i][1]) {
  //           hitWall = true;
  //           break;
  //         }
  //       }
  //       break;
  //     case 'right':
  //       for (let i = 0; i < wall.length; i++) {
  //         if (y === wall[i][0] && x > wall[i][1]) {
  //           hitWall = true;
  //           break;
  //         }
  //       }
  //       break;
  //     case 'down':
  //       for (let i = 0; i < wall.length; i++) {
  //         if (y > wall[i][0] && x === wall[i][1]) {
  //           hitWall = true;
  //           break;
  //         }
  //       }
  //       break;
  //     case 'left':
  //       for (let i = 0; i < wall.length; i++) {
  //         if (y === wall[i][0] && x < wall[i][1]) {
  //           hitWall = true;
  //           break;
  //         }
  //       }
  //       break;
  //   }

  //   return hitWall;
  // }

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
