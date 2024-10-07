<template>
  <span id="textLayer" ref="textLayer">{{ textContent }}</span>
  <Player_health_bar v-if="currentScene === 2" />
  <Player_inventory v-if="currentScene > 0 && openInventory" />
  <Player_status v-if="currentScene > 0 && openStatus" />
  <Player_game_over v-if="gameOver" />
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useGameStore } from 'src/stores/game';
// import { GridEngine } from 'grid-engine';
import PhaserRaycaster from 'phaser-raycaster';
import { PhaserNavMeshPlugin } from 'phaser-navmesh';
import Dungeon from '../scene/dungeon';

// Components
import Player_health_bar from 'src/components/Player_health_bar.vue';
import Player_inventory from 'src/components/Player_inventory.vue';
import Player_status from 'src/components/Player_status.vue';
import Player_game_over from 'src/components/Player_game_over.vue';

const gameStore = useGameStore();

const textContent = computed(() => gameStore.getTextContent);

const currentScene = computed(() => gameStore.getCurrentScene);

const openInventory = computed(() => gameStore.getOpenInventory);

const openStatus = computed(() => gameStore.getOpenStatus);

const gameOver = computed(() => gameStore.getGameOver);

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

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    // console.log(e);
    // Open or close inventory
    if (e.key === 'i' && gameStore.currentScene > 0) {
      if (gameStore.openInventory) {
        gameStore.resumeGame();
      } else {
        gameStore.pauseGame();
      }
      gameStore.setOpenInventory(!gameStore.openInventory);
    }

    // Open or close character status
    if (e.key === 'c' && gameStore.currentScene > 0) {
      if (gameStore.openStatus) {
        gameStore.resumeGame();
      } else {
        gameStore.pauseGame();
      }
      gameStore.setOpenStatus(!gameStore.openStatus);
    }
  });
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
