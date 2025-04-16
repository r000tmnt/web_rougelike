import lootTable from 'src/data/lootTable';
import { item } from 'src/model/item';

export const getItemData = (id: string) => {
  const type = id.split('_')[0];
  let targetTable: Array<item> = [];

  switch (type) {
    case 'accessory':
      // targetTable = lootTable.accessory
      break;
    case 'body':
      targetTable = lootTable.body;
      break;
    case 'card':
      targetTable = lootTable.cards;
      break;
    case 'currency':
      targetTable = lootTable.currencies;
      break;
    case 'feet':
      targetTable = lootTable.feet;
      break;
    case 'hand':
      targetTable = lootTable.hand;
      break;
    case 'head':
      // targetTable = lootTable.head
      break;
    case 'material':
      targetTable = lootTable.materials;
      break;
    case 'potion':
      targetTable = lootTable.potions;
      break;
  }

  return targetTable.find((item) => item.id === id);
};
