import { defineStore } from 'pinia';
// import Dungeon from 'src/utils/dungeonGenerator';

export const useGameStore = defineStore('game', {
  state: () => ({
    game: {},
    player: {},
    level: {},
    windowWidth: 0,
    windowHeight: 0,
    tileSize: 48,
    textContent: '',
    textIcon: '',
  }),

  getters: {
    getGameContent: (state) => state.game,
    getWindowWidth: (state) => state.windowWidth,
    getWindowHeight: (state) => state.windowHeight,
    getTileSize: (state) => state.tileSize,
    getTextContent: (state) => state.textContent,
    getTextIcon: (state) => state.textIcon,
  },

  actions: {
    setGameContent(phaserGame: Phaser.Game) {
      this.game = phaserGame;
    },

    setTextContent(content: string) {
      this.textContent = content;
    },
  },
});
