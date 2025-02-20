<template>
  <div class="sprite" :style="spriteStyle"></div>
</template>

<script lang="ts" setup>
// import { useGameStore } from 'src/stores/game';
import { computed } from 'vue';

const props = defineProps({
  index: {
    type: Number,
    default: 0,
  },
});

const spriteStyle = computed(() => {
  const position = props.index * 24;
  return {
    backgroundImage: 'url(/assets/demo_item.png)',
    backgroundPosition: `-${position}px -${position}px`,
    width: '24px',
    height: '24px',
    backgroundSize: 'auto',
    margin: '0 auto',
  };
});
</script>
