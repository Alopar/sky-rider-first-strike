import { weapons } from '../config/weapons.js';
import { PlayerBullet, EnemyBullet } from '../entities/Bullets.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

export class WeaponSystem {
  constructor(scene, layerManager) {
    this.scene = scene;
    this.lm = layerManager;
    this.level = 1;
    this.lastFired = 0;

    this._onEnemyFire = (x, y, speed) => this.spawnEnemyBullet(x, y, speed);
    EventBus.on(EVT.ENEMY_FIRE, this._onEnemyFire, this);
  }

  destroy() {
    EventBus.off(EVT.ENEMY_FIRE, this._onEnemyFire, this);
  }

  setLevel(level) {
    this.level = Math.min(level, Object.keys(weapons).length);
  }

  tryFire(player, time) {
    const config = weapons[this.level];
    if (time > this.lastFired + config.cooldown) {
      this.lastFired = time;
      
      const group = this.lm.getGroup('playerBullets');
      
      config.angles.forEach(angle => {
        const rad = Phaser.Math.DegToRad(angle - 90);
        const vx = Math.cos(rad) * config.speed;
        const vy = Math.sin(rad) * config.speed;
        
        let bullet = group.getFirstDead(false);
        if (!bullet) {
          bullet = new PlayerBullet(this.scene, player.x, player.y - 10);
          group.add(bullet);
        }
        bullet.fire(player.x, player.y - 10, vx, vy);
      });
    }
  }

  spawnEnemyBullet(x, y, speed) {
    const group = this.lm.getGroup('enemyBullets');
    let bullet = group.getFirstDead(false);
    if (!bullet) {
      bullet = new EnemyBullet(this.scene, x, y + 10);
      group.add(bullet);
    }
    // simple straight down
    bullet.fire(x, y + 10, 0, speed);
  }
}
