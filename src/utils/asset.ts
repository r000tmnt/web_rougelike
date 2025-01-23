export const addTexture = (
  scene: Phaser.Scene,
  key: string,
  texture: string,
  width: number,
  height: number
) => {
  if (scene.textures.exists(key)) return;

  scene.textures.addSpriteSheetFromAtlas(key, {
    atlas: texture,
    frame: key,
    frameWidth: width,
    frameHeight: height,
  });
};

export const setAnimation = (
  scene: Phaser.Scene,
  key: string,
  texture: string,
  start: number,
  end: number,
  frameRate: number,
  repeat: number
) => {
  if (scene.anims.exists(key)) return;

  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNames(texture, {
      start,
      end,
    }),
    frameRate,
    repeat,
  });
};
