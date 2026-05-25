import { enemiesConfig, resolveEnemyType } from '../config/enemies.js';
import { Enemy } from '../entities/enemies/Enemy.js';

export class EnemyFactory {
  constructor(scene, layerManager, enemiesMap = enemiesConfig) {
    this.scene = scene;
    this.lm = layerManager;
    this.enemiesConfig = enemiesMap;
  }

  spawn(typeId, x, y, options = {}) {
    const resolvedId = resolveEnemyType(typeId);
    const config = this.enemiesConfig[resolvedId];
    if (!config) return null;

    const group = this.lm.getGroup(config.layer);

    let enemy = group.getFirstDead(false);
    if (!enemy) {
      enemy = new Enemy(this.scene, config, group);
    } else {
      enemy.enemyConfig = config;
      enemy.setTexture(config.textureKey);
    }

    enemy.setDepth(Enemy.depthForLayer(config.layer));
    enemy.syncBodyFromConfig();
    enemy.spawn(x, y, options);
    return enemy;
  }
}
