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
            @mousemove="onDrag"
            @mouseup="onDrop"
            @dragover.prevent
          >
            <label :for="String(index)" v-if="draggingIndex !== index">
              <!-- {{ index }} -->

              <template v-if="player.bag[index]">
                <div
                  class="q-pa-sm"
                  :data-type="player.bag[index].type"
                  :style="`font-size:${
                    Math.floor(windowWidth / 100) * 0.9
                  }px;pointer-events:none;height:100%;`"
                >
                  <Sprite_image :index="player.bag[index].index" />
                  <div
                    v-if="player.bag[index].amount > 1"
                    class="text-right"
                    style="transform: translate(12%, 140%)"
                  >
                    {{ player.bag[index].amount }}
                  </div>
                </div>
              </template>
            </label>

            <label :for="String(index)" v-else>
              <template v-if="player.bag[index]">
                <Sprite_image
                  id="draggable"
                  :index="player.bag[index].index"
                  :style="`left: ${draggingPosition.x}px; top:${draggingPosition.y}px;`"
                />
              </template>
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
  tileSize,
  borderSize,
} = storeToRefs(gameStore);

const { pixelatedBorder } = gameStore;

const rows = ref<number>(0);

const descElementPosition = ref<string>('');

const hoveredIndex = ref<number>(-1);

const currentSideView = ref<number>(0);

const inventoryHeader = ref<HTMLDivElement>();

const inventoryContent = ref<HTMLDivElement>();

const inventoryHeaderHeight = ref<number>(0);

const draggingIndex = ref<number>(-1);

const draggingItem = ref<item | object>({});

const draggingPosition = ref({
  x: 0,
  y: 0,
});

const insideInventory = ref<boolean>(false);

const insideEquip = ref<boolean>(false);

const equipRef = ref<{ onDrop: (item: item) => void } | null>(null);

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

  // Display the information
  hoveredIndex.value = colIndex;

  // console.log(
  //   `hovered ${hoveredIndex.value} :>>>`,
  //   player.value.bag[hoveredIndex.value]
  // );
};

const mouseOverEventWrapper = (e: MouseEvent) => {
  // console.log(e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    getItemPosition(e, Number(target.dataset.index));
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
  // console.log('drag item ', item);
  draggingIndex.value = index;
  draggingItem.value = item;
};

const onDrag = (e: MouseEvent) => {
  // console.log('dragging :>>>', e);
  draggingPosition.value = {
    x: e.clientX - tileSize.value / 2,
    y: e.clientY - tileSize.value / 2,
  };
};

const swapeItems = (item1: item, item2: item) => {
  const itemToSwap = JSON.parse(JSON.stringify(item2));
  player.value.bag[hoveredIndex.value] = item1;
  player.value.bag[draggingIndex.value] = itemToSwap;
};

const onDrop = (e: MouseEvent) => {
  console.log('On drop ', e);

  if (hoveredIndex.value >= 0) {
    const tempItem = JSON.parse(JSON.stringify(draggingItem.value));
    console.log('tempItem ', tempItem);

    // If the cursor is hover on equip
    if (insideEquip.value) {
      equipRef.value?.onDrop(
        JSON.parse(JSON.stringify(draggingItem.value)) as item
      );
      player.value.bag[draggingIndex.value] = {} as item;
    }
    // If the cursor is hover on inventory
    // If the bag is not full
    else if (player.value.bag.length < player.value.attribute_limit.bag) {
      // If the room is occupied
      if (player.value.bag[hoveredIndex.value]) {
        // If the item is not an equipment
        if (tempItem.type >= 5) {
          // If the item is stackable
          if (tempItem.type === player.value.bag[hoveredIndex.value].type) {
            const { amount, limit } = player.value.bag[hoveredIndex.value];
            if (amount + tempItem.amount > limit) {
              const over = tempItem.amount - (limit - amount);
              player.value.bag[hoveredIndex.value].amount = limit;
              // Find space for the remaining item
              let empty = player.value.bag.find((item) => !item.index);
              empty = tempItem;
              if (empty) empty.amount = over;
            } else {
              player.value.bag[hoveredIndex.value].amount += tempItem.amount;
            }
          } else {
            // Swap the items
            swapeItems(tempItem, player.value.bag[hoveredIndex.value]);
          }
        } else {
          // If the item is an equipment
          swapeItems(tempItem, player.value.bag[hoveredIndex.value]);
        }
      } else {
        player.value.bag[hoveredIndex.value] = tempItem;
      }
    }
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

<style scoped lang="scss">
#draggable {
  position: absolute;
}
</style>
