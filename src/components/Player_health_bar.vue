<template>
  <div id="caption" class="flex">
    <div class="avatar">
      <!-- <img src="" alt="avatar"> -->
    </div>
    <ul>
      <li
        :style="`height:${calculateElementStyle}px; font-size:${Math.floor(
          calculateElementStyle * 0.75
        )}px`"
      >
        <div id="hp" ref="hp" class="meter"></div>
        <span>
          {{ playerData?.total_attribute?.hp }}
          /
          {{ playerData?.attribute_limit?.hp }}
        </span>
      </li>
      <li
        :style="`height:${calculateElementStyle}px; font-size:${Math.floor(
          calculateElementStyle * 0.75
        )}px`"
      >
        <div id="mp" ref="mp" class="meter"></div>
        <span>
          {{ playerData?.total_attribute?.mp }}
          /
          {{ playerData?.attribute_limit?.mp }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
// import { storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { player } from '../model/character';

const gameStore = useGameStore();

const playerData = computed(() => gameStore.getPlayer);

const windowWidth = computed(() => gameStore.getWindowWidth);

const hp = ref<HTMLDivElement | null>(null);

const mp = ref<HTMLDivElement | null>(null);

const calculateElementStyle = computed(() =>
  Math.floor(windowWidth.value / 50)
);

const setMeters = (data: player) => {
  if (Object.entries(data).length) {
    const { total_attribute, attribute_limit } = data;
    if (hp.value) {
      hp.value.style.width = `${
        (total_attribute.hp / attribute_limit.hp) * 100
      }%`;
    }
    if (mp.value) {
      mp.value.style.width = `${
        (total_attribute.mp / attribute_limit.mp) * 100
      }%`;
    }
  }
};

gameStore.emitter.on('player-attribute-change', (data: player) => {
  setMeters(data);
});
</script>

<style scoped lang="scss">
#caption {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 20%;
  padding: 1%;

  #hp {
    background-color: red;
    height: 100%;
  }

  #mp {
    background-color: blue;
    height: 100%;
  }

  ul {
    li {
      background: gray;
      position: relative;
      div,
      span {
        position: absolute;
      }
      span {
        z-index: 10;
      }
    }
  }

  .meter {
    width: 100%;
    transition: width 0.3s;
  }
}
</style>
