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
        @dragover.prevent
      >
        <label :for="value">
          <div
            class="item"
            :style="`font-size:${itemFontSize}px;width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${pixelatedBorder(
              borderSize,
              index,
              hoveredIndex
            )}`"
          >
            <Sprite_image
              v-if="
                Object.entries(player.equip[value]).length &&
                draggingIndex !== index
              "
              :index="(player.equip[value] as item).index"
            />
            <span v-else>{{ value }}</span>
          </div>
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

    <!-- Dragging sprite -->
    <Teleport to="body">
      <label for="equip" v-show="Object.values(player.equip)[draggingIndex]">
        <Sprite_image
          ref="draggableSprite"
          @drag-end="onDrop"
          :index="(Object.values(player.equip)[draggingIndex] as item)?.index || 0"
        />
      </label>
    </Teleport>
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
  windowWidth,
} = storeToRefs(gameStore);

const { emitter, pixelatedBorder } = gameStore;

const hoveredItem = ref<item | object>({});

const hoveredIndex = ref<number>(-1);

const itemFontSize = ref<number>(0);

const draggingIndex = ref<number>(-1);

const draggingItem = ref<item | object>({});

const draggableSprite = ref();

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

const resetPosition = () => {
  hoveredIndex.value = -1;
  hoveredItem.value = {};
};

const checkingEquip = (equip: item) => {
  if (Object.entries(equip).length) {
    // Deduct the un-equip item attributes
    emitter.emit('player-unequip', equip);
    emit('passItem', equip);
  }
};

const dragStart = (e: MouseEvent, part: AllowedEquipType, index: number) => {
  console.log('inventory drag start ', e);
  // console.log('drag item ', item);
  if ((player.value.equip[part] as item).id) {
    draggingItem.value = player.value.equip[part] as item;
    draggingIndex.value = index;

    if (draggableSprite.value) draggableSprite.value.onDrag(e, true);
  }
};

const storeItem = (item: item) => {
  // If the cursor is hover on equip
  // Accept the item
  switch (item.type) {
    case 0:
      checkingEquip(player.value.equip.head as item);
      player.value.equip.head = item;
      break;
    case 1:
      checkingEquip(player.value.equip.body as item);
      player.value.equip.body = item;
      break;
    case 2:
      checkingEquip(player.value.equip.hand as item);
      player.value.equip.hand = item;
      break;
    case 3:
      checkingEquip(player.value.equip.feet as item);
      player.value.equip.feet = item;
      break;
    case 4:
      checkingEquip(player.value.equip.accessory as item);
      player.value.equip.accessory = item;
      break;
  }

  // Apply whatever attributes the item holds
  emitter.emit('player-equip', item);
};

const removeItem = () => {
  switch ((draggingItem.value as item).type) {
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

  // Deduct the item attributes
  emitter.emit('player-unequip', draggingItem.value);
}

const onDrop = () => {
  console.log('On drop');

  if (Object.entries(draggingItem.value).length) {
    switch (true) {
      // If the cursor is hover on inventory
      case props.insideInventory:
        emit('passItem', draggingItem.value);
        removeItem()
        break;
      // If the cursor is hovered on equip section
      case hoveredIndex.value >= 0:
        storeItem(draggingItem.value as item);
        break;
      // Drop item
      default:
        removeItem()
        emitter.emit('item-drop', [draggingItem.value]);
        break;
    }
    draggingIndex.value = -1;
  }
};

onMounted(() => {
  itemFontSize.value = Math.floor(windowWidth.value / 100) * 0.9;
});

defineExpose({
  storeItem,
});
</script>

<style lang="scss" scoped>
.equip {
  width: fit-content;
}
</style>
