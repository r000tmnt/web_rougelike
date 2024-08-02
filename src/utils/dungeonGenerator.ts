export default class Dungeon {
  //   scene: Phaser.Scene;
  roomSize: number[]; // Possible numbers for size
  tileSize: number;
  map: number[][][];
  tunnelSize: number;
  directions: number[][];
  lastDirection: number[];

  //   constructor(scene: Phaser.Scene) {
  constructor() {
    // this.scene = scene;
    this.roomSize = [9, 12, 16, 18, 25, 32];
    this.tunnelSize = 0;
    this.directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]; // top, right, down, left
    this.lastDirection = [];
    this.tileSize = 48;
    this.map = [];
    this.init();
  }

  init() {
    console.log('room size :>>>', this.roomSize);

    this.map = Array(9).map((n) => []);

    // Set the room as the starting point
    const startFrom = Math.floor(Math.random() * this.map.length);

    // for (let i = 0; i < this.map.length; i++) {
    // Choose a width and height for the room / block
    const width =
      this.roomSize[Math.floor(Math.random() * this.roomSize.length)];
    const height =
      this.roomSize[Math.floor(Math.random() * this.roomSize.length)];

    // if (width > height) {
    //   do {
    //     this.tunnelSize = Math.floor(Math.random() * width);
    //   } while (this.tunnelSize === 0);
    // } else {
    //   do {
    //     this.tunnelSize = Math.floor(Math.random() * height);
    //   } while (this.tunnelSize === 0);
    // }

    this.tunnelSize = width + height;

    console.log('random width :>>>', width);
    console.log('random height :>>>', height);
    console.log('random tunnel :>>>', this.tunnelSize);

    const rows = Array(height).fill([]);

    this.map[startFrom] = rows;

    this.map[startFrom] = this.map[startFrom].map((tile) =>
      Array(width).fill(1)
    );

    // console.log('room :>>>', this.map[i]);

    let randomDirection: number[] = [];
    let randomLength = 0;

    // Set the starting position
    let row = Math.floor(Math.random() * height);
    let col = Math.floor(Math.random() * width);

    console.log('random row :>>>', row);
    console.log('random col :>>>', col);

    // Dig tunnels
    while (this.tunnelSize > 0) {
      do {
        randomDirection =
          this.directions[Math.floor(Math.random() * this.directions.length)];
      } while (
        (randomDirection[0] === -this.lastDirection[0] &&
          randomDirection[1] === -this.lastDirection[1]) ||
        (randomDirection[0] === this.lastDirection[0] &&
          randomDirection[1] === this.lastDirection[1])
      );

      console.log('direction :>>>', randomDirection);

      if (this.tunnelSize < 10) {
        randomLength = this.tunnelSize;
      } else {
        do {
          randomLength = Math.floor(Math.random() * this.tunnelSize);
        } while (randomLength === 0);
      }
      console.log('randomLength :>>>', randomLength);

      while (randomLength > 0) {
        // Check if the random direction will be outside of the map
        if (
          (row === 0 && randomDirection[0] === -1) ||
          (col === 0 && randomDirection[1] === -1) ||
          (row === this.map[startFrom].length - 1 &&
            randomDirection[0] === 1) ||
          (col === this.map[startFrom].length - 1 && randomDirection[1] === 1)
        ) {
          console.log('Outside or on the same step');
          // Reroll s
          break;
        } else {
          console.log(`Digging room ${startFrom}`);
          // Change the value on the map
          this.map[startFrom][row][col] = 0;
          // Step to the next direction
          row += randomDirection[0];
          col += randomDirection[1];

          console.log(`Next position row: ${row} col: ${col}`);

          randomLength--;
        }
      }

      if (this.tunnelSize > 0) {
        // Keep the last direction
        console.log('Before the next loop start');
        this.lastDirection = randomDirection;
        this.tunnelSize--;
      }
    }
    // }

    // console.log('map :>>>', this.map);
    let rowString = '';
    for (let i = 0; i < this.map[startFrom].length; i++) {
      for (let j = 0, col = this.map[startFrom][i]; j < col.length; j++) {
        rowString =
          j === col.length - 1 ? rowString + `${col[j]}\n` : rowString + col[j];
      }
    }

    console.log(rowString);
  }
}
