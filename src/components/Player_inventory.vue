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
              <td v-for="(col, colIndex) in 5" :key="col">
                <div
                  class="grid"
                  :data-index="colIndex + rowIndex * 5"
                  :style="`height: ${
                    (Math.floor(windowWidth / 100) * 80) / 5
                  }px`"
                ></div>
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

onMounted(() => {
  rows.value =
    playerData.value.attribute_limit.bag % 5 > 0
      ? playerData.value.attribute_limit.bag / 5 + 1
      : playerData.value.attribute_limit.bag / 5;

  console.log(rows.value);
});
</script>
