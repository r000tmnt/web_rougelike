import { item } from './item';

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
  //ap: number;
  luck: number;
  //ms: number; // move speed
  //vd: number // view distant
}

interface unit {
  lv: number;
  class: string;
  name: string;
  status: string;
  base_attribute: base_attribute;
  add_attribute: base_attribute;
  total_attribute: base_attribute;
  attribute_limit: base_attribute;
}

export type player = unit & {
  equip: {
    head: item;
    body: item;
    hand: item;
    feet: item;
    accasory: item;
  };
  bag: Array<item>;
  exp: number;
  pt: number;
  attribute_limit: {
    exp: number; // How much exp need to level up
    bag: number; // How many items the bag can carry
  };
};

export type enemy = unit & {
  // theme: string;
  elite: boolean;
  boss: boolean;
  drop: Array<item>;
  pattern: string;
  base_attribute: {
    vd: number; // view distant
  };
  add_attribute: {
    vd: number; // view distant
  };
  attribute_limit: {
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
