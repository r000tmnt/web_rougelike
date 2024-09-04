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
      <Player_equip v-if="currentSideView === 0" :player-data="playerData" />
      <Player_status v-else :player-data="playerData" />
    </div>

    <div class="col-9">
      <div class="flex q-mt-md q-mb-lg">
        <div class="text-h5">INVENTORY</div>
        <div id="filters" class="q-ml-auto flex">
          <span>E</span>
          <span>C</span>
          <span>M</span>
          <span>S</span>
        </div>
      </div>

      <div
        class="hide-scrollbar"
        :style="`height: calc(90% - ${
          dynamicWidth * 13
        }px);overflow-y: scroll;`"
      >
        <table class="q-mx-auto" style="width: 80%">
          <tbody>
            <template v-for="(row, rowIndex) in rows" :key="row">
              <tr>
                <td v-for="(col, colIndex) in 10" :key="col">
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
        </table>
      </div>

      <Item_desc
        v-if="playerData.bag[hoveredIndex]"
        :dynamic-width="dynamicWidth"
        :desc-element-position="descElementPosition"
        :pixelated-border="gameStore.pixelatedBorder(borderSize, -1, 0)"
        :item-data="playerData.bag[hoveredIndex] || {}"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { ref, computed, onMounted } from 'vue';
import Item_desc from './Item_desc.vue';
import Player_equip from './Player_equip.vue';
import Player_status from './Player_status.vue';

const gameStore = useGameStore();

const playerData = computed(() => gameStore.getPlayer);

const windowWidth = computed(() => gameStore.getWindowWidth);

const dynamicWidth = computed(() => gameStore.getdynamicWidth);

const borderSize = computed(() => gameStore.getborderSize);

const rows = ref<number>(0);

const descElementPosition = ref<string>('');

const hoveredIndex = ref<number>(-1);

const currentSideView = ref<number>(0);

// const activeFilter = ref<number[]>([]);

const getItemPosition = (e: MouseEvent, colIndex: number, rowIndex: number) => {
  console.log(e);

  // Get hovered element position relative to viewport
  const target = e.target as HTMLDivElement;
  const el = target.getBoundingClientRect();
  console.log('target element :>>>', el);

  // Check item index
  if (colIndex < 7) {
    descElementPosition.value = `transform: translate(${
      el.left - Math.floor(windowWidth.value / 4) + dynamicWidth.value
    }px, ${e.clientY >= 500 ? el.top - dynamicWidth.value : el.top}px)`;
  } else {
    descElementPosition.value = `transform: translate(${
      el.left - Math.floor(windowWidth.value / 4) - dynamicWidth.value * 3
    }px, ${e.clientY >= 500 ? el.top - dynamicWidth.value : el.top}px)`;
  }

  // Display the information
  hoveredIndex.value = colIndex + rowIndex * 10;
};

const resetPosition = () => {
  hoveredIndex.value = -1;
};

onMounted(() => {
  rows.value =
    playerData.value.attribute_limit.bag % 10 > 0
      ? playerData.value.attribute_limit.bag / 10 + 1
      : playerData.value.attribute_limit.bag / 10;

  // console.log(rows.value);
  gameStore.setDynamicWidth((Math.floor(windowWidth.value / 100) * 75) / 10);
  gameStore.setBorderSize(Math.floor(dynamicWidth.value / 40));
});
</script>

<!-- <style scoped lang="scss">

</style> -->
