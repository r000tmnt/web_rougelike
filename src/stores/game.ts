import Phaser from 'phaser';
import { defineStore } from 'pinia';
import Dungeon from 'src/utils/dungeonGenerator';

export const useGameStore = defineStore('game', {
  state: () => ({
    game: {},
    player: {},
    level: {},
  }),

  getters: {
    getGameContent: (state) => state.game,
  },

  actions: {
    setGameContent(phaserGame: Phaser.Game) {
      this.game = phaserGame;
    },

    setLevelContent() {
      new Dungeon();
    },
  },
});
