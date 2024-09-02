<template>
  <section
    class="q-pa-md"
    :style="`font-size:${Math.floor(windowWidth / 100) * 2}px`"
  >
    <div class="flex q-mt-md q-mb-lg">
      <div class="text-h5">INVENTORY</div>
      <div id="filters" class="q-ml-auto flex">
        <span>E</span>
        <span>C</span>
        <span>M</span>
        <span>S</span>
      </div>
    </div>

    <div class="hide-scrollbar scroll" style="height: 90%">
      <table class="q-mx-auto" style="width: 80vw">
        <tbody>
          <template v-for="(row, rowIndex) in rows" :key="row">
            <tr>
              <td v-for="(col, colIndex) in 10" :key="col">
                <div
                  class="grid rounded-borders"
                  :style="`width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${pixelatedBorder(
                    borderSize,
                    colIndex + rowIndex * 10
                  )}`"
                  @mouseover="
                    (e) => getItemPosition(e, colIndex + rowIndex * 10)
                  "
                  @mouseleave="showDesc = -1"
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

    <template v-if="showDesc >= 0">
      <div
        id="desc"
        class="absolute bg-dark grid"
        :style="`width: ${
          dynamicWidth * 2
        }px;top:0;box-shadow: ${pixelatedBorder(
          borderSize
        )};${descElementPosition}`"
      >
        <img
          class="q-mx-auto"
          src=""
          alt="image"
          :style="`width: ${gameStore.tileSize}px; height: ${gameStore.tileSize}px`"
        />
        <ul>
          <li>DESC</li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { ref, computed, onMounted } from 'vue';

const gameStore = useGameStore();

const playerData = computed(() => gameStore.getPlayer);

const windowWidth = computed(() => gameStore.getWindowWidth);

const rows = ref<number>(0);

const dynamicWidth = ref<number>(0);

const borderSize = ref<number>(0);

const descElementPosition = ref<string>('');

const showDesc = ref<number>(-1);

const activeFilter = ref<number[]>([]);

const pixelatedBorder = (size: number, index?: number) => {
  return `-${size}px 0 0 0 ${
    showDesc.value === index ? 'white' : '#424242'
  }, ${size}px 0 0 0 ${
    showDesc.value === index ? 'white' : '#424242'
  }, 0 -${size}px 0 0 ${
    showDesc.value === index ? 'white' : '#424242'
  }, 0 ${size}px 0 0 ${showDesc.value === index ? 'white' : '#424242'};`;
};

const getItemPosition = (e: MouseEvent, index: number) => {
  // console.log(e);

  // Check item index
  if ((index + 1) % 10 > 0) {
    descElementPosition.value = `transform: translate(${e.clientX}px, ${
      e.clientY >= 500 ? e.clientY - dynamicWidth.value * 2 : e.clientY
    }px)`;
  } else {
    descElementPosition.value = `transform: translate(${
      e.clientX - dynamicWidth.value * 2
    }px, ${
      e.clientY >= 500 ? e.clientY - dynamicWidth.value * 2 : e.clientY
    }px)`;
  }

  // Get item data

  // Display the information
  showDesc.value = index;
};

onMounted(() => {
  rows.value =
    playerData.value.attribute_limit.bag % 10 > 0
      ? playerData.value.attribute_limit.bag / 10 + 1
      : playerData.value.attribute_limit.bag / 10;

  // console.log(rows.value);
  dynamicWidth.value = (Math.floor(windowWidth.value / 100) * 80) / 10;
  borderSize.value = Math.floor(dynamicWidth.value / 40);
});
</script>
