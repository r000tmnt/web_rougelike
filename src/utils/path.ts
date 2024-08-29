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

export const getDirection = (deg: number) => {
  if (deg <= -45 && deg >= -135) return 0; // up
  if (deg <= 45 && deg >= -45) return 1; // right
  if (deg <= 135 && deg >= 45) return 2; // down
  if (deg <= -135 || deg >= 135) return 3; // left
  else return -1; // Not found
};
