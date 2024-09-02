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
                  :data-index="colIndex + rowIndex * 10"
                  :style="`width: ${dynamicWidth}px;height: ${dynamicWidth}px; box-shadow: -${borderSize}px 0 0 0 gainsboro, ${borderSize}px 0 0 0 gainsboro, 0 -${borderSize}px 0 0 gainsboro, 0 ${borderSize}px 0 0 gainsboro;`"
                >
                  {{ colIndex + rowIndex * 10 }}
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
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
