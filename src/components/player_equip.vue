<template>
  <div>
    <div id="equip" class="q-ma-auto">
      <div
        class="rounded-borders equip"
        v-for="(key, value, index) in player.equip"
        :key="value"
        :data-type="index"
      >
        <label :for="value">
          <template v-if="Object.entries(player.equip[value]).length">
            <div
              class="item"
              :style="`font-size:${itemFontSize}px;width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${pixelatedBorder(
                borderSize,
                index,
                hoveredIndex
              )}`"
              @mouseover="(e) => getItemPosition(e, player.equip[value], index)"
              @mouseleave="resetPosition"
            >
              {{ player.equip[value].name }}
            </div>
          </template>
          <template v-else>
            <div
              :style="`font-size:${itemFontSize}px;width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${pixelatedBorder(
                borderSize,
                index,
                hoveredIndex
              )}`"
              @mouseover="(e) => getItemPosition(e, player.equip[value], index)"
              @mouseleave="resetPosition"
            >
              {{ value }}
            </div>
          </template>
        </label>
      </div>
    </div>

    <Item_desc
      v-if="Object.entries(hoveredItem).length"
      :dynamic-width="dynamicWidth"
      :desc-element-position="descElementPosition"
      :pixelated-border="pixelatedBorder(borderSize, -1, 0)"
      :item-data="hoveredItem"
    />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { storeToRefs } from 'pinia';
import { item } from '../model/item';
import { ref, onMounted } from 'vue';
import Item_desc from './Item_desc.vue';
import Sortable from 'sortablejs';
import types from '../data/types';

const descElementPosition = ref<string>('');

const gameStore = useGameStore();

const { player, dynamicWidth, borderSize, windowWidth } =
  storeToRefs(gameStore);

const { emitter, pixelatedBorder } = gameStore;

const hoveredItem = ref<item | object>({});

const hoveredIndex = ref<number>(-1);

const itemFontSize = ref<number>(0);

const getItemPosition = (e: MouseEvent, item: item, index: number) => {
  // console.log(e);

  // Get hovered element position relative to viewport
  const target = e.target as HTMLDivElement;
  const el = target.getBoundingClientRect();
  // console.log('target element :>>>', el);

  descElementPosition.value = `transform: translate(${
    el.left + dynamicWidth.value
  }px, ${e.clientY >= 500 ? el.top - dynamicWidth.value : el.top}px)`;

  // Display the information
  hoveredItem.value = item;
  hoveredIndex.value = index;
};

const resetPosition = () => {
  hoveredIndex.value = -1;
  hoveredItem.value = {};
};

onMounted(() => {
  itemFontSize.value = Math.floor(windowWidth.value / 100) * 0.9;

  const equipBlocks = document.getElementById('equip');

  new Sortable(equipBlocks, {
    sort: false,
    handle: '.item', // Need to specify handle to work with dynamic element
    group: {
      name: 'shared',
      put: true,
      pull: (to, from) => {
        console.log('to', to);
        console.log('from equip', from);
        return 'clone';
      },
      revertClone: true,
    },
    direction: function (evt, target, dragEl) {
      console.log('equip target', target);
      console.log('el drag to equip', dragEl);
      return 'vertical';
    },
    onAdd: (e: any) => {
      console.log('equip dropped ', e);
      // Get the dragged col
      const oldCol = e.oldIndex;
      // Get target
      const newCol = e.newIndex;
      // Get the dropped item type
      const type = Number(e.from.children[oldCol].dataset.type);

      // Get item data from bag
      const itemData = player.value.bag[oldCol];

      if (type === newCol) {
        // Remove
        // Replace the dropped element
        e.target.removeChild(e.target.children[newCol]);
        e.target.children[newCol].innerHTML = `<label for="${
          types.item[newCol]
        }"><div class="item" style="font-size:${itemFontSize.value}px;width: ${
          dynamicWidth.value
        }px;height: ${dynamicWidth.value}px; box-shadow: ${pixelatedBorder(
          borderSize.value,
          newCol,
          hoveredIndex.value
        )}">${player.value.bag[oldCol].name}</div></label>`;

        // Put the item into player data
        switch (newCol) {
          case 0:
            player.value.equip.head = itemData;
            break;
          case 1:
            player.value.equip.body = itemData;
            break;
          case 2:
            player.value.equip.hand = itemData;
            break;
          case 3:
            player.value.equip.feet = itemData;
            break;
          case 4:
            player.value.equip.accessory = itemData;
            break;
        }

        // Remove the item from the bag
        player.value.bag[oldCol] = {} as item;

        // Apply whatever attributes the item holds
        emitter.emit('player-equip', itemData);
      } else {
        // Remove the dropped element
        e.target.removeChild(e.target.children[newCol]);
        e.target.children[newCol].innerHTML = `${types.item[newCol]}`;
      }
    },

    onRemove: (e: any) => {
      console.log('equip removed ', e);
      // Get the dragged col
      const oldCol = e.oldIndex;
      // Get the dropped item data
      const itemData = Object.entries(player.value.equip)[oldCol];
      // Remove the clone item
      e.target.children[oldCol].innerHTML = `<label for="${
        types.item[oldCol]
      }"><div style="font-size:${itemFontSize.value}px;width: ${
        dynamicWidth.value
      }px;height: ${dynamicWidth.value}px; box-shadow: ${pixelatedBorder(
        borderSize.value,
        oldCol,
        hoveredIndex.value
      )}">${itemData[0]}</div></label>`;

      // Remove the item in player data
      switch (oldCol) {
        case 0:
          player.value.equip.head = {} as item;
          break;
        case 1:
          player.value.equip.body = {} as item;
          break;
        case 2:
          player.value.equip.hand = {} as item;
          break;
        case 3:
          player.value.equip.feet = {} as item;
          break;
        case 4:
          player.value.equip.accessory = {} as item;
          break;
      }

      // Deduct the un-equip item attributes
      emitter.emit('player-unequip', itemData[1]);
    },
    onMove: (e: any) => {
      console.log('onMove ', e);
    },
    onUnchoose: (e: any) => {
      console.log('onUnchoose ', e);
    },
  });
});
</script>
