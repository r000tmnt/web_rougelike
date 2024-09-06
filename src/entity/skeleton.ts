import { enemy, action, base_attribute } from 'src/model/character';
import { Animations, Math } from 'phaser';
import { getDirection, getPosition } from 'src/utils/path';
import { calculateDamage } from 'src/utils/battle';
import { useGameStore } from 'src/stores/game';

export default class Skeleton {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  data: enemy;
  index: number;
  facingAngle: number;
  tileSize: number;
  chaseTimer: NodeJS.Timeout | null;
  map: number[][];
  angle: number[];
  ready: boolean;
  overlap: boolean;
  collide: boolean;
  inSight: boolean;
  status: string;
  target: any;
  idleTimer: NodeJS.Timeout | null;
  ray: Raycaster.Ray | null;
  text: Phaser.GameObjects.Text;
  keys: action;
  navMesh: any;
  path: any;

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
    navMesh: any
  ) {
    this.scene = scene;
    this.sprite = this.scene.physics.add.sprite(x, y);
    this.data = data;
    this.index = index;
    this.tileSize = tileSize;
    this.map = map;
    this.ready = false;
    this.overlap = false;
    this.collide = false;
    this.inSight = false;
    this.target = null;
    this.ray = null;
    this.angle = [0, 45, 90, 135, 180, -180, -135, -90, -45, -0];
    this.facingAngle = 0;
    this.idleTimer = null;
    this.chaseTimer = null;
    this.status = '';
    this.navMesh = navMesh;
    this.keys = {};
    this.text = this.scene.add
      .text(x, y - tileSize / 2, '', {
        fontSize: tileSize * 0.3,
        fontFamily: 'pixelify',
      })
      .setVisible(false);
    this.init(x, y, texture, player, groundLayer);
  }

  init(
    x: number,
    y: number,
    texture: string,
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    groundLayer: Phaser.Tilemaps.TilemapLayer
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

    // console.log('setting enemy collision');

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
    this.scene.physics.world.enable(this.zone);

    this.scene.physics.add.overlap(this.zone, player, () => {
      // console.log('overlap with player');
      this.overlap = true;

      // Check distance
      if (this.sprite && this.inSight) {
        const pointerX = this.sprite.flipX
          ? this.sprite.x + this.tileSize
          : this.sprite.x;
        const pointerY =
          this.sprite.y < player.y
            ? this.sprite.y + this.tileSize
            : this.sprite.y;

        const diffX = Math.Difference(player.x, pointerX);
        const diffY = Math.Difference(player.y, pointerY);

        if ((diffX <= 5 && diffX >= 0) || (diffY <= 5 && diffY >= 0)) {
          if (!this.keys['d'] || this.keys['d'] === 0) {
            this.sprite?.body.stop();
            this.sprite?.anims.play('enemy_attack', true);
            this.keys['d'] = 1;
          }
        }
      }
    });

    this.#setData();

    // Set event listener
    this.#setEvents();

    // Create ray
    this.#setRay(this.scene.raycaster, x, y, player);

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

  updateStatus(status: string) {
    this.status = status;
  }

  updateData(data: enemy) {
    this.data = data;
  }

  #setEvents() {
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

    const gameStore = useGameStore();

    gameStore.emitter.on(
      'chase-countdown-start',
      (player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => {
        this.target = player;
      }
    );
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

  #setRay(raycaster: Raycaster, x: number, y: number, player: any) {
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
    // this.ray.castCircle();
    // this.ray.cast();
    this.ray.setConeDeg(this.tileSize);
    this.ray.castCone();

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
      (rayFoVCircle: any, target: any) => {
        /*
         * What to do with game objects in line of sight.
         */
        // console.log('rayFoVCircle :>>>', rayFoVCircle);
        // console.log('target :>>>', target);
        this.inSight = true;
        // this.looking = false;
        this.target = target;
      },
      this.ray.processOverlap.bind(this.ray)
    );
  }

  #update() {
    if (this.sprite && this.ray?.body) {
      this.overlap = this.zone.body.embedded;

      if (this.status === 'hit') {
        // TODO: Play get hit animation
        this.scene.time.delayedCall(200, () => {
          this.status = '';
        });
      } else if (this.status === 'dead') {
        // TODO: Play dead animation
      } else {
        if (
          this.target &&
          !this.sprite.anims.currentAnim?.key.includes('attack')
        ) {
          const { x, y } = this.target;
          const distance = Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            x,
            y
          );
          // console.log('distance :>>>', distance);
          if (distance < 5) {
            // If there is path left, grab the next point. Otherwise, null the target.
            if (this.path && this.path.length > 0) {
              console.log(`${this.sprite.name} looking to path in update`);
              this.target = this.path.shift();
            } else {
              this.target = null;
            }
          }

          if (this.target && !this.overlap) {
            const radain = Math.Angle.BetweenPoints(this.sprite, this.target);
            this.facingAngle = Math.RadToDeg(radain);
            this.ray?.setAngleDeg(this.facingAngle);

            console.log(
              `${this.sprite.name} facing direcion in update`,
              this.facingAngle
            );

            this.scene.physics.velocityFromRotation(
              radain,
              this.tileSize,
              this.sprite.body.velocity
            );
          }

          if (!this.ray?.body.embedded) {
            console.log(`${this.sprite.name} lost the player`);
            this.inSight = false;
            if (this.chaseTimer === null) {
              // Keep chasing for 10 second
              // Get the player position again
              const gameStore = useGameStore();
              gameStore.emitter.emit('chase-countdown-calling');
              this.chaseTimer = setInterval(() => {
                if (!this.inSight) {
                  console.log(`${this.sprite.name} stop chasing`);
                  this.target = null;
                  this.sprite?.body?.stop();
                  this.#getRandomDirection();
                  clearInterval(Number(this.chaseTimer));
                }
              }, 10000);
            }
          }
        }

        if (this.ray?.body && !this.overlap) {
          this.#startChasing();
        }
      }
    }
  }

  #getRandomDirection() {
    if (!this.inSight && this.ray) {
      const randomNumber = Math.Between(0, this.angle.length - 1);
      this.facingAngle = this.angle[randomNumber];

      console.log(
        `${this.sprite.name} facing direcion at random`,
        this.facingAngle
      );

      this.ray.setAngleDeg(this.facingAngle);

      // this.ray?.castCircle();
      // this.#startChasing();
    }
  }

  #limitDirection(limiter: any) {
    let done = false;

    let limitAngle = this.angle.filter((a) => {
      if (limiter.max === 135) {
        return a < 135 && a > -135;
      }

      if (limiter.max === -45) {
        return a < 1 - 35 || a > -45;
      }

      if (limiter.min === -45) {
        return a < -45 || a > 45;
      }

      if (limiter.min === 45) {
        return a < 45 || a > 135;
      }
    });

    console.log('limited angles :>>>', limitAngle);

    const { x, y } = getPosition(
      this.sprite,
      this.scene.offsetX,
      this.scene.offsetY,
      this.tileSize
    );

    do {
      const randomNumber = Math.Between(0, limitAngle.length - 1);
      this.facingAngle = limitAngle[randomNumber];

      const direction = getDirection(this.facingAngle);

      switch (direction) {
        case 0:
          if (this.map[y - 1][x] !== 0) {
            limitAngle = limitAngle.filter((a) => a < -135 || a > -45);
          } else {
            this.ray?.setAngleDeg(this.facingAngle);
            this.#goUp();
            done = true;
          }
          break;
        case 1:
          if (this.map[y][x + 1] !== 0) {
            limitAngle = limitAngle.filter((a) => a < -45 || a > 45);
          } else {
            this.ray?.setAngleDeg(this.facingAngle);
            this.#goRight();
            done = true;
          }
          break;
        case 2:
          if (this.map[y + 1][x] !== 0) {
            limitAngle = limitAngle.filter((a) => a < 45 || a > 135);
          } else {
            this.ray?.setAngleDeg(this.facingAngle);
            this.#goDown();
            done = true;
          }
          break;
        case 3:
          if (this.map[y][x - 1] !== 0) {
            limitAngle = limitAngle.filter((a) => a < 135 && a > -135);
          } else {
            this.ray?.setAngleDeg(this.facingAngle);
            this.#goLeft();
            done = true;
          }
          break;
      }
    } while (!done);
  }

  #changeDirection(obstacle?: any) {
    const { down, left, right, up } = this.sprite.body.touching;

    // Get current position
    const { x, y } = getPosition(
      this.sprite,
      this.scene.offsetX,
      this.scene.offsetY,
      this.tileSize
    );

    // console.log(this.sprite.touching)

    // Checking other direction
    const direction = [
      [y - 1, x],
      [y, x + 1],
      [y + 1, x],
      [y, x - 1],
    ];

    if (down) {
      direction.splice(2, 1);
    }

    if (left) {
      direction.splice(3, 1);
    }

    if (right) {
      direction.splice(1, 1);
    }

    if (up) {
      direction.splice(0, 1);
    }

    for (let i = 0; i < direction.length; i++) {
      const newX = direction[i][1];
      const newY = direction[i][0];
      if (this.map[newY] && this.map[newY][newX] === 0) {
        if (newY < y) {
          this.#goUp();
        }
        if (newY > y) {
          this.#goDown();
        }
        if (newX < x) {
          this.#goLeft();
        }
        if (newX > x) {
          this.#goRight();
        }
        break;
      }
    }
  }

  #startChasing() {
    if (
      !this.sprite.anims.currentAnim?.key.includes('attack') &&
      !this.overlap
    ) {
      // console.log(`${this.sprite.name} on position x:${x} y:${y}`);

      // let playerHide = false;、
      // console.log('this.facingAngle ', this.facingAngle);
      const direction = getDirection(this.facingAngle);
      this.ray?.setAngleDeg(this.facingAngle);

      switch (direction) {
        case 0:
          this.#goUp();
          break;
        case 1:
          this.#goRight();
          break;
        case 2:
          this.#goDown();
          break;
        case 3:
          this.#goLeft();
          break;
        default:
          this.#getRandomDirection();
          break;
      }

      this.sprite.anims.play('enemy_walking', true);

      this.ray?.setOrigin(
        this.sprite.x + this.tileSize / 2,
        this.sprite.y + this.tileSize / 2
      );

      // this.ray?.castCircle();
      // this.ray?.cast();
      this.ray?.castCone();

      if (
        !this.inSight &&
        this.idleTimer === null &&
        this.chaseTimer === null
      ) {
        this.idleTimer = setTimeout(() => {
          this.#stopMoving();
        }, Math.Between(1000, 3000));
      }
    }
  }

  #goUp() {
    // console.log(`${this.sprite.name} go up`);
    // Update zone
    this.zone.setPosition(this.sprite.x, this.sprite.y - this.tileSize / 2);
    this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);

    if (this.target && !this.overlap) {
      // console.log(`${this.sprite.name} start chasing`);
      if (this.target.name) {
        this.#moveToTarget(
          new Math.Vector2(
            this.target.x - this.scene.offsetX,
            this.target.y - this.scene.offsetY + this.tileSize
          )
        );
      } else {
        this.#moveToTarget(new Math.Vector2(this.target.x, this.target.y));
      }
    } else {
      this.sprite.setVelocityY(-this.tileSize);
    }
  }

  #goRight() {
    // console.log(`${this.sprite.name} go right`);
    this.sprite.setFlipX(true);
    // Update zone
    this.zone.setPosition(this.sprite.x + this.tileSize, this.sprite.y);
    this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);

    if (this.target && !this.overlap) {
      // console.log(`${this.sprite.name} start chasing`);
      if (this.target.name) {
        this.#moveToTarget(
          new Math.Vector2(
            this.target.x - this.scene.offsetX - this.tileSize,
            this.target.y - this.scene.offsetY
          )
        );
      } else {
        this.#moveToTarget(new Math.Vector2(this.target.x, this.target.y));
      }
    } else {
      this.sprite.setVelocityX(this.tileSize);
    }
  }

  #goDown() {
    // console.log(`${this.sprite.name} go down`);
    // Update zone
    this.zone.setPosition(this.sprite.x, this.sprite.y + this.tileSize);
    this.zone.setDisplaySize(this.tileSize, this.tileSize / 2);

    if (this.target && !this.overlap) {
      // console.log(`${this.sprite.name} start chasing`);
      if (this.target.name) {
        this.#moveToTarget(
          new Math.Vector2(
            this.target.x - this.scene.offsetX,
            this.target.y - this.scene.offsetY - this.tileSize
          )
        );
      } else {
        this.#moveToTarget(new Math.Vector2(this.target.x, this.target.y));
      }
    } else {
      this.sprite.setVelocityY(this.tileSize);
    }
  }

  #goLeft() {
    // console.log(`${this.sprite.name} go left`);
    this.sprite.setFlipX(false);
    // Update zone
    this.zone.setPosition(this.sprite.x - this.tileSize / 2, this.sprite.y);
    this.zone.setDisplaySize(this.tileSize / 2, this.tileSize);

    if (this.target && !this.overlap) {
      // console.log(`${this.sprite.name} start chasing`);
      if (this.target.name) {
        this.#moveToTarget(
          new Math.Vector2(
            this.target.x - this.scene.offsetX + this.tileSize,
            this.target.y - this.scene.offsetY
          )
        );
      } else {
        this.#moveToTarget(new Math.Vector2(this.target.x, this.target.y));
      }
    } else {
      this.sprite.setVelocityX(-this.tileSize);
    }
  }

  #moveToTarget(destination: Math.Vector2) {
    this.path = this.navMesh.findPath(
      new Math.Vector2(
        this.sprite.x - this.scene.offsetX,
        this.sprite.y - this.scene.offsetY
      ),
      destination
    );

    // console.log('path :>>>', this.path);

    // If there is a valid path, grab the first point from the path and set it as the target
    if (this.path && this.path.length > 0) {
      // Add the offset back to path
      this.path.forEach((p) => {
        p.x += this.scene.offsetX;
        p.y += this.scene.offsetY;
      });
      console.log(`${this.sprite.name} looking to path in #moveToTarget`);
      this.target = this.path.shift();
    } else {
      this.target = null;
    }

    // if (
    //   Math.Difference(this.sprite.x, destination.x) > 5 ||
    //   Math.Difference(this.sprite.y, destination.y) > 5
    // ) {
    //   // Follow player
    //   this.scene.physics.moveToObject(this.sprite, destination, this.tileSize);
    // }
  }

  #stopMoving() {
    if (this.sprite.body) {
      this.sprite?.anims?.play('enemy_idle', true);
      this.sprite.body.setVelocity(0);

      if (!this.inSight) {
        // Starting moving again
        setTimeout(() => {
          this.idleTimer = null;
          // this.looking = false;
          this.#getRandomDirection();
        }, 2000);
      }
    }
  }

  #onCollide(self: any, target: any) {
    this.sprite.body.setVelocity(0);
    // console.log('self', self);
    console.log('enemy collide with target', target);
    if (target.name && target.name.includes('enemy')) {
      this.sprite.anims.play('enemy_idle');
      this.#changeDirection();
    }

    // If collide with player but player not in sight
    else if (target.name && target.name.includes('player')) {
      this.target = target;
      // this.sprite.body.setImmovable(true);
      this.collide = true;
    } else {
      // this.sprite.body.setImmovable(false);
      this.collide = false;
      // Collide with something else (ex. wall)
      if (this.target) {
        // Find another path
      } else {
        // Get facing direction
        const radain = Math.Angle.BetweenPoints(this.sprite, {
          x: target.x * this.tileSize,
          y: target.y * this.tileSize,
        });
        this.facingAngle = Math.RadToDeg(radain);

        const direction = getDirection(this.facingAngle);

        switch (direction) {
          case 0:
            this.#limitDirection({ min: -135, max: -45 });
            break;
          case 1:
            this.#limitDirection({ min: -45, max: 45 });
            break;
          case 2:
            this.#limitDirection({ min: 45, max: 135 });
            break;
          case 3:
            this.#limitDirection({ min: -135, max: 135 });
            break;
        }
      }
    }
  }

  #animationUpdate(anim: any, frame: any, sprite: any, frameKey: any) {
    // console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack') && frameKey === '4') {
      // Check overlap
      if (this.overlap && !this.text.visible) {
        const result = calculateDamage(this.data, this.scene.player.data);

        this.text.setPosition(
          this.scene.player.sprite.x,
          this.scene.player.sprite.y - this.tileSize / 2
        );

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

          const gameStore = useGameStore();
          gameStore.emitter.emit('player-take-damage', result.value);
        }

        setTimeout(() => {
          this.text.setVisible(false);
          this.text.setFontSize(this.tileSize * 0.3);
          this.text.setStyle({ color: '#ffffff' });
        }, 500);
      }
    }
  }

  #animationComplete(context: any) {
    // console.log('context :>>>', context);
    // Check if the attack animation finished
    if (context.key.includes('attack')) {
      this.sprite.body.setVelocity(0);
      this.sprite?.anims.play('enemy_idle');
      setTimeout(() => {
        // release key
        this.keys['d'] = 0;
      }, 500);
    }
  }
}
