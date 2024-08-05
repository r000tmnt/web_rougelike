export default class Dungeon {
  //   scene: Phaser.Scene;
  roomSize: number[]; // Possible numbers for size
  tileSize: number;
  map: number[][][];
  tunnelSize: number;
  directions: number[][];
  lastDirection: number[];
  tunnelWidth: number[];
  doorDirection: string[];

  //   constructor(scene: Phaser.Scene) {
  constructor() {
    // this.scene = scene;
    this.roomSize = [9, 12, 16, 18, 25, 32];
    this.tunnelSize = 0;
    this.tunnelWidth = [2, 3];
    this.directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]; // top, right, down, left
    this.lastDirection = [];
    this.tileSize = 48;
    this.map = [];
    this.doorDirection = [];
    this.init();
  }

  init() {
    console.log('room size :>>>', this.roomSize);

    this.map = Array(9).fill([]);

    // Set the room as the starting point
    const startFrom = Math.floor(Math.random() * this.map.length);
    console.log(`room ${startFrom}`);
    this.#setDoorDirections(startFrom);

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

    for (let i = 0; i < height; i++) {
      console.log('row :>>>', i);
      this.map[startFrom][i] = [];
      for (let j = 0, row = this.map[startFrom][i]; j < width; j++) {
        // console.log('col :>>>', j);
        row.push(1);
      }
    }

    console.log('map before dig tunnels :>>>', this.map[startFrom]);

    this.#digTunnels(this.map[startFrom], width, height);
  }

  #setDoorDirections(startFrom: number) {
    switch (startFrom) {
      case 0:
        this.doorDirection = ['right', 'down'];
        break;
      case 1:
        this.doorDirection = ['left', 'down', 'right'];
        break;
      case 2:
        this.doorDirection = ['left', 'down'];
        break;
      case 3:
        this.doorDirection = ['up', 'right', 'down'];
        break;
      case 4:
        this.doorDirection = ['up', 'right', 'down', 'left'];
        break;
      case 5:
        this.doorDirection = ['up', 'down', 'left'];
        break;
      case 6:
        this.doorDirection = ['up', 'right'];
        break;
      case 7:
        this.doorDirection = ['up', 'right', 'left'];
        break;
      case 8:
        this.doorDirection = ['up', 'down', 'left'];
        break;
    }
  }

  #digTunnels(room: number[][], width: number, height: number) {
    // console.log('room :>>>', this.map[i]);

    let randomDirection: number[] = [];
    let randomLength = 0;
    let radomWidth = 0;

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

      randomLength = Math.floor(Math.random() * this.tunnelSize);
      radomWidth =
        this.tunnelWidth[Math.floor(Math.random() * this.tunnelWidth.length)];
      console.log('randomLength :>>>', randomLength);
      console.log('radomWidth :>>>', radomWidth);

      while (randomLength > 0) {
        // Check if the random direction will be outside of the map
        if (
          (row === 1 && randomDirection[0] === -1) ||
          (col === 1 && randomDirection[1] === -1) ||
          (row === height - 2 && randomDirection[0] === 1) ||
          (col === width - 2 && randomDirection[1] === 1)
        ) {
          console.log('Outside or on the same step');
          // Reroll step
          break;
        } else {
          // console.log(`Digging room ${startFrom}`);
          // Change the value on the map
          room[row][col] = 0;
          // Wider the tunnel
          for (let i = 0; i < radomWidth; i++) {
            if (randomDirection[1] === 0) {
              // Horizontal
              if (col - i > 0) {
                room[row][col - i] = 0;
              } else if (col + i < width - 1) {
                room[row][col + i] = 0;
              }
            } else if (randomDirection[0] === 0) {
              // Vetical
              if (row - i > 0) {
                room[row - i][col] = 0;
              } else if (row + i < width - 1) {
                room[row + i][col] = 0;
              }
            }
          }

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

    // Re-fill the wall
    // room[0] = Array(width).fill(1)
    // room[height - 1] = Array(width).fill(1)

    // for(let i=0; i < room.length; i++){
    //   room[i][0] = 1
    //   room[i][width - 1] = 1
    // }

    // Get all the tiles with value 1
    const unWalkables: number[][][] = [];

    for (let i = 0; i < room.length; i++) {
      unWalkables[i] = [];
      for (let j = 0; j < room[i].length; j++) {
        if (room[i][j] === 1) {
          // Check if the tile is next to the floor
          if (room[i - 1] !== undefined && room[i - 1][j] === 0) {
            unWalkables[i].push([i, j]);
          } else if (room[i][j + 1] !== undefined && room[i][j + 1] === 0) {
            unWalkables[i].push([i, j]);
          } else if (room[i + 1] !== undefined && room[i + 1][j] === 0) {
            unWalkables[i].push([i, j]);
          } else if (room[i][j - 1] !== undefined && room[i][j - 1] === 0) {
            unWalkables[i].push([i, j]);
          }
        }
      }
    }

    console.log('unWalkables :>>>', unWalkables);

    // Place door
    this.doorDirection.forEach((d) => {
      switch (d) {
        case 'up':
          // let upRow = -1;
          // let upCol = -1;
          // Find the nearist tiles on the up direction
          for (let i = 0; i < unWalkables.length; i++) {
            const row = unWalkables[i];
            console.log('row :>>>', row);
            if (row.length) {
              // const row = rows[i][0];
              const col = row[Math.floor(row.length / 2)];
              room[col[0]][col[1]] = 2;
              break;
            }
            // upCol = rows[i].findIndex((col) => col === 0);

            // if (upCol >= 0 && i > 0) {
            //   upRow = i;
            //   break;
            // }
          }

          //Check all the direction around the tile
          // if (this.map[upRow - 1][upCol][0] === 1) {
          // }

          break;
        case 'right':
          break;
        case 'down':
          break;
        case 'left':
          break;
      }
    });
    // }

    // console.log('map :>>>', this.map);
    let rowString = '';
    for (let i = 0; i < room.length; i++) {
      // console.log('row :>>>', room[i]);
      for (let j = 0, col = room[i]; j < col.length; j++) {
        // console.log('col :>>>', j);
        rowString =
          j === col.length - 1 ? rowString + `${col[j]}\n` : rowString + col[j];
      }
    }

    console.log(rowString);
  }
}
