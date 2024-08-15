import { base_attribute } from './../model/character';
import { player, enemy, base_attribute } from 'src/model/character';

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

  return data;
};

export const becomeElite = (data: enemy) => {
  data.elite = true;

  for (const [key, value] of Object.entries(data.base_attribute)) {
    data.base_attribute[key as keyof base_attribute] = value * 1.5;
  }

  return data;
};

export const calculateDamage = (attacker: any, defender: any) => {
  let baseDMG = attacker.base_attribute.str + attacker.add_attribute.str;
  const baseDEF = defender.base_attribute.def + defender.add_attribute.def;

  if (Object.entries(attacker.equip.hand).length) {
    // Alter baseDMG
  }

  // Alter baseDEF if needed

  if (baseDEF > baseDMG) {
    baseDMG = 1; // Minimun damage
  } else {
    baseDMG -= baseDEF;
  }

  return baseDMG;
};
