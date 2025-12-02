import { item } from './item';

type AllowedAttributeLimits = 'hp' | 'mp' | 'bag' | 'exp' | 'pd' | 'vd';

export type AllowedEquipType = 'head' | 'body' | 'hand' | 'feet' | 'accessory';

export interface position {
  y: number;
  x: number;
}

export interface base_attribute {
  hp: number;
  mp: number;
  str: number;
  def: number;
  int: number;
  spd: number;
  luck: number;
}

export interface resistance {
  fire: number;
  ice: number;
  wind: number;
  light: number;
  dark: number;
  poison: number;
  numb: number;
  sleep: number;
}

interface unit {
  lv: number;
  class: string;
  name: string;
  status: string;
  base_attribute: base_attribute;
  res: resistance;
  add_attribute: base_attribute;
  add_res: resistance;
  total_attribute: base_attribute;
  total_res: resistance;
  attribute_limit: Record<AllowedAttributeLimits, number>;
}

type equipType = Record<AllowedEquipType, item | object | string>;

export type player = unit & {
  equip: equipType;
  gold: number;
  bag: Array<item>;
  exp: number;
  pt: number;
  pd: number; // Pick up distance
  // attribute_limit: {
  //   exp: number; // How much exp need to level up
  //   bag: number; // How many items the bag can carry
  // };
};

export type enemy = unit & {
  // theme: string;
  phase: string;
  elite: boolean;
  boss: boolean;
  bag: Array<string>;
  pattern: string;
  base_attribute: {
    vd: number; // view distant
  };
  position: {
    x: number;
    y: number;
  };
};
export interface rate {
  name: string;
  value: number;
}
export interface action {
  [name: string]: number;
}
