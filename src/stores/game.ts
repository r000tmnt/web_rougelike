import { defineStore } from 'pinia';
import { player, enemy, base_attribute } from 'src/model/character';

export const useGameStore = defineStore('game', {
  state: () => ({
    game: {},
    player: {} as player,
    enemy: [[], [], [], [], [], [], [], [], []] as enemy[][],
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    tileSize: 48,
    textContent: '',
    textIcon: '',
    doorIndex: -1,
    currentScene: 0,
    openInventory: false,
    openStatus: false,
  }),

  getters: {
    getGameContent: (state) => state.game,
    getWindowWidth: (state) => state.windowWidth,
    getWindowHeight: (state) => state.windowHeight,
    getTileSize: (state) => state.tileSize,
    getTextContent: (state) => state.textContent,
    getTextIcon: (state) => state.textIcon,
    getPlayer: (state) => state.player,
    getDoorIndex: (state) => state.doorIndex,
    getCurrentScene: (state) => state.currentScene,
    getOpenInventory: (state) => state.openInventory,
    getOpenStatus: (state) => state.openStatus,
  },

  actions: {
    setGameContent(phaserGame: Phaser.Game) {
      this.game = phaserGame;
    },

    setTextContent(content: string) {
      this.textContent = content;
    },

    setPlayerStatus(data: player) {
      this.player = data;
    },

    storeEnemyIntheRoom(enemy: enemy[], index: number) {
      this.enemy[index] = enemy;
    },

    getEnemyIntheRoom(index: number) {
      return this.enemy[index];
    },

    clearEnemyIntheRoom(index: number) {
      this.enemy[index].splice(0);
    },

    setDoorIndex(index: number) {
      this.doorIndex = index;
    },

    setCurrentScene(scene: number) {
      this.currentScene = scene;
    },

    setOpenInventory(value: boolean) {
      this.openInventory = value;
    },

    setOpenStatus(value: boolean) {
      this.openStatus = value;
    },
  },
});
