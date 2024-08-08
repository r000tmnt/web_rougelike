<template>
  <span style="display: none; height: 0px">Placeholder</span>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStore } from 'src/stores/game';
import * as Phaser from 'phaser';
import { GridEngine } from 'grid-engine';

import Dungeon from '../scene/dungeon';

const gameStore = useGameStore();

// gameStore.setLevelContent();

onMounted(() => {
  console.log('onMounted');

  const eachWHeight = Math.floor(window.innerHeight / 9);
  gameStore.windowWidth = 16 * eachWHeight;
  gameStore.windowHeight = 9 * eachWHeight;

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
        // debug: false,
      },
    },
    plugins: {
      scene: [
        {
          key: 'gridEngine',
          plugin: GridEngine,
          mapping: 'gridEngine',
        },
      ],
    },
  });

  console.log('game :>>>', gameStore.game);
});
</script>
