import { enemy } from 'src/model/character';

export default {
  lv: 1,
  // theme: 'demo'
  name: 'Skeleton',
  class: 'Undead',
  status: 'Normal',
  phase: 'roaming',
  elite: false,
  boss: false,
  base_attribute: {
    hp: 5,
    mp: 1,
    str: 3,
    def: 2,
    int: 1,
    spd: 2,
    luck: 2,
    vd: 3,
    bag: 0,
    exp: 0,
  },
  add_attribute: {
    hp: 0,
    mp: 0,
    str: 0,
    def: 0,
    int: 0,
    spd: 0,
    luck: 0,
    vd: 0,
  },
  total_attribute: {
    hp: 0,
    mp: 0,
    str: 0,
    def: 0,
    int: 0,
    spd: 0,
    luck: 0,
    vd: 0,
  },
  attribute_limit: {
    hp: 5,
    mp: 1,
    exp: 0,
    bag: 0,
    pd: 0.25,
    vd: 3,
  },
  bag: ['material_01', 'currency_01', 'card_01'], // Id of items
  pattern: '',
  position: {
    x: 0,
    y: 0,
  },
} as enemy;
