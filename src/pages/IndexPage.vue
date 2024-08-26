<template>
  <span id="textLayer" ref="textLayer">{{ textContent }}</span>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useGameStore } from 'src/stores/game';
// import { GridEngine } from 'grid-engine';
import PhaserRaycaster from 'phaser-raycaster';
import { PhaserNavMeshPlugin } from 'phaser-navmesh';
import Dungeon from '../scene/dungeon';

const gameStore = useGameStore();

const textContent = computed(() => gameStore.getTextContent);

const textLayer = ref<HTMLSpanElement | null>(null);

onMounted(() => {
  console.log('onMounted');

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
    plugins: {
      scene: [
        {
          key: 'PhaserRaycaster',
          plugin: PhaserRaycaster,
          mapping: 'raycasterPlugin',
        },
        {
          key: 'PhaserNavMeshPlugin', // Key to store the plugin class under in cache
          plugin: PhaserNavMeshPlugin, // Class that constructs plugins
          mapping: 'navMeshPlugin', // Property mapping to use for the scene, e.g. this.navMeshPlugin
          start: true,
        },
        //     {
        //       key: 'gridEngine',
        //       plugin: GridEngine,
        //       mapping: 'gridEngine',
        //     },
      ],
    },
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
