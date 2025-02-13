import { enemy } from 'src/model/character';
import { Animations } from 'phaser';
import { getDirection, getPosition } from 'src/utils/path';
import { gainExp } from 'src/utils/battle';
import unit from './unit';
import { addTexture, setAnimation } from 'src/utils/asset';
import { useGameStore } from 'src/stores/game';
import Dungeon from 'src/scene/dungeon';
import { item } from 'src/model/item';

export default class Skeleton extends unit {
  index: number;
  facingAngle: number;
  awaitTimer: NodeJS.Timeout | null;
  angle: number[];
  inSight: boolean;
  step: number;
  target: any;
  collidedTarget: any;
  idleTimer: NodeJS.Timeout | null;
  ray: Raycaster.Ray | null;
  navMesh: any;
  path: any;
  walkingTweens: Phaser.Tweens.Tween | null;
  intersections: Phaser.Geom.Point[];

  private zone!: Phaser.GameObjects.Zone;

  constructor(
    scene: Dungeon,
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
    super(scene, x, y, `enemy_${index}`, data, tileSize, map, false, false);

    this.index = index;
    this.inSight = false;
    this.target = null;
    this.collidedTarget = null;
    this.ray = null;
    this.angle = [0, 45, 90, 135, 180, -180, -135, -90, -45, -0];
    this.facingAngle = 0;
    this.idleTimer = null;
    this.awaitTimer = null;
    // this.data.values.phase = 'roaming'; // roaming, searching, aggro
    this.step = 0;
    this.navMesh = navMesh;
    this.walkingTweens = null;
    this.intersections = [];
    this.init(x, y, texture, player, groundLayer);
  }

  init(
    x: number,
    y: number,
    texture: string,
    player: Phaser.Types.Physics.ArcadeWithDynamicBody,
    groundLayer: Phaser.Tilemaps.TilemapLayer
  ) {
    //Prepare textures
    addTexture(
      this.scene,
      `${texture}_idle`,
      texture,
      this.tileSize,
      this.tileSize
    );
    addTexture(
      this.scene,
      `${texture}_attack`,
      texture,
      this.tileSize,
      this.tileSize
    );
    addTexture(
      this.scene,
      `${texture}_lose`,
      texture,
      this.tileSize,
      this.tileSize
    );

    // Set animation
    setAnimation(this.scene, 'enemy_idle', `${texture}_idle`, 0, 0, 0, 0);
    setAnimation(this.scene, 'enemy_walking', `${texture}_idle`, 0, 2, 5, -1);
    setAnimation(this.scene, 'enemy_attack', `${texture}_attack`, 0, 4, 10, 0);
    setAnimation(this.scene, 'enemy_lose', `${texture}_lose`, 0, 5, 8, 0);

    this.addCollision(groundLayer, this.onCollide);
    this.addCollision(player, this.onCollide);
    this.ready = true;

    this.scene.events.on('update', this.#update, this);

    this.on('destroy', () => {
      this.scene.events.off('update', this.#update);
    });

    this.calculateData();
    this.#setZone(player);
    // Set event listener
    this.#setEvents();

    // Create ray
    if (this.scene.raycaster) this.#setRay(this.scene.raycaster, x, y, player);

    console.log('enemy? ', this);
    this.anims.play('enemy_idle');
    setTimeout(() => {
      this.#getRandomDirection();
    }, 1000);
  }

  #setZone(player: Phaser.Types.Physics.ArcadeWithDynamicBody) {
    const half = this.tileSize / 2;
    this.zone = this.scene.add.zone(
      this.flipX ? this.x + this.tileSize : this.x - half,
      this.y,
      half,
      this.tileSize
    );
    this.zone.setOrigin(0, 0);
    this.scene.physics.world.enable(this.zone);

    this.scene.physics.add.overlap(this.zone, player, () => {
      // console.log('overlap with player');
      this.overlap = true;
    });
  }

  #markPlayerInSight(target: Phaser.Types.Physics.ArcadeWithDynamicBody) {
    const gameStore = useGameStore();
    const half = gameStore.tileSize / 2;
    this.target = {
      x: target.x + half - this.scene.offsetX,
      y: target.y + half - this.scene.offsetY,
    };
    // Clear current path if exist
    if (this.path && this.path.length) this.path = null;

    if (this.status !== 'dead')
      // Get a new path
      this.#GetPath();
  }

  #setEvents() {
    // Animation listener
    this.on(Animations.Events.ANIMATION_START, this.#animationStart, this);

    this.on(Animations.Events.ANIMATION_UPDATE, this.#animationUpdate, this);

    // Animation listener
    this.on(
      Animations.Events.ANIMATION_COMPLETE,
      this.#animationComplete,
      this
    );

    const gameStore = useGameStore();

    gameStore.emitter.on(
      'chase-countdown-start',
      (player: Phaser.Types.Physics.ArcadeWithDynamicBody) => {
        this.#markPlayerInSight(player);
      }
    );

    gameStore.emitter.on(
      'enemy-take-damage',
      (data: { index: number; result: number }) => {
        if (this.keys['mouseLeft'] === 1) {
          // Release key
          this.keys['mouseLeft'] = 0;
        }

        const { index, result } = data;

        if (index === this.index) {
          this.data.values.total_attribute.hp -=
            result > this.data.values.total_attribute.hp
              ? this.data.values.total_attribute.hp
              : result;

          // Proceed to level up if the enemy is active
          if (this.data.values.total_attribute.hp === 0 && this.active) {
            this.anims.play('enemy_lose');
            this.status = 'dead';
            this.ray?.destroy();
            this.zone?.destroy();
            if (this.path) this.path = null;
            this.target = null;
            if (this.awaitTimer) {
              clearInterval(this.awaitTimer);
              this.awaitTimer = null;
            }
            // this.scene.removeEnemyIntheRoom(this.index);
            this.disableBody();
            // this.scene.events.off('update', this.#update);

            // Drop items
            if (this.data.values.drop.length) {
              const rates: number[] = this.data.values.drop.map((d: item) => {
                switch (d.rarity) {
                  case 0:
                    return 0.5;
                  case 1:
                    return 0.3;
                  case 2:
                    return 0.1;
                  default:
                    return 0.5;
                }
              });

              const dropItems: item[] = [];

              const random = Math.random();

              rates.forEach((rate: number, index: number) => {
                if (random < rate) {
                  dropItems.push(
                    JSON.parse(JSON.stringify(this.data.values.drop[index]))
                  );
                }
              });

              if (dropItems.length) {
                // Draw items
                dropItems.forEach((item: item) => {
                  const dropX = this.x + Phaser.Math.Between(-10, 58);
                  const dropY = this.y + Phaser.Math.Between(-10, 58);
                  const newItem = this.scene.add
                    .sprite(dropX, dropY, 'demo_item', item.index)
                    .setInteractive();

                  if (newItem.input) {
                    newItem.input.alwaysEnabled = true;
                  }

                  let newItemGlow: Phaser.Tweens.Tween;

                  newItem.on('pointerover', () => {
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
                    newItemGlow.stop();
                    // Remove glow effect
                    newItem.preFX?.remove(newItem.data.values.fx);
                  });

                  // Simulate drop effect
                  this.scene.tweens.add({
                    targets: newItem,
                    x: dropX + 10,
                    y: dropY + 10,
                    duration: 500,
                    ease: 'Bounce.out',
                  });
                });
              }
            }

            gainExp(this.data.values as enemy);
          }
        }
      }
    );
  }

  #setRay(raycaster: Raycaster, x: number, y: number, player: any) {
    this.ray = raycaster.createRay();
    //set ray position to the center of the object
    this.ray.setOrigin(x + this.tileSize / 2, y + this.tileSize / 2);
    //enable auto slicing field of view
    this.ray.autoSlice = true;
    //enable arcade physics body
    this.ray.enablePhysics();
    //set collision (field of view) range
    this.ray.setCollisionRange(
      this.tileSize * this.data.values.base_attribute.vd
    );
    this.ray.setDetectionRange(
      this.tileSize * this.data.values.base_attribute.vd
    );
    //cast ray
    this.ray.setConeDeg(this.tileSize);
    this.ray.castCone();

    //add overlap collider (require passing ray.processOverlap as process callback)
    this.scene.physics.add.overlap(
      this.ray as unknown as Phaser.GameObjects.GameObject,
      player,
      (rayFoVCircle: any, target: any) => {
        /*
         * What to do with game objects in line of sight.
         */
        // console.log('rayFoVCircle :>>>', rayFoVCircle);
        if (player.data.values.total_attribute.hp > 0) {
          this.#markPlayerInSight(target);
          this.inSight = true;
          this.data.values.phase = 'chasing';
        }
      },
      this.ray.processOverlap.bind(this.ray)
    );
  }

  #update() {
    if (this && this.ray?.body) {
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
          console.log(`${this.name} lost the player`);
          this.inSight = false;
          this.data.values.phase = 'searching';
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
    }
  }

  #alterRayAngle() {
    if (this.ray && this.ray.origin && this.target && this.scene.player) {
      const half = this.tileSize / 2;
      const radain = Phaser.Math.Angle.BetweenPoints(
        this,
        this.data.values.phase === 'aggro' ||
          this.data.values.phase === 'chasing'
          ? this.scene.player
          : this.target
      );
      this.facingAngle = Phaser.Math.RadToDeg(radain);

      this.ray.setAngleDeg(this.facingAngle);

      this.ray.setOrigin(this.x + half, this.y + half);

      const facingDirection = getDirection(this.facingAngle);

      this.zone.setAngle(this.facingAngle);

      switch (facingDirection) {
        case 0: // up
          this.zone.setPosition(this.x, this.y - half);
          this.zone.setDisplaySize(this.tileSize, half);
          break;
        case 1: // up right
          this.zone.setPosition(this.x + half, this.y - half);
          this.zone.setDisplaySize(this.tileSize, half);
          this.setFlipX(true);
          break;
        case 2: // right
          this.zone.setPosition(this.x + half, this.y);
          this.zone.setDisplaySize(half, this.tileSize);
          this.setFlipX(true);
          break;
        case 3: // right down
          this.zone.setPosition(this.x + half, this.y + this.tileSize);
          this.zone.setDisplaySize(this.tileSize, half);
          this.setFlipX(true);
          break;
        case 4: // down
          this.zone.setPosition(this.x, this.y + this.tileSize);
          this.zone.setDisplaySize(this.tileSize, half);
          break;
        case 5: // left down
          this.zone.setPosition(this.x - half, this.y + this.tileSize);
          this.zone.setDisplaySize(this.tileSize, half);
          this.setFlipX(false);
          break;
        case 6: // left
          this.zone.setPosition(this.x - half, this.y);
          this.zone.setDisplaySize(half, this.tileSize);
          this.setFlipX(false);
          break;
        case 7: // left up
          this.zone.setPosition(this.x - half, this.y - half);
          this.zone.setDisplaySize(this.tileSize, half);
          this.setFlipX(false);
          break;
      }

      // this.ray?.castCircle();
      // this.ray?.cast();
      this.intersections = this.ray.castCone();

      // console.log('intersections :>>>', this.intersections);
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
      const half = this.tileSize / 2;
      this.path = this.navMesh.findPath(
        {
          x: this.x + half - this.scene.offsetX,
          y: this.y + half - this.scene.offsetY,
        },
        this.target
      );

      // If there is a valid path, grab the first point from the path and set it as the target
      if (this.path && this.path.length) {
        // const debugGraphics = this.scene.add.graphics(0, 0).setAlpha(0.5);
        // this.navMesh.enableDebug(debugGraphics);
        // Add the offset back to path
        this.path.forEach((p: any) => {
          p.x += this.scene.offsetX;
          p.y += this.scene.offsetY;
        });

        console.log('path :>>>', this.path);

        // this.navMesh.debugDrawPath(this.path, 0xffd900);

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
      this.body?.velocity.x,
      this.body?.velocity.y
    );

    // If the sprite is stationary, assume default direction (e.g., facing right)
    if (facingVector.length() === 0) {
      facingVector.set(!this.flipX ? -1 : 1, 0); // Facing left or right
    } else {
      facingVector.normalize();
    }

    const cross = facingVector.cross(spriteToObstacle.normalize());

    // Return avoidance direction based on the sign of the cross product
    return cross > 0 ? 'right' : 'left';
  }

  #moveToTarget(target: Phaser.Geom.Point) {
    if (this.ray && target && this.awaitTimer === null) {
      this.anims.play('enemy_walking');
      const half = this.tileSize / 2;
      this.awaitTimer = setInterval(() => {
        if (this.status !== 'dead') {
          const distance = Phaser.Math.Distance.Between(
            this.x + half,
            this.y + half,
            target.x,
            target.y
          );

          if (this.inSight && this.scene.player) {
            const distanceToPlayer = Phaser.Math.Distance.Between(
              this.x + half,
              this.y + half,
              this.scene.player.x + half,
              this.scene.player.y + half
            );
            // If the player is in the range of attack
            if (distanceToPlayer <= this.tileSize + 5) {
              // Attack
              if (this.scene.player.active) {
                this.data.values.phase = 'aggro';
                this.path = null;
                this.body?.setVelocity(0);
                this.#alterRayAngle();
                if (!this.keys['mouseLeft'] || this.keys['mouseLeft'] === 0) {
                  this?.anims.play('enemy_attack', true);
                  this.keys['mouseLeft'] = 1;
                }
                // this.#setZone(this.scene.player);
              }
            }
          }

          if (distance <= 5 && !this.keys['mouseLeft']) {
            if (this.awaitTimer !== null) {
              clearInterval(this.awaitTimer);
              this.awaitTimer = null;
            }
            // If there are path to go
            if (this.path.length) {
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
              this.x + half,
              this.y + half,
              target.x,
              target.y
            );

            if (this && this.active)
              this.body?.setVelocity(
                Math.cos(angleToTarget) * this.tileSize,
                Math.sin(angleToTarget) * this.tileSize
              );
          }
        }
      }, 200);
    }
  }

  #stopMoving() {
    if (this.body) {
      this.anims?.play('enemy_idle', true);
      this.body?.setVelocity(0);

      if (!this.inSight) {
        // Starting moving again
        setTimeout(() => {
          this.idleTimer = null;
          if (this.status !== 'dead') this.#getRandomDirection();
        }, 2000);
      }
    }
  }

  onCollide(self: any, target: any) {
    if (this.data.values.total_attribute.hp > 0) {
      // this.body.setVelocity(0);
      // console.log('self', self);
      // console.log('enemy collide with target', target);
      if (target.name && target.name.includes('enemy')) {
        this.anims.play('enemy_idle');
        // this.#changeDirection();
      }

      // If collide with player but player not in sight
      if (target.name && target.name.includes('player')) {
        if (this.data.values.phase !== 'chasing') {
          this.data.values.phase = 'chasing';
          this.#markPlayerInSight(target);
        }
      }
    }
  }

  #animationStart(anim: any, frame: any, sprite: any, frameKey: any) {
    //
  }

  #animationUpdate(anim: any, frame: any, sprite: any, frameKey: any) {
    // console.log('frameKey :>>>', frameKey);
    if (anim.key.includes('attack') && frameKey === '4') {
      // Check overlap
      if (
        this.overlap &&
        !this.dmgText.visible &&
        this.scene.player &&
        this.scene.player.data.values.status !== 'dead' &&
        this.scene.player.data.values.status !== 'hit'
      ) {
        this.attack(this.scene.player, false);
      }
    }
  }

  #animationComplete(context: any) {
    // console.log('context :>>>', context);
    // Check if the attack animation finished
    if (
      context.key.includes('attack') &&
      this.data.values.total_attribute.hp > 0
    ) {
      this.body?.setVelocity(0);
      this.anims.play('enemy_idle');
      this.scene.time.delayedCall(500, () => {
        // release key
        this.keys['mouseLeft'] = 0;
      });
    }
  }
}
