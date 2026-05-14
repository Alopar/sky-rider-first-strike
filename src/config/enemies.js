export const enemiesConfig = {
  drifter: {
    id: 'drifter',
    textureKey: 'enemy_drifter',
    hp: 1,
    score: 10,
    speed: 100,
    layer: 'bgEnemies',
    behavior: 'straightDown',
    radius: 12,
    hitboxRadius: 10,
    colors: { body: '#B85A1F', stroke: '#FFB07A' }
  },
  striker: {
    id: 'striker',
    textureKey: 'enemy_striker',
    hp: 2,
    score: 30,
    speed: 150,
    layer: 'fgEnemies',
    behavior: 'striker',
    radius: 16,
    hitboxRadius: 12,
    fireRate: 1500,
    bulletSpeed: 300,
    colors: { body: '#D63A3A', stroke: '#FF6B6B' }
  }
};
