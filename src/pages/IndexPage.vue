<template>
  <span id="textLayer" ref="textLayer">{{ textContent }}</span>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useGameStore } from 'src/stores/game';
import * as Phaser from 'phaser';
import { GridEngine } from 'grid-engine';

import Dungeon from '../scene/dungeon';

const gameStore = useGameStore();

const textContent = computed(() => gameStore.getTextContent);

const textLayer = ref<HTMLSpanElement | null>(null);

onMounted(() => {
  console.log('onMounted');

  // const eachWHeight = Math.floor(window.innerHeight / 9);
  // gameStore.windowWidth = 16 * eachWHeight;
  // gameStore.windowHeight = 9 * eachWHeight;
  gameStore.windowWidth = 1280;
  gameStore.windowHeight = 720;

  gameStore.game = new Phaser.Game({
    type: Phaser.AUTO,
    width: gameStore.getWindowWidth,
    height: gameStore.getWindowHeight,
    parent: 'q-app', // Specity the parent container of the game
    pixelArt: true,
    scene: [Dungeon],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0, x: 0 },
        debug: true,
      },
    },
    // plugins: {
    //   scene: [
    //     {
    //       key: 'gridEngine',
    //       plugin: GridEngine,
    //       mapping: 'gridEngine',
    //     },
    //   ],
    // },
  });

  console.log('game :>>>', gameStore.game);

  // Set text layer position
  if (textLayer.value) {
    textLayer.value.style.transform = `translateY(${
      gameStore.getWindowHeight - gameStore.tileSize
    }px)`;
  }
});
</script>

<style lang="scss">
#textLayer {
  height: 0px;
  margin: 0 auto;
  position: absolute;
  color: white;
  font-size: bold;
}
</style>
