export interface item {
  id: string;
  name: string;
  type: number;
  rarity: number;
  desc: string;
  image: string; // Path of the image
  modifier: string;
  equip?: boolean;
  effect?: modifier;
  amount: number;
}

export interface modifier {
  [name: string]: {
    type: number;
    value: number;
  };
}
