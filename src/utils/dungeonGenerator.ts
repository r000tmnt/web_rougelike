import { mapBorder, doorPosition } from 'src/model/dungeon';
import { position } from 'src/model/character';
import { useGameStore } from 'src/stores/game';

export default class DungeonGenerator {
  roomSize: number[]; // Possible numbers for size
  level: number[][][];
  tunnelSize: number;
  directions: number[][];
  lastDirection: number[];
  tunnelWidth: number[];
  doorDirection: string[];
  startingPoint: number[];
  clearedRoom: number[];
  enemies: number[];
  enemyPositions: Array<position>[];
  roomIndex: number;
  doors: doorPosition[];
  ready: boolean;
  enterDirection: string;
  tileSize: number;

  constructor(tileSize: number) {
    this.tileSize = tileSize;
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
    this.level = [[], [], [], [], [], [], [], [], []];
    this.enemies = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.enemyPositions = [];
    this.doorDirection = [];
    this.startingPoint = [];
    this.roomIndex = -1;
    this.doors = [];
    this.clearedRoom = [];
    this.ready = false;
    this.enterDirection = '';
    this.init();
  }

  init() {
    this.setRoom();
  }

  async setRoom(index = -1, direction = '') {
    this.doors.splice(0);
    if (index >= 0) {
      this.roomIndex = index;
      this.enterDirection = direction;
      this.ready = false;
    } else {
      // Set the room as the starting point
      this.roomIndex = Math.floor(Math.random() * this.level.length);
    }

    console.log(`room ${this.roomIndex}`);
    await this.#setDoorDirections();

    // If the room have been visited before
    if (this.clearedRoom.find((r) => r === this.roomIndex) !== undefined) {
      // TODO: Check if the room is going to regenerate?
      // TODO: Remove the index from this.clearedRoom?

      const room = this.level[this.roomIndex];

      const allDoors: number[][] = [];
      // Get all doors
      for (let i = 0; i < room.length; i++) {
        if (allDoors.length === this.doorDirection.length) break;
        for (let j = 0; j < room[i].length; j++) {
          if (room[i][j] === 2) {
            allDoors.push([i, j]);
          }
        }
      }

      console.log('All doors in the visited room :>>>', allDoors);

      this.doorDirection.forEach((d) => {
        let door: number[] = [];
        switch (d) {
          case 'up':
            door = allDoors.reduce((a, b) => (a[0] < b[0] ? a : b));
            break;
          case 'right':
            door = allDoors.reduce((a, b) => (a[1] > b[1] ? a : b));
            break;
          case 'down':
            door = allDoors.reduce((a, b) => (a[0] > b[0] ? a : b));
            break;
          case 'left':
            door = allDoors.reduce((a, b) => (a[1] < b[1] ? a : b));
            break;
        }

        this.doors.push({
          direction: d,
          row: door[0],
          col: door[1],
        });
      });

      // Set player starting position on the map
      this.#setStartingPosition([]);

      console.log('Starting postion in visited room :>>>', this.startingPoint);

      this.ready = true;
    } else {
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
        this.level[this.roomIndex].push([]);
        for (let j = 0, row = this.level[this.roomIndex][i]; j < width; j++) {
          // console.log('col :>>>', j);
          row.push(1);
        }
      }

      console.log('level :>>>', this.level);

      // Check if the width and height of the room
      const over = this.level[this.roomIndex].length - height;

      if (over > 0) {
        console.log(`map over grow ${over} rows.`);
        // Remove unwanted rows
        this.level[this.roomIndex].splice(height - 1, over);
      }

      // Set numbers of enemy
      this.enemies[this.roomIndex] = Math.floor((width * height) / 100);
      // this.enemies[this.roomIndex] = 1;

      console.log(
        `enemies in room ${this.roomIndex} :>>>`,
        this.enemies[this.roomIndex]
      );

      // if(this.level[this.roomIndex][0].length !== height){}

      this.#digTunnels(this.level[this.roomIndex], width, height);
    }
  }

  markRoomVisited(index: number) {
    if (this.clearedRoom.find((cr) => cr === index) === undefined) {
      console.log(`mark room ${index} cleared`);
      this.clearedRoom.push(index);
    }
  }

  async #setDoorDirections() {
    switch (this.roomIndex) {
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
        this.doorDirection = ['up', 'left'];
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

      // console.log('direction :>>>', randomDirection);

      randomLength = Math.floor(Math.random() * this.tunnelSize);
      radomWidth =
        this.tunnelWidth[Math.floor(Math.random() * this.tunnelWidth.length)];
      // console.log('randomLength :>>>', randomLength);
      // console.log('radomWidth :>>>', radomWidth);

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

            // console.log(`Next position row: ${row} col: ${col}`);

            randomLength--;
          } else {
            break;
          }
        }
      }

      if (this.tunnelSize > 0) {
        // Keep the last direction
        // console.log('Before the next loop start');
        this.lastDirection = randomDirection;
        this.tunnelSize--;
      }
    }

    // Re-fill the wall
    room[0] = Array(width).fill(1);
    room[height - 1] = Array(width).fill(1);

    for (let i = 0; i < room.length; i++) {
      room[i][0] = 1;
      room[i][width - 1] = 1;
    }

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

    console.log('unWalkables :>>>', unWalkables);

    // Place door
    this.doorDirection.forEach((d) => {
      switch (d) {
        case 'up':
          // Find the nearist tiles on the up direction
          for (let i = 0; i < unWalkables.length; i++) {
            const row = unWalkables[i];
            // console.log('row :>>>', row.row);
            const col = row.cols[Math.floor(row.cols.length / 2)];
            console.log(`set door up on row ${row.row} & col ${col}`);
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
              console.log(`set door right on row ${doorRow} & col ${doorCol}`);
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
            // console.log('row :>>>', row.row);
            const col = row.cols[Math.floor(row.cols.length / 2)];
            console.log(`set door down on row ${row.row} & col ${col}`);
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
                room[doorRow][doorCol] = 1;
              } else if (
                room[doorRow - 1][doorCol] !== 1 ||
                room[doorRow + 1][doorCol] !== 1 ||
                room[doorRow][doorCol + 1] !== 0
              ) {
                console.log('Not a wall');
                //Check if the door is facing the floor
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
      }
    });

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

    // Set player starting position on the map
    this.#setStartingPosition(walkables);
  }

  #setStartingPosition(walkables: mapBorder[]) {
    console.log('walkables :>>>', walkables);

    if (this.enterDirection.length) {
      let door: doorPosition | undefined = { direction: '', row: 0, col: 0 };

      // Find the door on the opposite direction
      switch (this.enterDirection) {
        case 'up':
          door = this.doors.find((door) => door.direction === 'down');

          if (door) {
            this.startingPoint = [door.row - 1, door.col];
          } else {
            throw new Error('Door on direction down not found');
          }
          break;
        case 'right':
          door = this.doors.find((door) => door.direction === 'left');
          if (door) {
            this.startingPoint = [door.row, door.col + 1];
          } else {
            throw new Error('Door on direction left not found');
          }
          break;
        case 'down':
          door = this.doors.find((door) => door.direction === 'up');
          if (door) {
            this.startingPoint = [door.row + 1, door.col];
          } else {
            throw new Error('Door on direction up not found');
          }
          break;
        case 'left':
          door = this.doors.find((door) => door.direction === 'right');
          if (door) {
            this.startingPoint = [door.row, door.col - 1];
          } else {
            throw new Error('Door on direction right not found');
          }
          break;
      }
      this.#setEnemyPosition(walkables);

      // this.ready = true;
    } else {
      const lastRow = walkables.length - 1;

      switch (this.roomIndex) {
        case 0: // 'up-left'
          this.startingPoint = [walkables[0].row, walkables[0].cols[0]];
          break;
        case 1: // 'up-center'
          {
            const center = Math.floor(walkables[0].cols.length / 2);
            this.startingPoint = [walkables[0].row, walkables[0].cols[center]];
          }
          break;
        case 2: // 'up-right'
          this.startingPoint = [
            walkables[0].row,
            walkables[0].cols[walkables[0].cols.length - 1],
          ];
          break;
        case 3: // 'left-center'
          {
            const center = Math.floor(walkables.length / 2);
            this.startingPoint = [
              walkables[center].row,
              walkables[center].cols[0],
            ];
          }
          break;
        case 4: // 'center'
          const rowCenter = Math.floor(walkables.length / 2);
          this.startingPoint = [
            walkables[rowCenter].row,
            walkables[rowCenter].cols[
              Math.floor(walkables[rowCenter].cols.length / 2)
            ],
          ];
          break;
        case 5: // 'right-center'
          {
            const center = Math.floor(walkables.length / 2);
            this.startingPoint = [
              walkables[center].row,
              walkables[center].cols[walkables[center].cols.length - 1],
            ];
          }
          break;
        case 6: // 'down-left'
          this.startingPoint = [
            walkables[lastRow].row,
            walkables[lastRow].cols[0],
          ];
          break;
        case 7: // 'down-center'
          {
            const center = Math.floor(walkables[lastRow].cols.length / 2);
            this.startingPoint = [
              walkables[lastRow].row,
              walkables[lastRow].cols[center],
            ];
          }
          break;
        case 8: // 'down-right'
          this.startingPoint = [
            walkables[lastRow].row,
            walkables[lastRow].cols[walkables[lastRow].cols.length - 1],
          ];
          break;
      }

      this.#setEnemyPosition(walkables);
    }
  }

  #setEnemyPosition(walkables: mapBorder[]) {
    console.log('Find tiles to place enemy');

    this.enemyPositions[this.roomIndex] = [];

    // Check if enter the visited room
    if (walkables.length) {
      const distance = 4;

      // Remove a certain number of tiles around the player
      for (let i = 0; i < walkables.length; i++) {
        if (Math.abs(walkables[i].row - this.startingPoint[0]) < distance) {
          for (let j = 0; j < walkables[i].cols.length; j++) {
            if (
              Math.abs(walkables[i].cols[j] - this.startingPoint[1]) <= distance
            ) {
              walkables[i].cols.splice(j, 1);
            }
          }
        }
      }

      console.log('walkable tile altered :>>>', walkables);

      // Set enemy position
      for (let i = 0; i < this.enemies[this.roomIndex]; i++) {
        let eRow = 0;
        let eCol = 0;

        const setPosition = () => {
          const tempRow = Math.floor(Math.random() * walkables.length);
          console.log('tempRow :>>>', walkables[tempRow]);
          eRow = walkables[tempRow].row;
          eCol =
            walkables[tempRow].cols[
              Math.floor(Math.random() * walkables[tempRow].cols.length)
            ];

          console.log(`Possible position row ${eRow} col ${eCol}`);

          const exist = this.enemyPositions[this.roomIndex].findIndex(
            (ep) => ep.x === eCol && ep.y === eRow
          );
          if (exist === -1) {
            console.log('mark enemy position');
            this.enemyPositions[this.roomIndex].push({
              y: eRow,
              x: eCol,
            });
          }
        };

        //Check distant
        do {
          setPosition();
        } while (this.enemyPositions[this.roomIndex].length !== i + 1);
      }

      console.log(
        'enemies position in the room :>>>',
        this.enemyPositions[this.roomIndex]
      );
    } else {
      // Get the stored enemyData
      const gameStore = useGameStore();

      const storedEnemy = gameStore.getEnemyIntheRoom(this.roomIndex);

      storedEnemy.forEach((e) => {
        console.log(
          `mark enemy position in the visited room ${this.roomIndex}`
        );
        this.enemyPositions[this.roomIndex].push({
          y: Math.floor(e.position.y / this.tileSize),
          x: Math.floor(e.position.x / this.tileSize),
        });
      });
    }

    this.ready = true;
  }
}
