<template>
  <div
    v-show="index >= 0"
    class="sprite"
    :style="`background-position: ${spriteStyle}; position: ${spritePosition}; ${draggingStyle}`"
  ></div>
</template>

<script lang="ts" setup>
// import { useGameStore } from 'src/stores/game';
import { computed, ref } from 'vue';

const props = defineProps({
  index: {
    type: Number,
    default: -1,
  },
});

const emit = defineEmits(['dragEnd']);

const spritePosition = ref<string>('relative');

const draggingPosition = ref({
  x: 0,
  y: 0,
});

const draggingStyle = computed(() =>
  spritePosition.value === 'absolute'
    ? `left: ${draggingPosition.value.x}px; top: ${draggingPosition.value.y}px;`
    : ''
);

const onDrag = (e: MouseEvent, signal: boolean) => {
  spritePosition.value = signal ? 'absolute' : 'relative';
  onMove(e);
  if (signal) {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onDrop);
  }
};

const onMove = (e: MouseEvent) => {
  draggingPosition.value.x = e.pageX - 24;
  draggingPosition.value.y = e.pageY - 24;
};

const onDrop = (e: MouseEvent) => {
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onDrop);
  onDrag(e, false);
  emit('dragEnd');
};

const spriteStyle = computed(() => {
  const position = props.index * 24;
  return `-${position}px -${position}px`;
});

defineExpose({
  onDrag,
});
</script>

<style scpoed>
.sprite {
  background-image: url('/assets/demo_item.png');
  width: 24px;
  height: 24px;
  background-size: auto;
  margin: 0 auto;
}
</style>
