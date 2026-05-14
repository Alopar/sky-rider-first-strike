import { gameConfig } from './game-config.js';

const S = gameConfig.worldScale;

export const enemiesConfig = {
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
    zigFreq: 0.0018,
    zigAmp: 38 * S,
    hitboxRect: { w: 46 * S, h: 14 * S },
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
    hitboxRadius: 12 * S,
    fireRate: 1500,
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
    hitboxRadius: 11 * S,
    colors: { body: '#4a2550', stroke: '#c080e8' }
  }
};
