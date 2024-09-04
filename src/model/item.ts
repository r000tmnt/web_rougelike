export interface item {
  id: string;
  name: string;
  type: number;
  rarity: number;
  desc: string;
  image: string; // Path of the image
  modifier: string;
  equip?: boolean;
  effect: modifier;
}

export interface modifier {
  [name: string]: {
    type: number;
    value: number;
  };
}
