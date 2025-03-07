<template>
  <section
    class="q-pa-md row"
    :style="`font-size:${Math.floor(windowWidth / 100) * 2}px`"
  >
    <div class="col-3 q-pa-sm">
      <div class="q-mt-md q-mb-lg">
        <div class="text-h5">{{ currentSideView ? 'STATUS' : 'EQUIP' }}</div>
        <div id="tab" class="q-my-sm flex">
          <small
            class="q-pa-sm"
            :style="`box-shadow:${pixelatedBorder(
              borderSize,
              0,
              currentSideView
            )}`"
            @click="currentSideView = 0"
            >equipt</small
          >
          <small
            class="q-pa-sm"
            :style="`box-shadow:${pixelatedBorder(
              borderSize,
              1,
              currentSideView
            )}`"
            @click="currentSideView = 1"
            >status</small
          >
        </div>
      </div>
      <Player_equip
        v-if="currentSideView === 0"
        :player-data="player"
        ref="equipRef"
        :insideInventory="insideInventory"
        @insideEquip="(v) => (insideEquip = v)"
        @passItem="storeItem"
      />
      <Player_status v-else :player-data="player" />
    </div>

    <div class="col-9 q-pa-sm">
      <div class="flex q-mt-md q-mb-lg" ref="inventoryHeader">
        <div class="text-h5">INVENTORY</div>
        <div id="filters" class="q-ml-auto flex">
          <span>E</span>
          <span>C</span>
          <span>M</span>
          <span>S</span>
        </div>
      </div>

      <div
        class="hide-scrollbar row"
        :style="`max-height:${
          windowHeight * (90 / 100) - inventoryHeaderHeight
        }px;height:calc(90% -${
          dynamicWidth * rows + inventoryHeaderHeight
        }px);overflow-y: scroll;box-sizing:border-box;`"
      >
        <div
          id="inventory"
          class="col q-mx-auto flex"
          ref="inventoryContent"
          :style="`margin:${borderSize}px ${borderSize}px ${borderSize}px ${borderSize}px;`"
          @mouseenter="insideInventory = true"
          @mouseleave="insideInventory = false"
        >
          <div
            v-for="(space, index) in player.attribute_limit.bag"
            :key="index"
            :data-index="index"
            :data-type="player.bag[index] ? player.bag[index].type : -1"
            class="grid rounded-borders"
            :style="`width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${gameStore.pixelatedBorder(
              borderSize,
              index,
              hoveredIndex
            )}`"
            :draggable="false"
            @mouseenter="mouseOverEventWrapper"
            @mouseleave="resetPosition"
            @contextmenu.prevent="useItem(player.bag[index])"
            @mousedown="
              ($event) =>
                dragStart(
                  $event,
                  player.bag[index] ? player.bag[index] : {},
                  index
                )
            "
            @dragover.prevent
          >
            <label :for="String(index)">
              <!-- {{ index }} -->
              <div
                v-if="player.bag[index] && draggingIndex !== index"
                class="q-pa-sm"
                :data-type="player.bag[index].type"
                :style="`font-size:${
                  Math.floor(windowWidth / 100) * 0.9
                }px;pointer-events:none;height:100%;`"
              >
                <Sprite_image :index="player.bag[index].index" />
                <div class="text-right" style="transform: translate(12%, 140%)">
                  {{
                    player.bag[index].amount > 1 ? player.bag[index].amount : ''
                  }}
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <Item_desc
        v-if="player.bag[hoveredIndex]"
        :dynamic-width="dynamicWidth"
        :desc-element-position="descElementPosition"
        :pixelated-border="gameStore.pixelatedBorder(borderSize, -1, 0)"
        :item-data="player.bag[hoveredIndex] || {}"
      />

      <!-- Dragging sprite -->
      <Teleport to="body">
        <label for="inventory" v-show="player.bag[draggingIndex]">
          <Sprite_image
            ref="draggableSprite"
            @drag-end="onDrop"
            :index="player.bag[draggingIndex]?.index || 0"
          />
        </label>
      </Teleport>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import { item } from '../model/item';
import Item_desc from './Item_desc.vue';
import Player_equip from './Player_equip.vue';
import Player_status from './Player_status.vue';
import Sprite_image from './Sprite_image.vue';

const gameStore = useGameStore();

const {
  getPlayer: player,
  windowWidth,
  windowHeight,
  dynamicWidth,
  borderSize,
} = storeToRefs(gameStore);

const { emitter, pixelatedBorder } = gameStore;

const rows = ref<number>(0);

const descElementPosition = ref<string>('');

const hoveredIndex = ref<number>(-1);

const currentSideView = ref<number>(0);

const inventoryHeader = ref<HTMLDivElement>();

const inventoryContent = ref<HTMLDivElement>();

const inventoryHeaderHeight = ref<number>(0);

const draggingIndex = ref<number>(-1);

const draggingItem = ref<item | object>({});

const draggableSprite = ref();

const insideInventory = ref<boolean>(false);

const insideEquip = ref<boolean>(false);

const equipRef = ref<{ storeItem: (item: item) => void } | null>(null);

// const activeFilter = ref<number[]>([]);

const getItemPosition = (e: MouseEvent, colIndex: number) => {
  // console.log(e);

  // Get hovered element position relative to viewport
  const target = e.target as HTMLDivElement;
  const el = target.getBoundingClientRect();
  // console.log('target element :>>>', el);

  const stringify = String(colIndex);
  const indexInRow = Number(stringify[stringify.length - 1]);

  // Check item index
  if (indexInRow < 7) {
    descElementPosition.value = `transform: translate(${
      el.left - Math.floor(windowWidth.value / 4) + dynamicWidth.value
    }px, ${e.clientY >= 500 ? el.top - dynamicWidth.value : el.top}px)`;
  } else {
    descElementPosition.value = `transform: translate(${
      el.left - Math.floor(windowWidth.value / 4) - dynamicWidth.value * 3
    }px, ${e.clientY >= 500 ? el.top - dynamicWidth.value : el.top}px)`;
  }
};

const mouseOverEventWrapper = (e: MouseEvent) => {
  // console.log(e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    hoveredIndex.value = Number(target.dataset.index);
    getItemPosition(e, hoveredIndex.value);
  }
};

const resetPosition = () => {
  hoveredIndex.value = -1;
};

const useItem = (item: item) => {
  console.log('use item ', item);
};

const dragStart = (e: MouseEvent, item: item | object, index: number) => {
  console.log('inventory drag start ', e);
  if (draggableSprite.value) draggableSprite.value.onDrag(e, true);
  // console.log('drag item ', item);
  draggingIndex.value = index;
  draggingItem.value = item;
};

const getEmptyIndex = () => {
  const empty = player.value.bag.findIndex(
    (item: item) => !item || !Object.entries(item).length
  );
  return empty >= 0 ? empty : player.value.bag.length;
};

/**
 * Move the items inside inventory
 * @param itemToPlace - The dragging item
 * @param itemToBeMove - The item which is occupied the space, pass null if not exist
 */
const swapItems = (itemToPlace: item, itemToBeMove: item | null) => {
  player.value.bag[hoveredIndex.value] = itemToPlace;
  player.value.bag[draggingIndex.value] = itemToBeMove
    ? JSON.parse(JSON.stringify(itemToBeMove))
    : ({} as item);
};

const appendOrDropItem = (item: item, index: number) => {
  // If the bag is not full
  const totalItem = player.value.bag.filter(
    (i) => Object.entries(i).length
  ).length;
  if (totalItem < player.value.attribute_limit.bag) {
    swapItems(item, player.value.bag[index] || null);
  } else {
    // Bag is full, drop item
    player.value.bag[draggingIndex.value] = {} as item
    emitter.emit('item-drop', [item]);
  }
};

const stackOrAppendItem = (item: item) => {
  const { amount, limit } = player.value.bag[hoveredIndex.value];
  if (amount + item.amount > limit) {
    const over = item.amount - (limit - amount);
    player.value.bag[hoveredIndex.value].amount = limit;
    item.amount = over;
    // Find space for the remaining item
    const empty = getEmptyIndex();
    // Drop the remaining items
    appendOrDropItem(item, empty);
  } else {
    player.value.bag[hoveredIndex.value].amount += item.amount;
  }
};

const storeItem = (item: item) => {
  console.log('store item ', item);

  // If the room is occupied
  if (player.value.bag[hoveredIndex.value]) {
    // If the room is not the same as the dragged item was
    if (hoveredIndex.value >= 0 && hoveredIndex.value !== draggingIndex.value) {
      // If the item is not an equipment
      if (item.type >= 5) {
        // If the item is stackable
        if (item.type === player.value.bag[hoveredIndex.value].type) {
          stackOrAppendItem(item);
        } else {
          // Swap the items
          swapItems(item, player.value.bag[hoveredIndex.value] as item);
        }
      } else {
        // If the item is an equipment
        // If move items inside inventory
        if (draggingIndex.value >= 0) {
          // swapItems(item, player.value.bag[hoveredIndex.value]);
          const itemToSwap = JSON.parse(
            JSON.stringify(player.value.bag[hoveredIndex.value])
          );

          // If both are the same type of equipment
          if (item.type === itemToSwap.type) {
            appendOrDropItem(item, hoveredIndex.value);
            equipRef.value?.storeItem(itemToSwap as item);
          } else {
            // Move the itemToSwap to a new place
            // Store the item to the hovered one
            const empty = getEmptyIndex();
            appendOrDropItem(itemToSwap, empty);
            appendOrDropItem(item, hoveredIndex.value);
          }
        } else {
          // If the item is move from equip section
          const empty = getEmptyIndex();
          player.value.bag[empty] = item;
        }
      }
    }
    // Else, nothing happend. Return the item to where it belongs
  } else {
    // If the bag is not full
    // Bag is full, drop the item
    appendOrDropItem(item, hoveredIndex.value);
  }
};

const onDrop = () => {
  console.log('On drop');
  const tempItem = JSON.parse(JSON.stringify(draggingItem.value));
  console.log('tempItem ', tempItem);

  switch (true) {
    // If the cursor is hover on inventory
    case hoveredIndex.value >= 0:
      storeItem(tempItem);
      break;
    // If the cursor is hover on equip section
    case insideEquip.value:
      // Equip item
      equipRef.value?.storeItem(tempItem as item);
      player.value.bag[draggingIndex.value] = {} as item;
      break;
    // Drop item
    default:
      player.value.bag[draggingIndex.value] = {} as item
      emitter.emit('item-drop', [tempItem]);
      break;
  }
  draggingIndex.value = -1;
};

onMounted(() => {
  if (inventoryHeader.value) {
    inventoryHeaderHeight.value = inventoryHeader.value.clientHeight;
    console.log(inventoryHeader.value.clientHeight);
  }

  rows.value =
    player.value.attribute_limit.bag % 10 > 0
      ? Math.floor(player.value.attribute_limit.bag / 10) + 1
      : player.value.attribute_limit.bag / 10;

  console.log(rows.value);
  console.log(player.value);

  if (inventoryContent.value) {
    gameStore.setDynamicWidth(inventoryContent.value.clientWidth / 10.5);
  }

  gameStore.setBorderSize(Math.floor(dynamicWidth.value / 40));
});
</script>
