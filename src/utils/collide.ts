export const onCollidePlayer = (
  self: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  target: any
) => {
  if (target.name && target.name.includes('enemy')) {
    self.body.stop();
  }
};

export const onCollideEnemy = (
  self: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  target: any
) => {
  if (self.data.values.total_attribute.hp > 0) {
    console.log('enemy collide with target', target);
    if (target.name && target.name.includes('enemy')) {
      self.anims.play('enemy_idle');
      // self.#changeDirection();
    }

    // If collide with player but player not in sight
    if (target.name && target.name.includes('player')) {
      if (self.data.values.phase !== 'chasing') {
        self.data.values.phase = 'chasing';
        self.data.values.markPlayerInSight(target);
      }
    }
  }
};
