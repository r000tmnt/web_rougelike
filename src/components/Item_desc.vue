<template>
  <div
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
      <li>DESC</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
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
});

// TODO - Get item data
</script>
