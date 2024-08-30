<template>
  <section>
    <table v-if="playerData.bag.length">
      <tbody>
        <template
          v-for="(row, rowIndex) in playerData.bag.length % 5 > 0
            ? playerData.bag.length / 5 + 1
            : playerData.bag.length / 5"
          :key="row"
        >
          <tr>
            <td v-for="(col, colIndex) in 5" :key="col">
              <div :data-index="colIndex + rowIndex * 5"></div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <p v-else>EMPTY</p>
  </section>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { ref, computed } from 'vue';

const gameStore = useGameStore();

const playerData = computed(() => gameStore.getPlayer);
</script>
