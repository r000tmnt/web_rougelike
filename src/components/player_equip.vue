<template>
  <ul class="q-ma-auto">
    <li
      class="rounded-borders item equip"
      :style="`box-shadow:${gameStore.pixelatedBorder(
        borderSize,
        index,
        hoveredIndex
      )}`"
      v-for="(key, value, index) in playerData.equip"
      :key="value"
      @mouseover="(e) => getItemPosition(e, playerData.equip[value], index)"
      @mouseleave="resetPosition"
    >
      {{ value }}
      <template v-if="Object.entries(playerData.equip[value]).length">
        <span>{{ playerData.equip[value].name }}</span>
      </template>
      <template v-else> EMPTY </template>
    </li>
  </ul>

  <Item_desc
    v-if="Object.entries(hoveredItem).length"
    :dynamic-width="dynamicWidth"
    :desc-element-position="descElementPosition"
    :pixelated-border="gameStore.pixelatedBorder(borderSize, -1, 0)"
    :item-data="hoveredItem"
  />
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { item } from '../model/item.ts';
import { ref, computed } from 'vue';
import Item_desc from './Item_desc.vue';

const gameStore = useGameStore();

const dynamicWidth = computed(() => gameStore.getdynamicWidth);

const borderSize = computed(() => gameStore.getborderSize);

const descElementPosition = ref<string>('');

const playerData = computed(() => gameStore.getPlayer);

const hoveredItem = ref<item>({});

const hoveredIndex = ref<number>(-1);

const getItemPosition = (e: MouseEvent, item: item, index: number) => {
  console.log(e);

  // Get hovered element position relative to viewport
  const target = e.target as HTMLDivElement;
  const el = target.getBoundingClientRect();
  console.log('target element :>>>', el);

  descElementPosition.value = `transform: translate(${
    el.left + dynamicWidth.value
  }px, ${e.clientY >= 500 ? el.top - dynamicWidth.value : el.top}px)`;

  // Display the information
  hoveredItem.value = item;
  hoveredIndex.value = index;
};

const resetPosition = () => {
  hoveredIndex.value = -1;
};
</script>
