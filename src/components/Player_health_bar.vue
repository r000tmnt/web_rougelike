<template>
  <div id="caption" class="flex">
    <div class="avatar">
      <!-- <img src="" alt="avatar"> -->
    </div>
    <ul>
      <li
        :style="`height:${calculateElementStyle()}px; font-size:${Math.floor(
          calculateElementStyle() * 0.75
        )}px`"
      >
        <div id="hp" ref="hp" class="meter">
          <span>
            {{ playerData?.base_attribute?.hp + playerData?.add_attribute?.hp }}
            /
            {{ playerData?.attribute_limit?.hp }}
          </span>
        </div>
      </li>
      <li
        :style="`height:${calculateElementStyle()}px; font-size:${Math.floor(
          calculateElementStyle() * 0.75
        )}px`"
      >
        <div id="mp" ref="mp" class="meter">
          <span>
            {{ playerData?.base_attribute?.mp + playerData?.add_attribute?.mp }}
            /
            {{ playerData?.attribute_limit?.mp }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { computed, watch, ref } from 'vue';

const gameStore = useGameStore();

const playerData = computed(() => gameStore.getPlayer);

const windowWidth = computed(() => gameStore.getWindowWidth);

const hp = ref<HTMLDivElement | null>(null);

const mp = ref<HTMLDivElement | null>(null);

watch(
  () => playerData,
  (newData) => {
    if (newData) {
      setMeters();
    }
  },
  { deep: true }
);

const getPercentage = (limit: number, current: number) => {
  const each = Math.floor(limit / 100);

  return Math.floor(current / each);
};

const calculateElementStyle = () => {
  return Math.floor(windowWidth.value / 50);
};

const setMeters = () => {
  const { base_attribute, add_attribute, attribute_limit } = playerData.value;
  if (hp.value) {
    hp.value.style.width = `${getPercentage(
      attribute_limit.hp,
      base_attribute.hp + add_attribute.hp
    )}%`;
  }
  if (mp.value) {
    mp.value.style.width = `${getPercentage(
      attribute_limit.mp,
      base_attribute.mp + add_attribute.mp
    )}%`;
  }
};
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
      div {
        position: relative;
        span {
          position: absolute;
          // margin: 0 auto;
        }
      }
    }
  }

  .meter {
    width: 100%;
    background: gray;
  }
}
</style>
