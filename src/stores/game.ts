import { defineStore } from 'pinia';
import { player, enemy, base_attribute } from 'src/model/character';

export const useGameStore = defineStore('game', {
  state: () => ({
    game: {},
    player: {} as player,
    enemy: [[], [], [], [], [], [], [], [], []] as enemy[][],
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
    getPlayer: (state) => state.player,
  },

  actions: {
    setGameContent(phaserGame: Phaser.Game) {
      this.game = phaserGame;
    },

    setTextContent(content: string) {
      this.textContent = content;
    },

    setPlayerStatus() {
      this.player = {
        lv: 1,
        name: 'Player',
        class: 'Swordsman',
        status: 'Normal',
        base_attribute: {
          hp: 10,
          mp: 5,
          str: 5,
          def: 3,
          int: 3,
          spd: 3,
          luck: 2,
        },
        add_attribute: {
          hp: 0,
          mp: 0,
          str: 0,
          def: 0,
          int: 0,
          spd: 0,
          luck: 0,
        },
        attribute_limit: {
          hp: 10,
          mp: 5,
          exp: 100,
          bag: 200,
        },
        equip: {
          head: {},
          body: {},
          hand: {},
          feet: {},
          accasory: {},
        },
        exp: 0,
        pt: 0,
        bag: [],
      };

      // for (const [key] of Object.entries(this.player.base_attribute)) {
      //   this.player.add_attribute[key as keyof base_attribute] =
      //     this.player.add_attribute[key as keyof base_attribute] +
      //     this.player.base_attribute[key as keyof base_attribute];
      // }
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
  },
});
