import { gameConfig } from '../config/game-config.js';
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

    this._onEnemyFire = (x, y, vx, vy, style) => this.spawnEnemyBullet(x, y, vx, vy, style);
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
      
      const dy = Math.round(10 * gameConfig.worldScale);
      config.angles.forEach(angle => {
        const rad = Phaser.Math.DegToRad(angle - 90);
        const vx = Math.cos(rad) * config.speed;
        const vy = Math.sin(rad) * config.speed;
        
        let bullet = group.getFirstDead(false);
        if (!bullet) {
          bullet = new PlayerBullet(this.scene, player.x, player.y - dy);
          group.add(bullet);
        }
        bullet.fire(player.x, player.y - dy, vx, vy);
      });
    }
  }

  /**
   * Радиальный залп player_bullet (бонус «осколок»).
   * @param {number} x
   * @param {number} y
   * @param {{ bulletCount: number, speed: number, spreadDeg?: number, startAngleDeg?: number }} effect
   */
  fireFragmentBurst(x, y, effect) {
    const count = effect.bulletCount ?? 12;
    const speed = effect.speed ?? 550 * gameConfig.worldScale;
    const spreadDeg = effect.spreadDeg ?? 360;
    const startAngleDeg = effect.startAngleDeg ?? 0;
    const spreadRad = Phaser.Math.DegToRad(spreadDeg);
    const startRad = Phaser.Math.DegToRad(startAngleDeg);
    const group = this.lm.getGroup('playerBullets');

    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / count : 0;
      const rad = startRad + spreadRad * t;
      const vx = Math.cos(rad) * speed;
      const vy = Math.sin(rad) * speed;

      let bullet = group.getFirstDead(false);
      if (!bullet) {
        bullet = new PlayerBullet(this.scene, x, y);
        group.add(bullet);
      }
      bullet.fire(x, y, vx, vy);
      if (vx !== 0 || vy !== 0) {
        bullet.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
      }
    }
  }

  spawnEnemyBullet(x, y, vx, vy, style = 'laser') {
    const group = this.lm.getGroup('enemyBullets');
    let bullet = group.getFirstDead(false);
    if (!bullet) {
      bullet = new EnemyBullet(this.scene, x, y);
      group.add(bullet);
    }
    bullet.fire(x, y, vx, vy, style);
  }
}
