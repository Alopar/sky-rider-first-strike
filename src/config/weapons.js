import { gameConfig } from './game-config.js';

const S = gameConfig.worldScale;
/** Расстояние между параллельными пулями в «пачке» (не веер) */
const PARALLEL_SPACING = 5 * S;
const SIDE_SPREAD_1 = 18;
const SIDE_SPREAD_2 = 28;
const BULLET_SPEED = 600 * S;
const BULLET_COOLDOWN = 200;

/** Три параллельно вверх + боковые под углом */
const LEVEL_3_SHOTS = [
  { type: 'parallel', offsetX: -PARALLEL_SPACING },
  { type: 'parallel', offsetX: 0 },
  { type: 'parallel', offsetX: PARALLEL_SPACING },
  { type: 'angled', angleDeg: -SIDE_SPREAD_1 },
  { type: 'angled', angleDeg: SIDE_SPREAD_1 }
];

/** Три параллельно + четыре боковых (по два с каждой стороны) */
const LEVEL_4_SHOTS = [
  { type: 'parallel', offsetX: -PARALLEL_SPACING },
  { type: 'parallel', offsetX: 0 },
  { type: 'parallel', offsetX: PARALLEL_SPACING },
  { type: 'angled', angleDeg: -SIDE_SPREAD_2 },
  { type: 'angled', angleDeg: -SIDE_SPREAD_1 },
  { type: 'angled', angleDeg: SIDE_SPREAD_1 },
  { type: 'angled', angleDeg: SIDE_SPREAD_2 }
];

export const weapons = {
  1: {
    mode: 'bullets',
    shots: [{ type: 'parallel', offsetX: 0 }],
    speed: BULLET_SPEED,
    cooldown: BULLET_COOLDOWN
  },
  2: {
    mode: 'bullets',
    shots: [
      { type: 'parallel', offsetX: -PARALLEL_SPACING },
      { type: 'parallel', offsetX: PARALLEL_SPACING }
    ],
    speed: BULLET_SPEED,
    cooldown: BULLET_COOLDOWN
  },
  3: {
    mode: 'bullets',
    shots: LEVEL_3_SHOTS,
    speed: BULLET_SPEED,
    cooldown: BULLET_COOLDOWN
  },
  4: {
    mode: 'bullets',
    shots: LEVEL_4_SHOTS,
    speed: BULLET_SPEED,
    cooldown: BULLET_COOLDOWN
  },
  5: {
    mode: 'bullets',
    shots: LEVEL_4_SHOTS,
    speed: BULLET_SPEED,
    cooldown: BULLET_COOLDOWN,
    piercing: true
  }
};
