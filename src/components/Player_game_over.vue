<template>
  <section id="GameOver" class="absolute">
    <div class="bg absolute fit"></div>
    <div class="absolute fit text-center">
      <h1 clss="text-bold">GAME OVER</h1>

      <ul class="text-h4">
        <li @click="restart">Try again</li>
        <li @click="closeGame">Rest</li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { useGameStore } from 'src/stores/game';

const gameStore = useGameStore();

const restart = () => {
  gameStore.setGameOver(false);
  gameStore.emitter.emit('reset');
};

const closeGame = () => {
  window.close();
};
</script>

<style scoped lang="scss">
#GameOver {
  background: transparent;
  .bg {
    background-color: #820000;
    opacity: 0.5;
  }
}
</style>
