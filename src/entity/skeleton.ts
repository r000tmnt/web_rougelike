import { enemy, action, base_attribute } from 'src/model/character';
import { Animations } from 'phaser';
import { getDirection, getPosition, getDistance } from 'src/utils/path';
import { calculateDamage, gainExp } from 'src/utils/battle';
import { useGameStore } from 'src/stores/game';

export default class Skeleton {
  scene: Phaser.Scene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  data: enemy;
  index: number;
  facingAngle: number;
  tileSize: number;
  half: number;
  awaitTimer: NodeJS.Timeout | null;
  map: number[][];
  angle: number[];
  ready: boolean;
  overlap: boolean;
  collide: boolean;
  inSight: boolean;
  status: string;
  phase: string;
  step: number;
  target: any;
  collidedTarget: any;
  idleTimer: NodeJS.Timeout | null;
  ray: Raycaster.Ray | null;
  text: Phaser.GameObjects.Text;
  keys: action;
  navMesh: any;
  path: any;
  lastCheckTime: number;
  walkingTweens: Phaser.Tweens.Tween | null;
  intersections: Phaser.Geom.Point[];

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
    this.half = tileSize / 2;
    this.map = map;
    this.ready = false;
    this.overlap = false;
    this.collide = false;
    this.inSight = false;
    this.target = null;
    this.collidedTarget = null;
    this.ray = null;
    this.angle = [0, 45, 90, 135, 180, -180, -135, -90, -45, -0];
    this.facingAngle = 0;
    this.idleTimer = null;
    this.awaitTimer = null;
    this.status = '';
    this.phase = 'roaming'; // roaming, searching, aggro
    this.step = 0;
    this.lastCheckTime = 0;
    this.navMesh = navMesh;
    this.keys = {};
    this.walkingTweens = null;
    this.intersections = [];
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

    this.scene.textures.addSpriteSheetFromAtlas(`${texture}_attack`, {
      atlas: texture,
      frame: `${texture}_attack`,
      frameWidth: this.tileSize,
      frameHeight: this.tileSize,
    });

    this.scene.textures.addSpriteSheetFromAtlas(`${texture}_lose`, {
      atlas: texture,
      frame: `${texture}_lose`,
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
      frames: this.scene.anims.generateFrameNames(`${texture}_attack`, {
        start: 0,
        end: 4,
      }),
      frameRate: 10,
    });

    this.scene.anims.create({
      key: 'enemy_lose',
      frames: this.scene.anims.generateFrameNames(`${texture}_lose`, {
        start: 0,
        end: 5,
      }),
      frameRate: 8,
    });

    // console.log('setting enemy collision');

    this.addCollision(groundLayer);
    this.addCollision(player);
    this.ready = true;

    this.scene.events.on('update', this.#update, this);

    this.sprite.on('destroy', () => {
      this.scene.events.off('update', this.#update);
    });

    this.#setData();
    this.#setZone(player);
    // Set event listener
    this.#setEvents();

    // Create ray
    this.#setRay(this.scene.raycaster, x, y, player);

    console.log('enemy? ', this.sprite);
    this.sprite.anims.play('enemy_idle');
    setTimeout(() => {
      this.#getRandomDirection();
    }, 1000);
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

  #setZone(player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    this.zone = this.scene.add.zone(
      this.sprite.flipX
        ? this.sprite.x + this.tileSize
        : this.sprite.x - this.half,
      this.sprite.y,
      this.half,
      this.tileSize
    );
    this.zone.setOrigin(0, 0);
    this.scene.physics.world.enable(this.zone);

    this.scene.physics.add.overlap(this.zone, player, () => {
      // console.log('overlap with player');
      this.overlap = true;
    });
  }

  #markPlayerInSight(
    target: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    this.target = {
      x: target.x + this.half - this.scene.offsetX,
      y: target.y + this.half - this.scene.offsetY,
    };
    // Clear current path if exist
    if (this.path && this.path.length) this.path = null;

    let obstacleInRange = false;

    for (let i = 0; i < this.intersections.length; i++) {
      const section: any = this.intersections[i];
      if (section.segment) {
        const distance = Phaser.Math.Distance.Between(
          this.sprite.x + this.half,
          this.sprite.y + this.half,
          section.x,
          section.y
        );

        if (distance < this.tileSize) {
          obstacleInRange = true;
          break;
        }
      }
    }

    if (obstacleInRange) {
      this.#GetPath();
    } else {
      this.#moveToTarget(this.target);
    }
    // if (this.awaitTimer) {
    //   clearInterval(this.awaitTimer);
    //   this.awaitTimer = null;
    // }
    // this.sprite.body.setVelocity(0);
    // Get a new path
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
        this.#markPlayerInSight(player);
      }
    );

    gameStore.emitter.on(
      'enemy-take-damage',
      (data: { index: number; result: number }) => {
        const { index, result } = data;

        if (index === this.index) {
          this.data.total_attribute.hp -=
            result > this.data.total_attribute.hp
              ? this.data.total_attribute.hp
              : result;

          // Proceed to level up if the enemy is active
          if (this.data.total_attribute.hp === 0 && this.sprite.active) {
            this.sprite.anims.play('enemy_lose');
            this.status = 'dead';
            this.ray?.destroy();
            this.scene.removeEnemyIntheRoom(this.index);
            // Draw image at the same spot
            // this.scene.add.image(this.sprite.x, this.sprite.y, 'enemy_lose', 5);
            this.sprite.disableBody();
            this.scene.events.off('update', this.#update);
            gainExp(this.data);
          }
        }
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
    this.ray.setOrigin(x + this.half, y + this.half);
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
    const range = this.tileSize * this.data.base_attribute.vd;
    this.ray.setCollisionRange(range);
    this.ray.setDetectionRange(range);
    //cast ray
    // this.ray.castCircle();
    // this.ray.cast();
    this.ray.setConeDeg(this.tileSize * 3);
    this.ray.castCone();

    //get objects in field of view
    // visibleObjects = this.ray.overlap(group.getChildren());

    //check if object is in field of view
    // visibleObjects = this.ray.overlap(player);

    //add overlap collider (require passing ray.processOverlap as process callback)
    this.scene.physics.add.overlap(
      this.ray,
      player,
      (rayFoVCircle: any, target: any) => {
        /*
         * What to do with game objects in line of sight.
         */
        // console.log('rayFoVCircle :>>>', rayFoVCircle);
        if (this.scene.player.data.total_attribute.hp > 0) {
          this.#markPlayerInSight(target);
          this.inSight = true;
          this.phase = 'chasing';
        }
      },
      this.ray.processOverlap.bind(this.ray)
    );
  }

  #update() {
    if (this.sprite && this.ray?.body) {
      if (this.status === 'hit') {
        // TODO: Play get hit animation
        this.scene.time.delayedCall(200, () => {
          this.status = '';
        });
      } else if (this.status === 'dead') {
        // DO NOTHING, just stay dead
      } else {
        this.#alterRayAngle();

        // If the ray doesn't hit anything and the player were in sight
        if (!this.ray?.body.embedded && this.inSight) {
          console.log(`${this.sprite.name} lost the player`);
          this.inSight = false;
          this.phase = 'searching';
          // Set the last known position
          this.target = {
            x: this.scene.player.x + this.half - this.scene.offsetX,
            y: this.scene.player.y + this.half - this.scene.offsetY,
          };
        }
      }
    }
  }

  #getRandomDirection() {
    if (!this.inSight && this.ray) {
      let tempMap = JSON.parse(JSON.stringify(this.scene.walkable));

      tempMap = tempMap.filter(
        (t: { x: number; y: number; check: boolean }) => !t.check
      );

      if (!tempMap.length) {
        tempMap = tempMap.map((t: { x: number; y: number; check: boolean }) => {
          t.check = false;
          return t;
        });
      }

      this.target = tempMap[Phaser.Math.Between(0, tempMap.length - 1)];

      this.#alterRayAngle();
      this.#GetPath();
      // const randomNumber = Phaser.Math.Between(0, this.angle.length - 1);
      // this.facingAngle = this.angle[randomNumber];
      // this.ray.setAngleDeg(this.facingAngle);

      // this.ray?.castCircle();
      // this.#startChasing();
    }
  }

  #alterRayAngle() {
    if (this.ray && this.ray.origin && this.target) {
      const radain = Phaser.Math.Angle.BetweenPoints(
        this.sprite,
        this.phase === 'aggro' || this.phase === 'chasing'
          ? this.scene.player.sprite
          : this.target
      );
      this.facingAngle = Phaser.Math.RadToDeg(radain);

      this.ray.setAngleDeg(this.facingAngle);

      this.ray.setOrigin(this.sprite.x + this.half, this.sprite.y + this.half);

      const facingDirection = getDirection(this.facingAngle);

      this.zone.setAngle(this.facingAngle);

      switch (facingDirection) {
        case 0: // up
          this.zone.setPosition(this.sprite.x, this.sprite.y - this.half);
          this.zone.setDisplaySize(this.tileSize, this.half);
          break;
        case 1: // up right
          this.zone.setPosition(
            this.sprite.x + this.half,
            this.sprite.y - this.half
          );
          this.zone.setDisplaySize(this.tileSize, this.half);
          this.sprite.setFlipX(true);
          break;
        case 2: // right
          this.zone.setPosition(this.sprite.x + this.half, this.sprite.y);
          this.zone.setDisplaySize(this.half, this.tileSize);
          this.sprite.setFlipX(true);
          break;
        case 3: // right down
          this.zone.setPosition(
            this.sprite.x + this.half,
            this.sprite.y + this.tileSize
          );
          this.zone.setDisplaySize(this.tileSize, this.half);
          this.sprite.setFlipX(true);
          break;
        case 4: // down
          this.zone.setPosition(this.sprite.x, this.sprite.y + this.tileSize);
          this.zone.setDisplaySize(this.tileSize, this.half);
          break;
        case 5: // left down
          this.zone.setPosition(
            this.sprite.x - this.half,
            this.sprite.y + this.tileSize
          );
          this.zone.setDisplaySize(this.tileSize, this.half);
          this.sprite.setFlipX(false);
          break;
        case 6: // left
          this.zone.setPosition(this.sprite.x - this.half, this.sprite.y);
          this.zone.setDisplaySize(this.half, this.tileSize);
          this.sprite.setFlipX(false);
          break;
        case 7: // left up
          this.zone.setPosition(
            this.sprite.x - this.half,
            this.sprite.y - this.half
          );
          this.zone.setDisplaySize(this.tileSize, this.half);
          this.sprite.setFlipX(false);
          break;
      }

      // this.ray?.castCircle();
      // this.ray?.cast();
      this.intersections = this.ray.castCone();

      // console.log('intersections :>>>', this.intersections);
    }
  }

  // #limitDirection(limiter: any) {
  //   let done = false;

  //   let limitAngle = this.angle.filter((a) => {
  //     if (limiter.max === 135) {
  //       return a < 135 && a > -135;
  //     }

  //     if (limiter.max === -45) {
  //       return a < 1 - 35 || a > -45;
  //     }

  //     if (limiter.min === -45) {
  //       return a < -45 || a > 45;
  //     }

  //     if (limiter.min === 45) {
  //       return a < 45 || a > 135;
  //     }
  //   });

  //   console.log('limited angles :>>>', limitAngle);

  //   const { x, y } = getPosition(
  //     this.sprite,
  //     this.tileSize
  //   );

  //   do {
  //     const randomNumber = Phaser.Math.Between(0, limitAngle.length - 1);
  //     this.facingAngle = limitAngle[randomNumber];

  //     const direction = getDirection(this.facingAngle);

  //     switch (direction) {
  //       case 0:
  //         if (y - 1 >= 1 && this.map[y - 1][x] !== 0) {
  //           limitAngle = limitAngle.filter((a) => a < -135 || a > -45);
  //         } else {
  //           this.ray?.setAngleDeg(this.facingAngle);
  //           this.#GetPath();
  //           done = true;
  //         }
  //         break;
  //       case 1:
  //         if (this.map[y][x + 1] !== 0) {
  //           limitAngle = limitAngle.filter((a) => a < -45 || a > 45);
  //         } else {
  //           this.ray?.setAngleDeg(this.facingAngle);
  //           this.#GetPath();
  //           done = true;
  //         }
  //         break;
  //       case 2:
  //         if (this.map[y + 1][x] !== 0) {
  //           limitAngle = limitAngle.filter((a) => a < 45 || a > 135);
  //         } else {
  //           this.ray?.setAngleDeg(this.facingAngle);
  //           this.#GetPath();
  //           done = true;
  //         }
  //         break;
  //       case 3:
  //         if (this.map[y][x - 1] !== 0) {
  //           limitAngle = limitAngle.filter((a) => a < 135 && a > -135);
  //         } else {
  //           this.ray?.setAngleDeg(this.facingAngle);
  //           this.#GetPath();
  //           done = true;
  //         }
  //         break;
  //     }
  //   } while (!done);
  // }

  #changeDirection() {
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
        this.target = {
          x: newX * this.tileSize + this.half + this.scene.offsetX,
          y: newY * this.tileSize + this.half + this.scene.offsetY,
        };
        this.#GetPath();
        break;
      }
    }
  }

  #markTileAsChecked(target: { x: number; y: number; checked: boolean }) {
    const index = this.scene.walkable.findIndex(
      (w) => w.x === target.x && w.y === target.y
    );

    if (index >= 0) this.scene.walkable[index].checked = true;
    setTimeout(() => this.#getRandomDirection(), 1000);
  }

  #GetPath() {
    const validTarget = this.navMesh.isPointInMesh(this.target);

    console.log('validTarget :>>>', validTarget);

    if (validTarget) {
      this.path = this.navMesh.findPath(
        {
          x: this.sprite.x + this.half - this.scene.offsetX,
          y: this.sprite.y + this.half - this.scene.offsetY,
        },
        this.target
      );

      // If there is a valid path, grab the first point from the path and set it as the target
      if (this.path && this.path.length) {
        const debugGraphics = this.scene.add.graphics(0, 0).setAlpha(0.5);
        this.navMesh.enableDebug(debugGraphics);
        // Add the offset back to path
        this.path.forEach((p) => {
          p.x += this.scene.offsetX;
          p.y += this.scene.offsetY;
        });

        console.log('path :>>>', this.path);

        this.navMesh.debugDrawPath(this.path, 0xffd900);

        this.target = this.path.shift();
        this.#moveToTarget(this.target);
      } else {
        this.#markTileAsChecked(this.target);
      }
    } else {
      this.#markTileAsChecked(this.target);
    }
  }

  #getVisibleObjects() {
    if (this.ray && this.ray.body) {
      let visibleObjects = this.ray.overlap();

      console.log('visibleObjects :>>>', visibleObjects);

      // Filter out the enemy itself is exist
      visibleObjects = visibleObjects.filter(
        (obj: any) => obj.name !== `enemy_${this.index}`
      );

      return visibleObjects;
    } else {
      return [];
    }
  }

  #getAvoidanceDirection(
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    obstacle: any
  ) {
    const spriteToObstacle = new Phaser.Math.Vector2(
      obstacle.x - sprite.x,
      obstacle.y - sprite.y
    );

    const facingVector = new Phaser.Math.Vector2(
      this.sprite.body.velocity.x,
      this.sprite.body.velocity.y
    );

    // If the sprite is stationary, assume default direction (e.g., facing right)
    if (facingVector.length() === 0) {
      facingVector.set(!this.sprite.flipX ? -1 : 1, 0); // Facing left or right
    } else {
      facingVector.normalize();
    }

    const cross = facingVector.cross(spriteToObstacle.normalize());

    // Return avoidance direction based on the sign of the cross product
    return cross > 0 ? 'right' : 'left';
  }

  #moveToTarget(target: Phaser.Geom.Point) {
    if (this.ray && target && this.awaitTimer === null) {
      this.sprite.anims.play('enemy_walking');

      this.awaitTimer = setInterval(() => {
        const distance = Phaser.Math.Distance.Between(
          this.sprite.x + this.half,
          this.sprite.y + this.half,
          target.x,
          target.y
        );

        if (this.inSight) {
          const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x + this.half,
            this.sprite.y + this.half,
            this.scene.player.sprite.x + this.half,
            this.scene.player.sprite.y + this.half
          );
          // If the player is in the range of attack
          if (
            distanceToPlayer <= this.tileSize + 5 &&
            !this.keys['mouseLeft'] &&
            this.scene.player.sprite.active &&
            this.status !== 'dead'
          ) {
            // Attack
            this.phase = 'aggro';
            this.path = null;
            this.sprite.body.setVelocity(0);
            this.#alterRayAngle();
            this.sprite?.anims.play('enemy_attack', true);
            this.keys['mouseLeft'] = 1;
            // this.#setZone(this.scene.player.sprite);
          }
        }

        if (distance <= 5 && !this.keys['mouseLeft']) {
          if (this.awaitTimer !== null) {
            clearInterval(this.awaitTimer);
            this.awaitTimer = null;
          }
          // If there are path to go
          if (this.path && this.path.length) {
            this.target = this.path.shift();
            // this.#followThePath();
            this.#moveToTarget(this.target);
          } else {
            // Mark the point as checked
            const index = this.scene.walkable.findIndex(
              (w) => w.x === this.target.x && w.y === this.target.y
            );

            if (index >= 0) this.scene.walkable[index].checked = true;
            this.#stopMoving();
          }
        } else {
          const angleToTarget = Phaser.Math.Angle.Between(
            this.sprite.x + this.half,
            this.sprite.y + this.half,
            target.x,
            target.y
          );

          // this.intersections.forEach((section: any) => {
          //   if (section.segment) {
          //     const distance = Phaser.Math.Distance.Between(
          //       this.sprite.x + this.half,
          //       this.sprite.y + this.half,
          //       section.x,
          //       section.y
          //     );

          //     if (distance < this.half) {
          //       const avoidanceDirection = this.#getAvoidanceDirection(
          //         this.sprite,
          //         section
          //       );

          //       if (avoidanceDirection === 'left') {
          //         this.sprite.body.velocity.x -= this.tileSize;
          //         this.sprite.body.velocity.y -= this.tileSize;
          //       } else if (avoidanceDirection === 'right') {
          //         this.sprite.body.velocity.x += this.tileSize;
          //         this.sprite.body.velocity.y += this.tileSize;
          //       }
          //     }
          //   }
          // });

          // let avoidAngle = 0;
          // if (this.collidedTarget) {
          //   const angleToObstacle = Phaser.Math.Angle.Between(
          //     this.sprite.x,
          //     this.sprite.y,
          //     this.collidedTarget.x,
          //     this.collidedTarget.y
          //   );

          //   avoidAngle +=
          //     (angleToObstacle > angleToTarget ? -1 : 1) * this.tileSize * 0.2;

          //   // Remove collided target
          //   this.collidedTarget = null;
          // }

          // const finalAngle = angleToTarget + avoidAngle;

          // console.log('avoidAngle :>>>', avoidAngle);
          // console.log('finalAngle :>>>', finalAngle);
          // console.log('cos :>>>', Math.cos(finalAngle));
          // console.log('sin :>>>', Math.sin(finalAngle));

          if (this.sprite && this.sprite.active)
            this.sprite.setVelocity(
              Math.cos(angleToTarget) * this.tileSize,
              Math.sin(angleToTarget) * this.tileSize
            );
        }
      }, 200);
    }
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

  #beforeChangeDirection() {
    this.sprite.body.setVelocity(0);
    this.sprite.anims.play('enemy_idle');
    this.#changeDirection();
  }

  #onCollide(self: any, target: any) {
    if (this.data.total_attribute.hp > 0) {
      // console.log('self', self);
      console.log('enemy collide with target', target);

      // If collide with player but player not in sight
      if (target.name && target.name.includes('player')) {
        if (this.phase !== 'chasing') {
          this.#markPlayerInSight(target);
        }
      } else {
        // this.collidedTarget = {
        //   x: target.pixelX + this.scene.offsetX,
        //   y: target.pixelY + this.scene.offsetY,
        // };

        // Get moveing Direction
        const movingVector = new Phaser.Math.Vector2(
          this.sprite.body.velocity.x,
          this.sprite.body.velocity.y
        );

        console.log('movingVector :>>>', movingVector);

        const { down, left, right, up } = this.sprite.body.touching;

        switch (true) {
          case movingVector.x === 0 && movingVector.y < 0:
            if (up) this.#beforeChangeDirection();
            break;
          case movingVector.x > 0 && movingVector.y < 0:
            if (up || right) this.#beforeChangeDirection();
            break;
          case movingVector.x > 0 && movingVector.y === 0:
            if (right) this.#beforeChangeDirection();
            break;
          case movingVector.x > 0 && movingVector.y > 0:
            if (right || down) this.#beforeChangeDirection();
            break;
          case movingVector.x === 0 && movingVector.y > 0:
            if (down) this.#beforeChangeDirection();
            break;
          case movingVector.x < 0 && movingVector.y > 0:
            if (left || down) this.#beforeChangeDirection();
          case movingVector.x < 0 && movingVector.y === 0:
            if (left) this.#beforeChangeDirection();
            break;
          case movingVector.x < 0 && movingVector.y < 0:
            if (left || up) this.#beforeChangeDirection();
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
    if (context.key.includes('attack') && this.data.total_attribute.hp > 0) {
      this.sprite.body.setVelocity(0);
      this.sprite?.anims.play('enemy_idle');
      this.scene.time.delayedCall(500, () => {
        // release key
        this.keys['mouseLeft'] = 0;
      });
    }
  }
}
