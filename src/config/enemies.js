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
    radius: 12 * S,
    hitboxRadius: 10 * S,
    colors: { body: '#B85A1F', stroke: '#FFB07A' }
  },
  striker: {
    id: 'striker',
    textureKey: 'enemy_striker',
    hp: 2,
    score: 30,
    speed: 150 * S,
    layer: 'fgEnemies',
    behavior: 'striker',
    radius: 16 * S,
    hitboxRadius: 12 * S,
    fireRate: 1500,
    bulletSpeed: 300 * S,
    colors: { body: '#D63A3A', stroke: '#FF6B6B' }
  }
};
