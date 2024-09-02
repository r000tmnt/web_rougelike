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
                  :style="`width: ${
                    (Math.floor(windowWidth / 100) * 80) / 10
                  }px;height: ${(Math.floor(windowWidth / 100) * 80) / 10}px`"
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

onMounted(() => {
  rows.value =
    playerData.value.attribute_limit.bag % 10 > 0
      ? playerData.value.attribute_limit.bag / 10 + 1
      : playerData.value.attribute_limit.bag / 10;

  console.log(rows.value);
});
</script>
