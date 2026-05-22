import { gameConfig } from './game-config.js';

const S = gameConfig.worldScale;
const D = gameConfig.debris;

/** Псевдотипы волн: случайный вариант из списка */
export const DEBRIS_WAVE_TYPES = {
  debrisLarge: ['debrisLargeRock', 'debrisLargeChunk', 'debrisLargeShard'],
  debrisSmall: ['debrisSmallRock', 'debrisSmallChunk', 'debrisSmallShard'],
  debrisMega: ['debrisMegaCharge']
};

export function resolveEnemyType(typeId) {
  const variants = DEBRIS_WAVE_TYPES[typeId];
  if (variants) {
    return variants[Phaser.Math.Between(0, variants.length - 1)];
  }
  return typeId;
}

const debrisBase = {
  layer: 'debrisEnemies',
  behavior: 'debrisDrift',
  enemyKind: 'trash',
  speedVariance: D.speedVariance,
  splitAngleRad: D.splitAngleRad
};

export const enemiesConfig = {
  orb: {
    id: 'orb',
    spawnZone: 'main',
    textureKey: 'enemy_orb',
    hp: 1,
    score: 10,
    speed: 110 * S,
    layer: 'fgEnemies',
    behavior: 'straightDown',
    hitboxRadius: 9 * S,
    colors: { body: '#D63A3A', stroke: '#FF6B6B' }
  },
  wobbler: {
    id: 'wobbler',
    spawnZone: 'main',
    textureKey: 'enemy_wobbler',
    hp: 1,
    score: 15,
    speed: 130 * S,
    layer: 'fgEnemies',
    behavior: 'smoothSway',
    swayFreq: 0.0012,
    swayAmp: 55 * S,
    hitboxRadius: 10 * S,
    colors: { body: '#C42E2E', stroke: '#FF6B6B' }
  },
  bastion: {
    id: 'bastion',
    spawnZone: 'main',
    textureKey: 'enemy_bastion',
    hp: 5,
    score: 80,
    speed: 55 * S,
    layer: 'fgEnemies',
    behavior: 'straightDown',
    facingDown: true,
    hitboxRect: { w: 26 * S, h: 38 * S },
    fireRate: 2200,
    fireMode: 'aimPlayer',
    bulletStyle: 'round',
    bulletSpeed: 200 * S,
    fireOffsetY: 10,
    colors: { body: '#8B2222', stroke: '#FF6B6B' }
  },
  dreadnought: {
    id: 'dreadnought',
    spawnZone: 'main',
    textureKey: 'enemy_dreadnought',
    hp: 12,
    score: 120,
    speed: 48 * S,
    layer: 'fgEnemies',
    behavior: 'straightDown',
    facingDown: true,
    hitboxRect: { w: 28 * S, h: 76 * S },
    fireRate: 3400,
    fireMode: 'burstForward',
    bulletStyle: 'round',
    bulletSpeed: 210 * S,
    burstSalvos: 3,
    burstSalvoSize: 3,
    burstSalvoDelayMs: 160,
    burstSpreadRad: 0.14,
    firePoints: [
      { x: -8 * S, y: 22 * S },
      { x: 0, y: 44 * S },
      { x: 8 * S, y: 66 * S }
    ],
    colors: { body: '#7A1E1E', stroke: '#FF6B6B' }
  },
  drifter: {
    id: 'drifter',
    textureKey: 'enemy_drifter',
    hp: 1,
    score: 5,
    speed: 52 * S,
    layer: 'bgEnemies',
    behavior: 'straightDown',
    spinInFlight: true,
    spinRadPerSec: 1.3,
    bonusDropChanceBonus: 0.05,
    hitboxRect: { w: 10 * S, h: 10 * S },
    colors: { body: '#8A4A18', stroke: '#FFB07A' }
  },
  hauler: {
    id: 'hauler',
    textureKey: 'enemy_hauler',
    hp: 30,
    score: 90,
    speed: 62 * S,
    layer: 'bgEnemies',
    spawnZone: 'side',
    behavior: 'straightDown',
    facingDown: true,
    guaranteedBonusDrop: true,
    hitboxRect: { w: 22 * S, h: 36 * S },
    colors: { body: '#5C3010', stroke: '#C6864A' }
  },
  striker: {
    id: 'striker',
    spawnZone: 'main',
    textureKey: 'enemy_striker',
    hp: 2,
    score: 30,
    speed: 150 * S,
    layer: 'fgEnemies',
    behavior: 'striker',
    rotateInFlight: true,
    hitboxRadius: 12 * S,
    fireRate: 1500,
    fireMode: 'down',
    bulletSpeed: 300 * S,
    colors: { body: '#D63A3A', stroke: '#FF6B6B' }
  },
  rammer: {
    id: 'rammer',
    textureKey: 'enemy_rammer',
    hp: 1,
    score: 25,
    speed: 220 * S,
    layer: 'fgEnemies',
    behavior: 'glidePast',
    rotateInFlight: true,
    hitboxRadius: 11 * S,
    colors: { body: '#4a2550', stroke: '#c080e8' }
  },
  debrisMegaCharge: {
    ...debrisBase,
    id: 'debrisMegaCharge',
    stage: 'mega',
    splitMode: 'radial',
    textureKey: 'enemy_debris_mega_charge',
    hp: 15,
    score: 1,
    speed: 58 * S,
    hitboxRadius: 20 * S,
    colors: { body: '#6E7888', stroke: '#5C6675', charge: '#D63A3A', warn: '#FFD23F' }
  },
  debrisLargeRock: {
    ...debrisBase,
    id: 'debrisLargeRock',
    stage: 'large',
    textureKey: 'enemy_debris_large_rock',
    splitsInto: 'debrisSmallRock',
    hp: 5,
    score: 1,
    speed: 78 * S,
    hitboxRadius: 14 * S,
    colors: { body: '#7A8494', stroke: '#5C6675', crater: '#2E3540' }
  },
  debrisLargeChunk: {
    ...debrisBase,
    id: 'debrisLargeChunk',
    stage: 'large',
    textureKey: 'enemy_debris_large_chunk',
    splitsInto: 'debrisSmallChunk',
    hp: 5,
    score: 1,
    speed: 72 * S,
    hitboxRadius: 13 * S,
    colors: { body: '#6E7888', stroke: '#5C6675', crater: '#2E3540' }
  },
  debrisLargeShard: {
    ...debrisBase,
    id: 'debrisLargeShard',
    stage: 'large',
    textureKey: 'enemy_debris_large_shard',
    splitsInto: 'debrisSmallShard',
    hp: 5,
    score: 1,
    speed: 85 * S,
    hitboxRadius: 12 * S,
    colors: { body: '#848F9E', stroke: '#5C6675', crater: '#2E3540' }
  },
  debrisSmallRock: {
    ...debrisBase,
    id: 'debrisSmallRock',
    stage: 'small',
    textureKey: 'enemy_debris_small_rock',
    hp: 1,
    score: 1,
    speed: 95 * S,
    hitboxRadius: 7 * S,
    colors: { body: '#7A8494', stroke: '#5C6675', crater: '#2E3540' }
  },
  debrisSmallChunk: {
    ...debrisBase,
    id: 'debrisSmallChunk',
    stage: 'small',
    textureKey: 'enemy_debris_small_chunk',
    hp: 1,
    score: 1,
    speed: 90 * S,
    hitboxRadius: 6 * S,
    colors: { body: '#6E7888', stroke: '#5C6675', crater: '#2E3540' }
  },
  debrisSmallShard: {
    ...debrisBase,
    id: 'debrisSmallShard',
    stage: 'small',
    textureKey: 'enemy_debris_small_shard',
    hp: 1,
    score: 1,
    speed: 100 * S,
    hitboxRadius: 6 * S,
    colors: { body: '#848F9E', stroke: '#5C6675', crater: '#2E3540' }
  }
};
