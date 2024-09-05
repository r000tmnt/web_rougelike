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
        <div id="hp" ref="hp" class="meter"></div>
        <span>
          {{ playerData?.total_attribute?.hp }}
          /
          {{ playerData?.attribute_limit?.hp }}
        </span>
      </li>
      <li
        :style="`height:${calculateElementStyle()}px; font-size:${Math.floor(
          calculateElementStyle() * 0.75
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
import { watch, ref, computed } from 'vue';
import { player } from '../model/character';

const gameStore = useGameStore();

// const { player, windowWidth } = storeToRefs(gameStore);

const playerData = computed(() => gameStore.getPlayer);

const windowWidth = computed(() => gameStore.getWindowWidth);

const hp = ref<HTMLDivElement | null>(null);

const mp = ref<HTMLDivElement | null>(null);

const getPercentage = (limit: number, current: number) => {
  const each = limit / 100;

  return Math.floor(current / each);
};

const calculateElementStyle = () => {
  return Math.floor(windowWidth.value / 50);
};

const setMeters = (data?: player) => {
  const { total_attribute, attribute_limit } = data ? data : playerData.value;
  if (hp.value) {
    hp.value.style.width = `${getPercentage(
      attribute_limit.hp,
      total_attribute.hp
    )}%`;

    if (hp.value.parentNode) {
      const textHolder = hp.value.parentNode.querySelector('span');

      if (textHolder)
        textHolder.innerText = `${total_attribute.hp} / ${attribute_limit.hp}`;
    }
  }
  if (mp.value) {
    mp.value.style.width = `${getPercentage(
      attribute_limit.mp,
      total_attribute.mp
    )}%`;

    if (mp.value.parentNode) {
      const textHolder = mp.value.parentNode.querySelector('span');

      if (textHolder)
        textHolder.innerText = `${total_attribute.mp} / ${attribute_limit.mp}`;
    }
  }
};

// watch(
//   () => player.value,
//   (newData, oldData) => {
//     console.log('newData', newData);
//     console.log('oldData', oldData);
//     if (newData) {
//       setMeters();
//     }
//   },
//   { deep: true }
// );

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
    background: gray;
  }
}
</style>
