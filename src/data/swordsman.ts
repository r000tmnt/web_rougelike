export default {
  lv: 1,
  name: 'Player',
  class: 'Swordsman',
  status: 'Normal',
  base_attribute: {
    hp: 10,
    mp: 5,
    str: 5,
    def: 3,
    int: 3,
    spd: 3,
    luck: 2,
  },
  add_attribute: {
    hp: 0,
    mp: 0,
    str: 0,
    def: 0,
    int: 0,
    spd: 0,
    luck: 0,
  },
  total_attribute: {
    hp: 0,
    mp: 0,
    str: 0,
    def: 0,
    int: 0,
    spd: 0,
    luck: 0,
  },
  attribute_limit: {
    hp: 10,
    mp: 5,
    str: 5,
    def: 3,
    int: 3,
    spd: 3,
    luck: 2,
    exp: 100,
    bag: 200,
  },
  equip: {
    head: {},
    body: {
      id: 'b01',
      name: "Traveler's tunic",
      rarity: 0,
      type: 1,
      image: '',
      modifier: '',
      desc: 'Simple outfit with a few pockets',
      equip: true,
      effect: {
        def: {
          type: 0,
          value: 2,
        },
        bag: {
          type: 0,
          value: 5,
        },
      },
    },
    hand: {
      id: 'h01',
      name: 'Wooden sword',
      rarity: 0,
      type: 2,
      image: '',
      modifier: '',
      equip: true,
      desc: 'Used for practice mostly',
      effect: {
        str: {
          type: 0,
          value: 5,
        },
      },
    },
    feet: {
      id: 'f01',
      name: 'Leather boots',
      rarity: 0,
      type: 3,
      image: '',
      modifier: '',
      desc: "Good to protect the wearer's feet",
      equip: true,
      effect: {
        def: {
          type: 0,
          value: 1,
        },
      },
    },
    accessory: {},
  },
  exp: 0,
  pt: 0,
  bag: [],
};
