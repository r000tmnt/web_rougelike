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
      <Player_equip v-if="currentSideView === 0" :player-data="player" />
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
            @mouseover="mouseOverEventWrapper"
            @mouseleave="resetPosition"
            :draggable="player.bag[index] ? true : false"
            @dragstart="
              dragStart(
                $event,
                player.bag[index] ? player.bag[index] : {},
                index
              )
            "
            @drop="onDrop($event, index)"
            @dragover.prevent
            @dragenter="dragEnter($event)"
            @dragleave="dragLeave($event)"
          >
            <label :for="String(index)">
              <!-- {{ index }} -->

              <template v-if="player.bag[index]">
                <div
                  class="item"
                  :data-type="player.bag[index].type"
                  :style="`font-size:${Math.floor(windowWidth / 100) * 0.9}px`"
                >
                  {{ player.bag[index].name }}
                </div>
              </template>
            </label>
          </div>
        </div>
        <!-- <table class="q-mx-auto" style="width: 80%">
          <tbody>
            <template v-for="(row, rowIndex) in rows" :key="row">
              <tr>
                <td
                  v-for="(col, colIndex) in 10"
                  :key="col"
                  :class="{
                    hidden:
                      colIndex + rowIndex * 10 >
                      player.attribute_limit.bag - 1,
                  }"
                  :data-index="colIndex + rowIndex * 10"
                >
                  <div
                    class="grid rounded-borders"
                    :style="`width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${gameStore.pixelatedBorder(
                      borderSize,
                      colIndex + rowIndex * 10,
                      hoveredIndex
                    )}`"
                    @mouseover="(e) => getItemPosition(e, colIndex, rowIndex)"
                    @mouseleave="resetPosition"
                    @contextmenu="
                      (e) => {
                        console.log('mouse right click ', e);
                      }
                    "
                  >
                    {{ colIndex + rowIndex * 10 }}
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table> -->
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

// const activeFilter = ref<number[]>([]);

emitter.on('remove-item', () => {
  if (draggingIndex.value >= 0) {
    player.value.bag[draggingIndex.value] = {} as item;
  }
});

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

const dragStart = (e: DragEvent, item: item | object, index: number) => {
  console.log('inventory drag start ', e);
  // console.log('drag item ', item);
  if (Object.entries(item).length && e.dataTransfer) {
    draggingIndex.value = index;
    e.dataTransfer.dropEffect = 'move';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'item',
      JSON.stringify({ fromEquip: false, data: item })
    );
  }
};

const dragEnter = (e: DragEvent) => {
  console.log('inventory drag enter ', e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    target.classList.add('drag-highlight');
  }
};

const dragLeave = (e: DragEvent) => {
  console.log('inventory drag leave ', e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    target.classList.remove('drag-highlight');
  }
};

const onDrop = (e: DragEvent, index: number) => {
  console.log('On drop ', e);
  if (e.target) {
    const target = e.target as HTMLDivElement;
    target.classList.remove('drag-highlight');
  }

  if (e.dataTransfer) {
    const { fromEquip, data } = JSON.parse(e.dataTransfer.getData('item'));
    console.log('inventory drop ', data);
    // If the bag is not full
    if (player.value.bag.length < player.value.attribute_limit.bag) {
      // If the room is occupied
      if (player.value.bag[index]) {
        if (data.type >= 5) {
          if (data.type === player.value.bag[index].type) {
            player.value.bag[index].amount += data.amount;
          } else {
            // Trigger dragstart event
            e.target?.dispatchEvent(
              new DragEvent('dragstart', {
                bubbles: false,
                cancelable: true,
              })
            );

            player.value.bag[index] = data;
          }
        }
      } else {
        player.value.bag[index] = data;
      }

      // If the item is an equipment
      if (data.type < 5 && fromEquip) {
        switch (data.type) {
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
        emitter.emit('player-unequip', data);
      } else {
      }
    }
  }
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
