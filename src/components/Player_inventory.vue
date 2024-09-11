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
            :style="`box-shadow:${gameStore.pixelatedBorder(
              borderSize,
              0,
              currentSideView
            )}`"
            @click="currentSideView = 0"
            >equipt</small
          >
          <small
            class="q-pa-sm"
            :style="`box-shadow:${gameStore.pixelatedBorder(
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
            @mouseover="(e) => getItemPosition(e, index)"
            @mouseleave="resetPosition"
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
// import Sortable from 'sortablejs';
// import { Sortable, Swap } from 'sortablejs/modular/sortable.core.esm';
import customSortable from 'src/boot/sortable';

const gameStore = useGameStore();

const {
  getPlayer: player,
  windowWidth,
  windowHeight,
  dynamicWidth,
  borderSize,
} = storeToRefs(gameStore);

const rows = ref<number>(0);

const descElementPosition = ref<string>('');

const hoveredIndex = ref<number>(-1);

const currentSideView = ref<number>(0);

const inventoryHeader = ref<HTMLDivElement>();

const inventoryContent = ref<HTMLDivElement>();

const inventoryHeaderHeight = ref<number>(0);

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

  console.log('hovered :>>>', player.value.bag[hoveredIndex.value]);
};

const resetPosition = () => {
  hoveredIndex.value = -1;
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

  const inventory = document.getElementById('inventory');

  new customSortable(inventory, {
    // disabled: playerData.value.bag.length > 0,
    swap: true,
    swapClass: 'sortable-swap-highlight',
    handle: '.item', // Need this to work with dynamic elements
    group: {
      name: 'shared',
      put: true,
      pull: (to, from) => {
        console.log('to', to);
        console.log('from inventory', from);
        return true;
      },
      // pull: true,
      // revertClone: true,
    },
    // direction: function (evt, target, dragEl) {
    //   // console.log('target to drop', target);
    //   // console.log('dragEl', dragEl);
    //   // if (dragEl.className.includes('equip')) {
    //   //   const col = target.dataset.index;
    //   //   const dragType = dragEl.dataset.type;
    //   //   target.innerHTML = `${col} <span data-type="${dragType}">${dragEl.innerHTML}</span>`;
    //   //   gameStore.emitter.emit('drag-from-equip');
    //   //   return;
    //   // }

    //   if (target !== null) {
    //     return 'horizontal';
    //   }
    //   return 'vertical';
    // },
    onStart: () => {
      hoveredIndex.value = -1;
    },
    onAdd: (e: any) => {
      console.log('table cell dropped ', e);

      // Get the column to be drop
      const newCol = e.newIndex;
      const oldCol = e.oldIndex;
      // Remove the cloned element
      // e.target.removeChild(e.target.children[newCol]);

      let itemData = {} as item;

      // If the dropped item is an equipment
      if (e.from.id.includes('equip')) {
        // Get the dropped item data
        itemData = Object.entries(player.value.equip)[oldCol][1];
        itemData.equip = false;
        // e.target.children[newCol].classList.remove('equip');
        // e.target.children[newCol].classList.add('grid');
      } else {
        // Get the dropped item data
        itemData = JSON.parse(JSON.stringify(player.value.bag[oldCol]));
      }

      // Remove cloned element
      e.target.removeChild(e.target.children[newCol]);
      // const pixelatedBorder = gameStore.pixelatedBorder(
      //   borderSize.value,
      //   newCol,
      //   hoveredIndex.value
      // );

      // Change the style of the column
      // e.target.children[newCol].style.width = dynamicWidth.value + 'px';
      // e.target.children[newCol].style.height = dynamicWidth.value + 'px';
      // e.target.children[newCol].style.boxShadow = pixelatedBorder;
      // Set the context of the column
      // e.target.children[newCol].innerHTML = `<label for="${newCol}">
      // <div class="item" style="font-size:${
      //   Math.floor(windowWidth.value / 100) * 0.9
      // }px">${itemData.name}</div>
      // </label>`;
      e.target.children[newCol].setAttribute('data-type', itemData.type);
      // e.target.children[newCol].setAttribute('data-index', newCol);

      // console.log(e.target.children[newCol].style);

      // Put the item into bag
      // If the index exist
      if (player.value.bag[newCol]) {
        // If the bag is not full
        if (player.value.bag.length < player.value.attribute_limit.bag) {
          const itemToSwap = JSON.parse(
            JSON.stringify(player.value.bag[newCol])
          );
          // Insert the item to the index
          // player.value.bag.splice(col, 0, itemData);
          player.value.bag[newCol] = itemData;
          player.value.bag.push(itemToSwap);
        } else {
          // Drop the item or Put the item back to where it is
          // Display warnning message
        }
      } else {
        // Push the item to the last index
        player.value.bag[newCol] = itemData;
      }

      console.log(player.value.bag);
    },
    // onMove: (e: any) => {
    //   console.log('inventory onMove ', e);
    //   const targettedCol = e.related.dataset.type | e.related.dataset.index;

    //   // Hide the target for now
    //   e.to.children[targettedCol].style.display = 'none';
    // },
    onEnd: (e: any) => {
      console.log('inventory drag end ', e);
      const oldCol = e.oldIndex;
      const newCol = e.newIndex;
      let itemData = {} as item;
      let itemToSwap = {} as item;

      if (e.to.id.includes('equip')) {
        // itemData = Object.entries(player.value.equip)[oldCol][1];
        player.value.bag[oldCol] = {} as item;

        e.target.children[
          oldCol
        ].innerHTML = `<div class="item" style="font-size:${
          Math.floor(windowWidth.value / 100) * 0.9
        }px"></div>`;
        e.target.children[oldCol].setAttribute('data-type', -1);
      } else {
        if (player.value.bag[newCol]) {
          itemToSwap = JSON.parse(JSON.stringify(player.value.bag[newCol]));
        }

        itemData = player.value.bag[oldCol];

        player.value.bag[newCol] = itemData;

        e.target.children[newCol].setAttribute('data-type', itemData.type);

        if (Object.entries(itemToSwap).length) {
          e.target.children[
            oldCol
          ].innerHTML = `<div class="item" style="font-size:${
            Math.floor(windowWidth.value / 100) * 0.9
          }px">${itemData.name}</div>`;
          e.target.children[oldCol].setAttribute('data-type', itemToSwap.type);

          player.value.bag[oldCol] = itemToSwap;
        }
      }

      // const pixelatedBorder = gameStore.pixelatedBorder(
      //   borderSize.value,
      //   newCol,
      //   hoveredIndex.value
      // );

      // // Change the style of the column
      // e.target.children[newCol].style.width = dynamicWidth.value + 'px';
      // e.target.children[newCol].style.height = dynamicWidth.value + 'px';
      // e.target.children[newCol].style.boxShadow = pixelatedBorder;
      // // Set the context of the column
      // e.target.children[newCol].innerHTML = `<label for="${newCol}">
      // <div class="item" style="font-size:${
      //   Math.floor(windowWidth.value / 100) * 0.9
      // }px">${itemData.name}</div>
      // </label>`;

      // e.target.children[newCol].setAttribute('data-index', newCol);

      // console.log(e.target.children[newCol].style);
    },
    onUnchoose: (e: any) => {
      console.log('inventory onUnchoose ', e);
    },
  });
});
</script>

<!-- <style scoped lang="scss">

</style> -->
