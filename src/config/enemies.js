import { gameConfig } from './game-config.js';

const S = gameConfig.worldScale;

export const enemiesConfig = {
  orb: {
    id: 'orb',
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
  drifter: {
    id: 'drifter',
    textureKey: 'enemy_drifter',
    hp: 1,
    score: 10,
    speed: 100 * S,
    layer: 'bgEnemies',
    behavior: 'straightDown',
    hitboxRadius: 10 * S,
    colors: { body: '#B85A1F', stroke: '#FFB07A' }
  },
  hauler: {
    id: 'hauler',
    textureKey: 'enemy_hauler',
    hp: 4,
    score: 90,
    speed: 62 * S,
    layer: 'bgEnemies',
    behavior: 'slowZigzag',
    rotateInFlight: true,
    zigFreq: 0.0018,
    zigAmp: 38 * S,
    hitboxRect: { w: 22 * S, h: 36 * S },
    colors: { body: '#5C3010', stroke: '#C6864A' }
  },
  striker: {
    id: 'striker',
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
  }
};
