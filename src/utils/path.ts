export const getPosition = (
  target: any,
  offsetX: number,
  offsetY: number,
  tileSize: number
) => {
  return {
    x: Math.floor((target.x - offsetX) / tileSize),
    y: Math.floor((target.y - offsetY) / tileSize),
  };
};
