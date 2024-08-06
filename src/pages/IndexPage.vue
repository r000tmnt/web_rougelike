<template>
  <span style="display: none; height: 0px">Placeholder</span>
</template>

<script setup lang="ts">
'components/ExampleComponent.vue';
import { onMounted } from 'vue';
import { useGameStore } from 'src/stores/game';
import * as Phaser from 'phaser';

import Dungeon from '../scene/dungeon';

const gameStore = useGameStore();

// gameStore.setLevelContent();

onMounted(() => {
  console.log('onMounted');

  const eachWHeight = Math.floor(window.innerHeight / 9);

  gameStore.game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 16 * eachWHeight,
    height: 9 * eachWHeight,
    parent: 'q-app', // Specity the parent container of the game
    scene: [Dungeon],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0, x: 0 },
        // debug: false,
      },
    },
  });

  // if(gameStore.game.scene !== undefined){}
});
</script>
