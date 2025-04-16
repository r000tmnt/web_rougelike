type ItemTypes =
  | 'head'
  | 'body'
  | 'hand'
  | 'feet'
  | 'accessory'
  | 'consumable'
  | 'material'
  | 'special';

type RarityTypes = 'common' | 'advance' | 'rare' | 'unique' | 'legendary';

type rarity = {
  type: Partial<RarityTypes>;
  color: string;
};

export const ITEM_TYPES: Record<number, Partial<ItemTypes>> = {
  0: 'head',
  1: 'body',
  2: 'hand',
  3: 'feet',
  4: 'accessory',
  5: 'consumable',
  6: 'material',
  7: 'special',
};

export const RARITY_COLORS: Record<number, rarity> = {
  0: {
    type: 'common',
    color: '#ffffff', // White
  },
  1: {
    type: 'advance',
    color: '#1eff00', // Green
  },
  2: {
    type: 'rare',
    color: '#0070dd', // Blue
  },
  3: {
    type: 'unique',
    color: '#a335ee', // Purple
  },
  4: {
    type: 'legendary',
    color: '#ff8000', // Orange
  },
};
export interface item {
  id: string;
  name: string;
  type: number;
  subType?: number;
  rarity: number;
  desc?: string;
  modifier?: string;
  equip?: boolean;
  effect?: modifier;
  qty: number;
  limit: number; // The number of the item can be stack up
  index?: number; // Path of the image
}

export interface modifier {
  [name: string]: {
    type: number;
    value: number;
  };
}
