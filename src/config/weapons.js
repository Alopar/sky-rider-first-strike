import { gameConfig } from './game-config.js';

const S = gameConfig.worldScale;

export const weapons = {
  1: { count: 1, angles: [0], speed: 600 * S, cooldown: 200 },
  2: { count: 2, angles: [-5, 5], speed: 600 * S, cooldown: 200 },
  3: { count: 3, angles: [-15, 0, 15], speed: 600 * S, cooldown: 200 },
  4: { count: 5, angles: [-30, -15, 0, 15, 30], speed: 600 * S, cooldown: 200 },
  5: { count: 6, angles: [-30, -15, 0, 15, 30, 180], speed: 600 * S, cooldown: 200 }
};
