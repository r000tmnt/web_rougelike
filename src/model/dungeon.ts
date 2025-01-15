export interface mapBorder {
  row: number;
  cols: number[];
}

export interface doorPosition {
  direction: string;
  row: number;
  col: number;
}

export interface resetParams {
  roomIndex: number;
  direction: string;
  reset: boolean;
}
