import { player, enemy, base_attribute, rate } from 'src/model/character';

const grows = [0, 1, 3];

export const levelUp = (data: player) => {
  data.lv += 1;

  for (const [key, value] of Object.entries(data.base_attribute)) {
    data.base_attribute[key as keyof base_attribute] =
      value + grows[Math.floor(Math.random() * grows.length)];
  }

  data.attribute_limit.hp = data.base_attribute.hp + data.add_attribute.hp;
  data.attribute_limit.mp = data.base_attribute.mp + data.add_attribute.mp;
  data.attribute_limit.exp += data.attribute_limit.exp * 1.5;
  data.pt += 5;

  return data;
};

export const setInitialStatus = (data: enemy, lv: number) => {
  data.lv = lv;
  const over = lv - 1;

  for (const [key, value] of Object.entries(data.base_attribute)) {
    data.base_attribute[key as keyof base_attribute] =
      value + grows[Math.floor(Math.random() * grows.length)] * over;
  }

  data.attribute_limit.hp = data.base_attribute.hp + data.add_attribute.hp;
  data.attribute_limit.mp = data.base_attribute.mp + data.add_attribute.mp;
  data.base_attribute.vd = data.attribute_limit.vd;

  return data;
};

export const becomeElite = (data: enemy) => {
  data.elite = true;

  for (const [key, value] of Object.entries(data.base_attribute)) {
    data.base_attribute[key as keyof base_attribute] = value * 1.5;
  }

  return data;
};

export const calculateDamage = (attacker: any, defender: any, skill?: any) => {
  const result = {
    type: '',
    value: 0,
  };

  let baseDMG = attacker.base_attribute.str + attacker.add_attribute.str;
  const baseDEF = defender.base_attribute.def + defender.add_attribute.def;

  if (attacker.equip) {
    if (Object.entries(attacker.equip.hand).length) {
      // Alter baseDMG
    }
  }

  if (skill) {
    if (Object.entries(skill).length) {
      // Alter baseDMG
    }
  }

  // Alter baseDEF if needed

  const rates: rate[] = [
    {
      name: 'hit',
      value:
        attacker.base_attribute.int +
        attacker.add_attribute.int +
        (attacker.base_attribute.int +
          Math.floor(
            attacker.base_attribute.int * (attacker.base_attribute.spd / 100)
          )) + 100,
    },
    {
      name: 'evade',
      value:
        defender.base_attribute.spd +
        defender.add_attribute.spd +
        (defender.base_attribute.spd +
          Math.floor(
            defender.base_attribute.spd * (defender.base_attribute.spd / 100)
          )),
    },
    {
      name: 'crit',
      value:
        attacker.base_attribute.luck +
        attacker.add_attribute.luck +
        (attacker.base_attribute.int +
          Math.floor(
            attacker.base_attribute.int * (attacker.base_attribute.luck / 100)
          )) + 25,
    },
  ];

  const totalRate = rates.reduce((accu, rate) => accu + rate.value, 0);

  console.log('total rate :>>>', totalRate);

  rates.forEach((rate) => {
    rate.value = rate.value / totalRate;
  });

  rates.sort((a, b) => a.value - b.value);

  console.log('rates :>>>', rates);

  // Dice roll
  const randomNumber = Math.random();

  for (let i = 0; i < rates.length; i++) {
    if (randomNumber < rates[i].value) {
      if (rates[i].name === 'hit') {
        if (baseDEF > baseDMG || baseDEF === baseDMG) {
          baseDMG = 1; // Minimun damage
        } else {
          baseDMG -= baseDEF;
        }
      }

      if (rates[i].name === 'evade') {
        baseDMG = 0;
      }

      if (rates[i].name === 'crit') {
        if (baseDEF > baseDMG || baseDEF === baseDMG) {
          baseDMG = Math.floor(1 * 1.5); // Minimun damage
        } else {
          baseDMG = Math.floor(baseDMG * 1.5) - baseDEF;
        }
      }

      result.type = rates[i].name;
      result.value = baseDMG;

      break;
    }
  }

  return result;
};
