<template>
  <section
    class="row q-pa-md"
    :style="`font-size:${Math.floor(windowWidth / 100) * 2}px`"
  >
    <div class="col-4">
      <div class="status_header row">
        <span class="col">NAME</span>
        <span class="col">
          <div>LV</div>
          <div>CLASS</div>
        </span>
      </div>

      <div class="status">
        <ul>
          <li v-for="(key, value) in playerData.base_attribute" :key="value">
            {{ value }}:
            {{
              playerData.base_attribute[value] + playerData.add_attribute[value]
            }}
            /
            {{ playerData.attribute_limit[value] }}
          </li>
          <li>STAT: {{ playerData.status }}</li>
          <li>
            EXP: {{ playerData.exp }} / {{ playerData.attribute_limit.exp }}
          </li>
        </ul>
      </div>
    </div>
    <div class="col-8">
      <!-- Equip -->
      <ul>
        <li v-for="(key, value) in playerData.equip" :key="value">
          {{ value }} / {{ playerData.equip[value] }}
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

const windowWidth = computed(() => gameStore.getWindowWidth);
</script>
