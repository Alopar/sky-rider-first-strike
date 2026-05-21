import { gameConfig } from '../config/game-config.js';
import { weapons } from '../config/weapons.js';
import { PlayerBullet, EnemyBullet } from '../entities/Bullets.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

const MAX_LEVEL = Object.keys(weapons).length;

export class WeaponSystem {
  constructor(scene, layerManager) {
    this.scene = scene;
    this.lm = layerManager;
    this.level = 1;
    this.lastFired = 0;
    this.overdriveUntil = 0;

    this._onEnemyFire = (x, y, vx, vy, style) => this.spawnEnemyBullet(x, y, vx, vy, style);
    this._onHpLost = () => this.downgrade();
    this._onPlayerDead = () => {
      this.overdriveUntil = 0;
    };

    EventBus.on(EVT.ENEMY_FIRE, this._onEnemyFire, this);
    EventBus.on(EVT.PLAYER_HP_LOST, this._onHpLost, this);
    EventBus.on(EVT.PLAYER_DEAD, this._onPlayerDead, this);
  }

  destroy() {
    EventBus.off(EVT.ENEMY_FIRE, this._onEnemyFire, this);
    EventBus.off(EVT.PLAYER_HP_LOST, this._onHpLost, this);
    EventBus.off(EVT.PLAYER_DEAD, this._onPlayerDead, this);
  }

  getLevel() {
    return this.level;
  }

  setLevel(level) {
    this.level = Phaser.Math.Clamp(level, 1, MAX_LEVEL);
    EventBus.emit(EVT.WEAPON_LEVEL_CHANGED, this.level);
  }

  upgrade(time) {
    if (this.level < MAX_LEVEL) {
      this.setLevel(this.level + 1);
      return;
    }
    this.activateOverdrive(time);
  }

  downgrade() {
    if (this.level <= 1) return;
    this.overdriveUntil = 0;
    this.setLevel(this.level - 1);
  }

  activateOverdrive(time) {
    const duration = gameConfig.weapon.overdrive.durationMs;
    this.overdriveUntil = time + duration;
  }

  isOverdriveActive(time) {
    return time < this.overdriveUntil;
  }

  getFireRateMultiplier(time) {
    return this.isOverdriveActive(time) ? gameConfig.weapon.overdrive.fireRateMultiplier : 1;
  }

  getEffectiveCooldown(time) {
    const config = weapons[this.level];
    return config.cooldown / this.getFireRateMultiplier(time);
  }

  spawnPlayerBullet(x, y, vx, vy, piercing = false) {
    const group = this.lm.getGroup('playerBullets');
    let bullet = group.getFirstDead(false);
    if (!bullet) {
      bullet = new PlayerBullet(this.scene, x, y);
      group.add(bullet);
    }
    bullet.fire(x, y, vx, vy, { piercing });
    if (vx !== 0 || vy !== 0) {
      bullet.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
    }
    return bullet;
  }

  tryFire(player, time) {
    const config = weapons[this.level];
    const cooldown = this.getEffectiveCooldown(time);
    if (time <= this.lastFired + cooldown) return;

    this.lastFired = time;
    const dy = Math.round(10 * gameConfig.worldScale);
    const spawnY = player.y - dy;
    const spawnX = player.x;
    const piercing = config.piercing ?? false;
    const shots = config.shots ?? [];

    for (const shot of shots) {
      let angleDeg = 0;
      let offsetX = 0;

      if (shot.type === 'parallel') {
        angleDeg = 0;
        offsetX = shot.offsetX ?? 0;
      } else if (shot.type === 'angled') {
        angleDeg = shot.angleDeg ?? 0;
        offsetX = 0;
      }

      const rad = Phaser.Math.DegToRad(angleDeg - 90);
      const vx = Math.cos(rad) * config.speed;
      const vy = Math.sin(rad) * config.speed;
      this.spawnPlayerBullet(spawnX + offsetX, spawnY, vx, vy, piercing);
    }
  }

  /** direction: -1 влево, +1 вправо */
  fireHorizontalShot(x, y, direction, speed) {
    const vx = direction * speed;
    this.spawnPlayerBullet(x, y, vx, 0, false);
  }

  /**
   * Радиальный залп player_bullet (бонус «осколок»).
   */
  fireFragmentBurst(x, y, effect) {
    const count = effect.bulletCount ?? 12;
    const speed = effect.speed ?? 550 * gameConfig.worldScale;
    const spreadDeg = effect.spreadDeg ?? 360;
    const startAngleDeg = effect.startAngleDeg ?? 0;
    const spreadRad = Phaser.Math.DegToRad(spreadDeg);
    const startRad = Phaser.Math.DegToRad(startAngleDeg);
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / count : 0;
      const rad = startRad + spreadRad * t;
      const vx = Math.cos(rad) * speed;
      const vy = Math.sin(rad) * speed;
      this.spawnPlayerBullet(x, y, vx, vy, false);
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
