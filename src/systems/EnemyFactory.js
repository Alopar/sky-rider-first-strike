import { enemiesConfig } from '../config/enemies.js';
import { Enemy } from '../entities/enemies/Enemy.js';

export class EnemyFactory {
  constructor(scene, layerManager) {
    this.scene = scene;
    this.lm = layerManager;
  }

  spawn(typeId, x, y) {
    const config = enemiesConfig[typeId];
    if (!config) return null;

    const groupName = config.layer; // 'bgEnemies' or 'fgEnemies'
    const group = this.lm.getGroup(groupName);

    // Simplistic pool
    let enemy = group.getFirstDead(false);
    if (!enemy) {
      enemy = new Enemy(this.scene, config, group);
    } else {
      enemy.enemyConfig = config;
      enemy.setTexture(config.textureKey);
    }

    enemy.setDepth(config.layer === 'bgEnemies' ? 150 : 350);
    enemy.syncBodyFromConfig();
    enemy.spawn(x, y);
    return enemy;
  }
}
