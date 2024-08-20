export const getPosition = (target: any, tileSize: number) => {
  return {
    x: Math.floor(target.x / tileSize),
    y: Math.floor(target.y / tileSize),
  };
};
