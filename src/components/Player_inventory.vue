<template>
  <section
    class="q-pa-md"
    :style="`font-size:${Math.floor(windowWidth / 100) * 2}px`"
  >
    INVENTORY

    <table class="q-mx-auto" style="width: 80%">
      <tbody>
        <template
          v-for="(row, rowIndex) in playerData.attribute_limit.bag % 5 > 0
            ? playerData.bag.length / 5 + 1
            : playerData.bag.length / 5"
          :key="row"
        >
          <tr>
            <td v-for="(col, colIndex) in 5" :key="col">
              <div class="grid" :data-index="colIndex + rowIndex * 5"></div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { ref, computed } from 'vue';

const gameStore = useGameStore();

const playerData = computed(() => gameStore.getPlayer);

const windowWidth = computed(() => gameStore.getWindowWidth);
</script>
