import { mapBorder, doorPostion } from 'src/model/dungeon';

export default class DungeonGenerator {
  scene: Phaser.Scene;
  roomSize: number[]; // Possible numbers for size
  level: number[][][];
  tunnelSize: number;
  directions: number[][];
  lastDirection: number[];
  tunnelWidth: number[];
  doorDirection: string[];
  startingPosition: string;
  startingPoint: number[];
  roomIndex: number;
  doors: doorPostion[];

  constructor(scene: Phaser.Scene) {
    // constructor() {
    this.scene = scene;
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
    this.level = [];
    this.doorDirection = [];
    this.startingPosition = '';
    this.startingPoint = [];
    this.roomIndex = -1;
    this.doors = [];
    this.init();
  }

  init() {
    console.log('room size :>>>', this.roomSize);

    this.level = Array(9).fill([]);

    this.setRoom();
  }

  async setRoom(index = -1) {
    this.roomIndex = 0;
    if (index >= 0) {
      this.roomIndex = index;
    } else {
      // Set the room as the starting point
      this.roomIndex = Math.floor(Math.random() * this.level.length);
    }

    console.log(`room ${this.roomIndex}`);
    await this.#setDoorDirections();

    // for (let i = 0; i < this.level.length; i++) {
    // Choose a width and height for the room / block
    const width =
      this.roomSize[Math.floor(Math.random() * this.roomSize.length)];
    const height =
      this.roomSize[Math.floor(Math.random() * this.roomSize.length)];

    this.tunnelSize = width + height;

    console.log('random width :>>>', width);
    console.log('random height :>>>', height);
    console.log('random tunnel :>>>', this.tunnelSize);

    for (let i = 0; i < height; i++) {
      // console.log('row :>>>', i);
      this.level[this.roomIndex][i] = [];
      for (let j = 0, row = this.level[this.roomIndex][i]; j < width; j++) {
        // console.log('col :>>>', j);
        row.push(1);
      }
    }

    // console.log('map before dig tunnels :>>>', this.level[this.roomIndex]);

    this.#digTunnels(this.level[this.roomIndex], width, height);
  }

  async #setDoorDirections() {
    switch (this.roomIndex) {
      case 0:
        this.doorDirection = ['right', 'down'];
        this.startingPosition = 'up-left';
        break;
      case 1:
        this.doorDirection = ['left', 'down', 'right'];
        this.startingPosition = 'up-center';
        break;
      case 2:
        this.doorDirection = ['left', 'down'];
        this.startingPosition = 'up-right';
        break;
      case 3:
        this.doorDirection = ['up', 'right', 'down'];
        this.startingPosition = 'left-center';
        break;
      case 4:
        this.doorDirection = ['up', 'right', 'down', 'left'];
        this.startingPosition = 'center';
        break;
      case 5:
        this.doorDirection = ['up', 'down', 'left'];
        this.startingPosition = 'right-center';
        break;
      case 6:
        this.doorDirection = ['up', 'right'];
        this.startingPosition = 'down-left';
        break;
      case 7:
        this.doorDirection = ['up', 'right', 'left'];
        this.startingPosition = 'down-center';
        break;
      case 8:
        this.doorDirection = ['up', 'left'];
        this.startingPosition = 'down-right';
        break;
    }
  }

  #digTunnels(room: number[][], width: number, height: number) {
    // console.log('room :>>>', this.level[i]);

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
          (row <= 1 && randomDirection[0] === -1) ||
          (col <= 1 && randomDirection[1] === -1) ||
          (row >= height - 2 && randomDirection[0] === 1) ||
          (col >= width - 2 && randomDirection[1] === 1)
        ) {
          console.log('Outside or on the same step');
          // Reroll step
          break;
        } else {
          // console.log(`Digging room ${this.roomIndex}`);
          // Change the value on the map
          if (room[row] !== undefined) {
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
          } else {
            break;
          }
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

    // Get all the tiles around the floor
    const unWalkables: mapBorder[] = [];
    const walkables: mapBorder[] = [];

    for (let i = 0; i < room.length; i++) {
      unWalkables.push({
        row: i,
        cols: [],
      });
      walkables.push({
        row: i,
        cols: [],
      });
      for (let j = 0; j < room[i].length; j++) {
        if (room[i][j] === 1) {
          // Check if the tile is next to the floor
          if (
            (i - 1 >= 0 && room[i - 1][j] === 0) ||
            (j + 1 <= width - 1 && room[i][j + 1] === 0) ||
            (i + 1 <= height - 1 && room[i + 1][j] === 0) ||
            (j - 1 >= 0 && room[i][j - 1] === 0)
          ) {
            unWalkables[unWalkables.length - 1].cols.push(j);
          }
        }

        if (room[i][j] === 0) {
          walkables[walkables.length - 1].cols.push(j);
        }

        // Remove empty array
        if (j === room[i].length - 1) {
          if (!walkables[walkables.length - 1].cols.length) {
            walkables.pop();
          }

          if (!unWalkables[unWalkables.length - 1].cols.length) {
            unWalkables.pop();
          }
        }
      }
    }

    this.#setStartingPosition(walkables);

    console.log('unWalkables :>>>', unWalkables);

    // Place door
    this.doorDirection.forEach((d) => {
      switch (d) {
        case 'up':
          // Find the nearist tiles on the up direction
          for (let i = 0; i < unWalkables.length; i++) {
            const row = unWalkables[i];
            console.log('row :>>>', row.row);
            const col = row.cols[Math.floor(row.cols.length / 2)];
            console.log('set door up');
            room[row.row][col] = 2;
            this.doors.push({
              direction: d,
              row: row.row,
              col: col,
            });
            break;
          }
          break;
        case 'right':
          {
            let doorRow = 0;
            let doorCol = 0;
            let done = false;

            const placeDoor = () => {
              const tempRow = Math.floor(Math.random() * unWalkables.length);

              doorRow = unWalkables[tempRow].row;
              doorCol =
                unWalkables[tempRow].cols[unWalkables[tempRow].cols.length - 1];
              // Check if is in a corner or a corridor
              console.log('set door right');
              room[doorRow][doorCol] = 2;
            };

            do {
              placeDoor();

              if (
                doorRow === 0 ||
                doorRow === height - 1 ||
                room[doorRow - 1][doorCol] !== 1 ||
                room[doorRow + 1][doorCol] !== 1 ||
                room[doorRow][doorCol - 1] !== 0
              ) {
                room[doorRow][doorCol] = 1;
              } else {
                this.doors.push({
                  direction: d,
                  row: doorRow,
                  col: doorCol,
                });
                done = true;
              }
            } while (!done);
          }
          break;
        case 'down':
          // Find the nearist tiles on the down direction
          for (let i = unWalkables.length - 1; i >= 0; i--) {
            const row = unWalkables[i];
            console.log('row :>>>', row.row);
            const col = row.cols[Math.floor(row.cols.length / 2)];
            console.log('set door down');
            room[row.row][col] = 2;
            this.doors.push({
              direction: d,
              row: row.row,
              col: col,
            });
            break;
          }
          break;
        case 'left':
          {
            let doorRow = 0;
            let doorCol = 0;
            let done = false;

            const placeDoor = () => {
              const tempRow = Math.floor(Math.random() * unWalkables.length);
              // Check if is in a corner or a corridor

              doorRow = unWalkables[tempRow].row;
              doorCol = unWalkables[tempRow].cols[0];

              console.log(`set door left on row ${doorRow} & col ${doorCol}`);
              room[doorRow][doorCol] = 2;
            };

            // Check if the door is stick with the wall
            do {
              placeDoor();

              if (doorRow === 0 || doorRow === height - 1) {
                console.log('out of range');
                //Check if the door is facing the floor
                room[doorRow][0] = 1;
              } else if (
                room[doorRow - 1][doorCol] !== 1 ||
                room[doorRow + 1][doorCol] !== 1 ||
                room[doorRow][doorCol + 1] !== 0
              ) {
                console.log('Not a wall');
                //Check if the door is facing the floor
                room[doorRow][0] = 1;
              } else {
                this.doors.push({
                  direction: d,
                  row: doorRow,
                  col: doorCol,
                });
                done = true;
              }
            } while (!done);
          }
          break;
      }
    });
    // }

    // console.log('map :>>>', this.level);
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

  #setStartingPosition(walkables: mapBorder[]) {
    console.log('walkables :>>>', walkables);
    console.log('startingPosition :>>>', this.startingPosition);

    const lastRow = walkables.length - 1;

    switch (this.startingPosition) {
      case 'up':
        // Find the door on the up direction
        console.log('up');
        break;
      case 'right':
        // Find the door on the right direction
        console.log('right');
        break;
      case 'down':
        // Find the door on the down direction
        console.log('down');
        break;
      case 'left':
        // Find the door on the left direction
        console.log('left');
        break;
      case 'up-left':
        this.startingPoint = [walkables[0].row, walkables[0].cols[0]];
        break;
      case 'up-center':
        {
          const center = Math.floor(walkables[0].cols.length / 2);
          this.startingPoint = [walkables[0].row, walkables[0].cols[center]];
        }
        break;
      case 'up-right':
        this.startingPoint = [
          walkables[0].row,
          walkables[0].cols[walkables[0].cols.length - 1],
        ];
        break;
      case 'left-center':
        {
          const center = Math.floor(walkables.length / 2);
          this.startingPoint = [
            walkables[center].row,
            walkables[center].cols[0],
          ];
        }
        // for(let i=0; i < walkables.length; i++){
        //   const tempRow = Math.floor(Math.random() * walkables.length);
        //   const tempCol = Math.floor(Math.random() * walkables.length);
        // }
        break;
      case 'center':
        const rowCenter = Math.floor(walkables.length / 2);
        this.startingPoint = [
          walkables[rowCenter].row,
          walkables[rowCenter].cols[
            Math.floor(walkables[rowCenter].cols.length / 2)
          ],
        ];
        break;
      case 'right-center':
        {
          const center = Math.floor(walkables.length / 2);
          this.startingPoint = [
            walkables[center].row,
            walkables[center].cols[walkables[center].cols.length - 1],
          ];
        }
        break;
      case 'down-left':
        this.startingPoint = [
          walkables[lastRow].row,
          walkables[lastRow].cols[0],
        ];
        break;
      case 'down-center':
        {
          const center = Math.floor(walkables[lastRow].cols.length / 2);
          this.startingPoint = [
            walkables[lastRow].row,
            walkables[lastRow].cols[center],
          ];
        }
        break;
      case 'down-right':
        this.startingPoint = [
          walkables[lastRow].row,
          walkables[lastRow].cols[walkables[lastRow].cols.length - 1],
        ];
        break;
    }

    console.log('startingPoint set :>>>', this.startingPoint);
  }
}
