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
        <template v-if="playerData.attribute_limit[value]">
          <div class="flex edit">
            <span>
              {{
                `${value}: ${playerData.total_attribute[value]}/${playerData.attribute_limit[value]}`
              }}
            </span>
            <span v-if="playerData.pt > 0 && String(value) !== 'exp'">
              <button @click="addPoint(String(value))">+</button>
            </span>
          </div>
        </template>
        <template v-else>
          <div class="flex edit">
            <span>
              {{ `${value}: ${playerData.total_attribute[value]}` }}
            </span>
            <span v-if="playerData.pt > 0">
              <button @click="addPoint(String(value))">+</button>
            </span>
          </div>
        </template>
      </li>
      <li>STAT: {{ playerData.status }}</li>
      <li>EXP: {{ playerData.exp }} / {{ playerData.attribute_limit.exp }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { player } from '../model/character';
import { useGameStore } from 'src/stores/game';

const props = defineProps({
  playerData: {
    type: Object,
    default: {} as player,
  },
});

const gameStore = useGameStore();

const addPoint = (attribute: string) => {
  const copy = JSON.parse(JSON.stringify(props.playerData));

  copy.base_attribute[attribute] += 1;
  copy.total_attribute[attribute] += 1;

  if (attribute === 'hp' || attribute === 'mp') {
    copy.attribute_limit[attribute] += 1;
  }

  copy.pt -= 1;

  gameStore.setPlayerStatus(copy);
  // Change the reference of player data object
  gameStore.emitter.emit('player-update', copy);
};
</script>

<style scoped lang="scss">
.edit {
  span:nth-child(1) {
    margin-right: auto;
  }
}
</style>
