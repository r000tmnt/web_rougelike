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

/**
 *
 * @param deg - A number to tell which direction the object is facing
 * @returns 0: up, 1: up-right, 2: right, 3: right-down, 4: down, 5: left-down, 6: left, 7: left-up, -1: Not found
 */
export const getDirection = (deg: number) => {
  if (deg === -90) return 0; // up
  if (deg > -90 && deg < 0) return 1; // up right
  if (deg === 0) return 2; // right
  if (deg <= 45 && deg > 0) return 3; // right down
  if (deg === 90) return 4; // down
  if (deg <= 135 && deg > 90) return 5; // left down
  if (deg === 180 || deg === -180) return 6; // left
  if (deg > -180 && deg < -90) return 7; // left up
  // if (deg <= -45 && deg >= -135) return 0;
  // if (deg <= 45 && deg >= -45) return 1; // right
  // if (deg <= 135 && deg >= 45) return 2; // down
  // if (deg <= -135 || deg >= 135) return 3; // left
  else return -1; // Not found
};

export const getDistance = (pointA: number, pointB: number) => {
  return Math.abs(pointA - pointB);
};
