import { enemy } from 'src/model/character';
import { Animations } from 'phaser';
import { getDirection, getPosition } from 'src/utils/path';
import { gainExp } from 'src/utils/battle';
import unit from './unit';
import { addTexture, setAnimation } from 'src/utils/asset';
import { useGameStore } from 'src/stores/game';
import Dungeon from 'src/scene/dungeon';

export default class Skeleton extends unit {
  index: number;
  facingAngle: number;
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
    this.facingAngle = 0;
    this.idleTimer = null;
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
    setAnimation(
      this.scene,
      'enemy_take_damage',
      `${texture}_lose`,
      0,
      5,
      5,
      0
    );

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
    this.scene.time.delayedCall(1000, () => {
      this.#getRandomDirection();
    });
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

    this.addOverlap(player);
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

    gameStore.emitter.on('enemy-lose', (index: number) => {
      // Proceed to level up if the enemy is active
      if (this.index === index) {
        this.anims.play('enemy_lose');
        this.ray?.destroy();
        this.zone?.destroy();
        if (this.path) this.path = null;
        this.target = null;
        this.disableBody();
        // this.scene.removeEnemyIntheRoom(this.index);
        // this.scene.events.off('update', this.#update);

        // Drop items
        if (this.data.values.bag.length) {
          this.prepareDropItems();
        }

        gainExp(this.data.values as enemy);
      }
    });

    gameStore.emitter.emit('enemy-resume', (index: number) => {
      if (this.index === index && !this.inSight) this.#getRandomDirection();
    });
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
      // Define a range of pixels to move
      const { x, y } = getPosition(
        this,
        this.scene.offsetX,
        this.scene.offsetY,
        this.tileSize
      );

      const defaultBorder = this.tileSize * this.data.values.total_attribute.vd;

      let tempMap = JSON.parse(JSON.stringify(this.scene.walkable)).filter(
        (t: { x: number; y: number }) => {
          if (
            t.x >= this.x - defaultBorder &&
            t.x <= this.x + defaultBorder &&
            t.y >= this.y - defaultBorder &&
            t.y <= this.y + defaultBorder
          ) {
            return t;
          }
        }
      );

      console.log(tempMap);

      tempMap = tempMap.filter(
        (t: { x: number; y: number; check: boolean }) => !t.check
      );

      if (!tempMap.length) {
        this.target =
          this.scene.walkable[
            Phaser.Math.Between(0, this.scene.walkable.length - 1)
          ];
      } else {
        this.target = tempMap[Phaser.Math.Between(0, tempMap.length - 1)];
      }

      this.#alterRayAngle();
      this.#GetPath();
    }
  }

  #alterRayAngle() {
    if (this.ray && this.ray.origin && this.body && this.scene.player) {
      const half = this.tileSize / 2;

      // Get the angle between the enemy and the player or the angle of moving direction
      const radain =
        this.data.values.phase === 'aggro' ||
        this.data.values.phase === 'chasing'
          ? Phaser.Math.Angle.BetweenPoints(this, this.scene.player)
          : Math.atan2(this.body.velocity.y, this.body.velocity.x);

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
    this.#stopMoving();
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

        // console.log('path :>>>', this.path);

        // this.navMesh.debugDrawPath(this.path, 0xffd900);

        this.target = this.path.shift();
        this.#moveToTarget(this.target);
      } else {
        this.#markTileAsChecked(this.target);
      }
    }
    // If the target/player is too close to get a path with navmesh
    else if (!validTarget && this.inSight) {
      this.#moveToTarget(this.target);
    } else {
      this.#markTileAsChecked(this.target);
    }
  }

  #moveToTarget(target: Phaser.Geom.Point) {
    if (this.ray && target) {
      this.#alterRayAngle();
      this.anims.play('enemy_walking');
      const half = this.tileSize / 2;
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
            }
          }
        } else if (distance <= 0 && !this.keys['mouseLeft']) {
          // If there are path to go
          if (this.path.length) {
            this.target = this.path.shift();
            this.body?.setVelocity(0);
            this.scene.time.delayedCall(300, () => {
              this.#moveToTarget(this.target);
            });
          } else {
            // Mark the point as checked
            this.#markTileAsChecked(this.target);
          }
        } else {
          const angleToTarget = Phaser.Math.Angle.Between(
            this.x + half,
            this.y + half,
            target.x,
            target.y
          );

          if (this.active)
            this.body?.setVelocity(
              Math.cos(angleToTarget) * this.tileSize,
              Math.sin(angleToTarget) * this.tileSize
            );
        }
      }
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

  shouldAvoid(target: any) {
    const dir1 = new Phaser.Math.Vector2(
      this.body?.velocity.x,
      this.body?.velocity.y
    ).normalize();
    const dir2 = new Phaser.Math.Vector2(target.x, target.y).normalize();

    // Calculate dot product to see if they are moving toward each other
    const dot = dir1.dot(dir2);

    return dot < 0; // If moving toward each other, try to avoid
  }

  steerAway(target: any) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);

    // Offset angle slightly to steer away
    const newAngle1 = angle + Phaser.Math.DegToRad(45);

    this.body?.setVelocity(
      Math.cos(newAngle1) * this.tileSize,
      Math.sin(newAngle1) * this.tileSize
    );

    this.scene.time.delayedCall(500, () => {
      if (this.target) {
        this.#moveToTarget(this.target);
      } else {
        this.#stopMoving();
      }
    });
  }

  onCollide(self: any, target: any) {
    if (this.data.values.total_attribute.hp > 0) {
      // If collide with player but player not in sight
      if (target.name && target.name.includes('player')) {
        if (this.data.values.phase !== 'chasing') {
          this.data.values.phase = 'chasing';
          this.#markPlayerInSight(target);
        }
      } else {
        if (this.shouldAvoid(target)) {
          this.steerAway(target);
        } else {
          this.#stopMoving();
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
