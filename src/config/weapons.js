import { gameConfig } from './game-config.js';

const S = gameConfig.worldScale;
const SIDE1 = 18;
const SIDE2 = 28;

const LEVEL_4_ANGLES = [-SIDE2, -SIDE1, 0, 0, 0, SIDE1, SIDE2];
const BULLET_SPEED = 600 * S;
const BULLET_COOLDOWN = 200;

export const weapons = {
  1: { mode: 'bullets', angles: [0], speed: BULLET_SPEED, cooldown: BULLET_COOLDOWN },
  2: { mode: 'bullets', angles: [-5, 5], speed: BULLET_SPEED, cooldown: BULLET_COOLDOWN },
  3: { mode: 'bullets', angles: [-SIDE1, 0, 0, 0, SIDE1], speed: BULLET_SPEED, cooldown: BULLET_COOLDOWN },
  4: { mode: 'bullets', angles: [...LEVEL_4_ANGLES], speed: BULLET_SPEED, cooldown: BULLET_COOLDOWN },
  5: {
    mode: 'bullets',
    angles: [...LEVEL_4_ANGLES],
    speed: BULLET_SPEED,
    cooldown: BULLET_COOLDOWN,
    piercing: true
  }
};
