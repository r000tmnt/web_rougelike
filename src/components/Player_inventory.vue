<template>
  <section
    class="q-pa-md"
    :style="`font-size:${Math.floor(windowWidth / 100) * 2}px`"
  >
    INVENTORY

    <div class="hide-scrollbar scroll" style="height: 90%">
      <table class="q-mx-auto" style="width: 80vw">
        <tbody>
          <template v-for="(row, rowIndex) in rows" :key="row">
            <tr>
              <td v-for="(col, colIndex) in 10" :key="col">
                <div
                  class="grid rounded-borders"
                  :style="`width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: ${pixelatedBorder(
                    borderSize
                  )}`"
                  @mouseover="
                    (e) => getItemPosition(e, colIndex + rowIndex * 10)
                  "
                  @mouseleave="showDesc = false"
                >
                  {{ colIndex + rowIndex * 10 }}
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <template v-if="showDesc">
      <div
        id="desc"
        class="absolute bg-dark grid"
        :style="`width: ${
          dynamicWidth * 2
        }px;top:0;box-shadow: ${pixelatedBorder(
          borderSize
        )};${descElementPosition}`"
      >
        DESC
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

const showDesc = ref<boolean>(false);

const pixelatedBorder = (size: number) => {
  return `-${size}px 0 0 0 gainsboro, ${size}px 0 0 0 gainsboro, 0 -${size}px 0 0 gainsboro, 0 ${size}px 0 0 gainsboro;`;
};

const getItemPosition = (e: MouseEvent, index: number) => {
  console.log(e);

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
  showDesc.value = true;
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
