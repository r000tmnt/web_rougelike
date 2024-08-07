import { defineStore } from 'pinia';
// import Dungeon from 'src/utils/dungeonGenerator';

export const useGameStore = defineStore('game', {
  state: () => ({
    game: {},
    player: {},
    level: {},
    windowWidth: 0,
    windowHeight: 0,
  }),

  getters: {
    getGameContent: (state) => state.game,
    getWindowWidth: (state) => state.windowWidth,
    getWindowHeight: (state) => state.windowHeight,
  },

  actions: {
    setGameContent(phaserGame: Phaser.Game) {
      this.game = phaserGame;
    },

    setLevelContent() {
      // new Dungeon();
    },
  },
});
