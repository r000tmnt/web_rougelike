import { position } from 'src/model/character';
export default {
  lv: 1,
  // theme: 'demo'
  name: 'Skeleton',
  class: 'Undead',
  status: 'Normal',
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
  attribute_limit: {
    hp: 5,
    mp: 1,
    vd: 3,
  },
  drop: [],
  pattern: '',
  position: {
    x: 0,
    y: 0,
  },
};
