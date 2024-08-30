<template>
  <section class="flex">
    <div>
      <div class="status_header flex">
        <span>NAME</span>
        <span>
          <div>LV</div>
          <div>CLASS</div>
        </span>
      </div>
    </div>
    <div>
      <!-- Equip -->
      <ul>
        <li v-for="(key, value) in playerData.equip" :key="key">
          {{ key }} / {{ value }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { ref, computed } from 'vue';

const gameStore = useGameStore();

const playerData = computed(() => gameStore.getPlayer);
</script>
