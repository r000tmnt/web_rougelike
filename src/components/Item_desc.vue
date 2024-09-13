<template>
  <!-- v-if="Object.entries(itemData).length" -->
  <div
    v-if="Object.entries(itemData).length"
    id="desc"
    class="absolute bg-dark grid"
    :style="`width: ${
      dynamicWidth * 3
    }px;top:0;box-shadow: ${pixelatedBorder};${descElementPosition}`"
  >
    <img
      class="q-mx-auto"
      src=""
      alt="image"
      :style="`width: ${gameStore.tileSize}px; height: ${gameStore.tileSize}px`"
    />
    <ul>
      <div class="item-header flex">
        <span class="q-mr-sm">{{ itemData.name }}</span>
        <small>Rarity {{ itemData.rarity }}</small>
      </div>

      <p>{{ itemData.desc }}</p>

      <ul>
        <li v-for="(eKey, eVal, index) in itemData.effect" :key="index">
          {{ eVal }} {{ getEffectValue(eKey) }}
        </li>
      </ul>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { item } from '../model/item';
import { useGameStore } from '../stores/game';
// import { ref, computed, onMounted } from 'vue';

const gameStore = useGameStore();

defineProps({
  dynamicWidth: {
    type: Number,
    default: 0,
  },
  pixelatedBorder: {
    type: String,
    default: '',
  },
  descElementPosition: {
    type: String,
    default: '',
  },
  itemData: {
    type: Object,
    default: {} as item,
  },
});

// TODO - Get item data
const getEffectValue = (effect: { type: number; value: number }) => {
  let result = '';

  switch (effect.type) {
    case 0:
      result += `+ ${effect.value}`;
      break;
    case 1:
      result += `+ ${effect.value}%`;
      break;
    case 2:
      result += `- ${effect.value}`;
      break;
    case 3:
      result += `- ${effect.value}%`;
      break;
  }

  return result;
};
</script>
