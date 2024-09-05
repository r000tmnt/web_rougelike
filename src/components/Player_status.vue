<template>
  <div class="status_header">
    <div class="flex">
      <div>NAME</div>
      <div class="q-ml-auto">LV {{ playerData.lv }}</div>
    </div>
    <div class="flex">
      <div>
        <!-- CLASS -->
        {{ playerData.class }}
      </div>

      <div class="q-ml-auto">PT: {{ playerData.pt }}</div>
    </div>
  </div>

  <div class="status">
    <ul>
      <li v-for="(key, value) in playerData.base_attribute" :key="value">
        {{ value }}:
        <template
          v-if="
            String(value) === 'hp' ||
            String(value) === 'mp' ||
            String(value) === 'exp'
          "
        >
          {{ playerData.total_attribute[value] }}
          /
          {{ playerData.attribute_limit[value] }}
        </template>
        <template v-else>
          {{ playerData.total_attribute[value] }}
        </template>
      </li>
      <li>STAT: {{ playerData.status }}</li>
      <li>EXP: {{ playerData.exp }} / {{ playerData.attribute_limit.exp }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { player } from '../model/character';

defineProps({
  playerData: {
    type: Object,
    default: {} as player,
  },
});
</script>
