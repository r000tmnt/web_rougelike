<template>
  <div>
    <div
      id="equip"
      class="q-ma-auto"
      @mouseenter="emit('insideEquip', true)"
      @mouseleave="emit('insideEquip', false)"
    >
      <div
        class="rounded-borders equip"
        v-for="(key, value, index) in player.equip"
        :key="value"
        :data-type="index"
        :draggable="false"
        @mouseenter="(e) => getItemPosition(e, player.equip[value] as item, index)"
        @mouseleave="resetPosition"
        @mousedown="($event) => dragStart($event, value, index)"
        @mousemove="onDrag"
        @mouseup="onDrop"
        @dragover.prevent
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
            >
              <Sprite_image :index="(player.equip[value] as item).index" />
              <!-- {{ (player.equip[value] as item).name }} -->
            </div>
          </template>
          <template v-else>
            <div
              :style="`font-size:${itemFontSize}px;width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${pixelatedBorder(
                borderSize,
                index,
                hoveredIndex
              )}`"
              @mouseenter="mouseOverEventWrapper"
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
import Sprite_image from './Sprite_image.vue';
import { AllowedEquipType } from 'src/model/character';

const descElementPosition = ref<string>('');

const gameStore = useGameStore();

const {
  getPlayer: player,
  dynamicWidth,
  borderSize,
  tileSize,
  windowWidth,
} = storeToRefs(gameStore);

const { emitter, pixelatedBorder } = gameStore;

const hoveredItem = ref<item | object>({});

const hoveredIndex = ref<number>(-1);

const itemFontSize = ref<number>(0);

const draggingIndex = ref<number>(-1);

const draggingItem = ref<item | object>({});

const draggingPosition = ref({
  x: 0,
  y: 0,
});

const props = defineProps({
  insideInventory: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['insideEquip', 'passItem']);

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
      getItemPosition(e, equips[type][1] as item, type);
    }
  }
};

const resetPosition = () => {
  hoveredIndex.value = -1;
  hoveredItem.value = {};
};

const checkingEquip = (equip: item) => {
  if (Object.entries(equip).length) {
    // Deduct the un-equip item attributes
    emitter.emit('player-unequip', equip);
  }
};

const dragStart = (e: MouseEvent, part: AllowedEquipType, index: number) => {
  console.log('inventory drag start ', e);
  // console.log('drag item ', item);
  if ((player.value.equip[part] as item).id) {
    draggingItem.value = player.value.equip[part] as item;
    draggingIndex.value = index;
  }
};

const onDrag = (e: MouseEvent) => {
  // console.log('dragging :>>>', e);
  draggingPosition.value = {
    x: e.clientX - tileSize.value / 2,
    y: e.clientY - tileSize.value / 2,
  };
};

const onDrop = (e: MouseEvent, item = null) => {
  console.log('On drop ', e);

  const targetItem = item ? item : draggingItem.value;

  // If the cursor is hover on inventory
  if (props.insideInventory) {
    emit('passItem', targetItem);

    switch ((targetItem as item).type) {
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
    emitter.emit('player-unequip', targetItem);
    return;
  }

  // If the cursor is hover on equip
  // Accept the item
  switch ((targetItem as item).type) {
    case 0:
      checkingEquip(player.value.equip.head as item);
      player.value.equip.head = targetItem;
      break;
    case 1:
      checkingEquip(player.value.equip.body as item);
      player.value.equip.body = targetItem;
      break;
    case 2:
      checkingEquip(player.value.equip.hand as item);
      player.value.equip.hand = targetItem;
      break;
    case 3:
      checkingEquip(player.value.equip.feet as item);
      player.value.equip.feet = targetItem;
      break;
    case 4:
      checkingEquip(player.value.equip.accessory as item);
      player.value.equip.accessory = targetItem;
      break;
  }

  // Apply whatever attributes the item holds
  emitter.emit('player-equip', targetItem);
};

onMounted(() => {
  itemFontSize.value = Math.floor(windowWidth.value / 100) * 0.9;
});

defineExpose({
  onDrop,
});
</script>
