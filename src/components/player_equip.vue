<template>
  <div>
    <div id="equip" class="q-ma-auto">
      <div
        class="rounded-borders equip"
        v-for="(key, value, index) in player.equip"
        :key="value"
        :data-type="index"
        :draggable="Object.entries(player.equip[value]).length ? true : false"
        @dragstart="
          dragStart(
            $event,
            Object.entries(player.equip[value]).length
              ? player.equip[value]
              : {}
          )
        "
        @drop="onDrop($event, index)"
        @dragover.prevent
        @dragenter="dragEnter($event)"
        @dragleave="dragLeave($event)"
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
              @mouseover="mouseOverEventWrapper"
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

const descElementPosition = ref<string>('');

const gameStore = useGameStore();

const {
  getPlayer: player,
  dynamicWidth,
  borderSize,
  windowWidth,
} = storeToRefs(gameStore);

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

const mouseOverEventWrapper = (e: MouseEvent) => {
  // console.log(e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    if (target.dataset.type) {
      const type = Number(target.dataset.type);
      const equips = Object.entries(player.value.equip).map((e) => e);
      console.log(equips);
      getItemPosition(e, equips[type][1], type);
    }
  }
};

const resetPosition = () => {
  hoveredIndex.value = -1;
  hoveredItem.value = {};
};

const dragStart = (e: DragEvent, item: item | object) => {
  console.log('equip drag start ', e);
  // console.log('drag item ', item);
  if (Object.entries(item).length && e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'item',
      JSON.stringify({ fromEquip: true, data: item })
    );
  }
};

const dragEnter = (e: DragEvent) => {
  console.log('equip drag enter ', e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    target.classList.add('drag-highlight');
  }
};

const dragLeave = (e: DragEvent) => {
  console.log('equip drag leave ', e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    target.classList.remove('drag-highlight');
  }
};

const onDrop = (e: DragEvent, type: number) => {
  console.log('On drop ', e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    target.classList.remove('drag-highlight');
  }

  if (e.dataTransfer) {
    const { data } = JSON.parse(e.dataTransfer.getData('item'));
    console.log('equip drop ', data);
    if (data.type === type) {
      // Accept the item
      switch (type) {
        case 0:
          player.value.equip.head = data;
          break;
        case 1:
          player.value.equip.body = data;
          break;
        case 2:
          player.value.equip.hand = data;
          break;
        case 3:
          player.value.equip.feet = data;
          break;
        case 4:
          player.value.equip.accessory = data;
          break;
      }

      // Apply whatever attributes the item holds
      emitter.emit('player-equip', data);
      emitter.emit('remove-item');
    }
  }
};

onMounted(() => {
  itemFontSize.value = Math.floor(windowWidth.value / 100) * 0.9;
});
</script>
