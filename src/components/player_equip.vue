<template>
  <div>
    <ul id="equip" class="q-ma-auto">
      <li
        class="rounded-borders item equip"
        v-for="(key, value, index) in playerData.equip"
        :key="value"
      >
        <label :for="value">
          {{ value }}
          <template v-if="Object.entries(playerData.equip[value]).length">
            <div
              class="item"
              :style="`width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${gameStore.pixelatedBorder(
                borderSize,
                index,
                hoveredIndex
              )}`"
              :data-type="index"
              @mouseover="
                (e) => getItemPosition(e, playerData.equip[value], index)
              "
              @mouseleave="resetPosition"
            >
              {{ playerData.equip[value].name }}
            </div>
          </template>
          <template v-else> EMPTY </template>
        </label>
      </li>
    </ul>

    <Item_desc
      v-if="Object.entries(hoveredItem).length"
      :dynamic-width="dynamicWidth"
      :desc-element-position="descElementPosition"
      :pixelated-border="gameStore.pixelatedBorder(borderSize, -1, 0)"
      :item-data="hoveredItem"
    />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { item } from '../model/item';
import { ref, computed, onMounted } from 'vue';
import Item_desc from './Item_desc.vue';
import Sortable from 'sortablejs';

const gameStore = useGameStore();

const dynamicWidth = computed(() => gameStore.getdynamicWidth);

const borderSize = computed(() => gameStore.getborderSize);

const descElementPosition = ref<string>('');

const playerData = computed(() => gameStore.getPlayer);

const hoveredItem = ref<item | object>({});

const hoveredIndex = ref<number>(-1);

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
      const type = e.from.children[oldCol].dataset.type;

      // Get item data from bag
      // const itemData = playerData.value.bag[oldIndex]

      if (type === newCol) {
        // Replace the dropped element
        e.target.removeChild(e.target.children[oldCol]);
        e.target.children[
          oldCol
        ].innerHTML = `${playerData.value.bag[type].name}`;
      } else {
        // Remove the dropped element
        e.target.removeChild(e.target.children[oldCol]);
        e.target.children[oldCol].innerHTML = 'EMPTY';
      }
    },

    onRemove: (e: any) => {
      console.log('equip removed ', e);
      // Get the dragged col
      const oldCol = e.oldIndex;
      // Get the dropped item data
      const itemData = Object.entries(playerData.value.equip)[oldCol];
      // Remove the clone item
      e.target.children[oldCol].innerHTML = `${itemData[0]} EMPTY`;
    },
  });
});
</script>
