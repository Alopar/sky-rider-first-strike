import { gameConfig } from '../config/game-config.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

const ENEMY_LAYERS = ['fgEnemies', 'bgEnemies', 'debrisEnemies'];

/**
 * Временный накапливаемый бонус: до maxSpheres сфер по орбите вокруг игрока.
 * Повторный подбор: +1 сфера (до лимита), иначе только обновление таймера.
 */
export class OrbitalSphereBonusSystem {
  constructor(scene, layerManager) {
    this.scene = scene;
    this.layerManager = layerManager;
    this.active = false;
    this.expiresAt = 0;
    this.config = null;
    this.orbitAngle = 0;
    /** @type {{ sprite: Phaser.GameObjects.Image, phaseOffset: number }[]} */
    this.spheres = [];
    this._enemyHitTimes = new WeakMap();

    this._onPlayerDead = () => this.deactivate();
    EventBus.on(EVT.PLAYER_DEAD, this._onPlayerDead, this);
  }

  activate(effect, time) {
    this.config = effect;
    this.expiresAt = time + effect.durationMs;
    this.active = true;

    const max = effect.maxSpheres ?? 3;
    if (this.spheres.length < max) {
      this.addSphere();
    }
  }

  addSphere() {
    const sprite = this.scene.add.image(0, 0, 'player_orbital_sphere').setDepth(398);
    this.spheres.push({ sprite, phaseOffset: 0 });
    this.redistributePhases();
  }

  redistributePhases() {
    const n = this.spheres.length;
    this.spheres.forEach((sphere, i) => {
      sphere.phaseOffset = (Math.PI * 2 * i) / n;
    });
  }

  update(time, player, delta) {
    if (!this.active) return;
    if (!player || !player.active) {
      this.deactivate();
      return;
    }

    if (time >= this.expiresAt) {
      this.deactivate();
      return;
    }

    const cfg = this.config;
    const dtSec = (delta ?? 0) / 1000;
    const angularSpeed = cfg.angularSpeedRad ?? 2.2;
    const radius = cfg.orbitRadius ?? 44 * gameConfig.worldScale;

    this.orbitAngle += angularSpeed * dtSec;

    for (const sphere of this.spheres) {
      const a = this.orbitAngle + sphere.phaseOffset;
      const x = player.x + Math.cos(a) * radius;
      const y = player.y + Math.sin(a) * radius;
      sphere.sprite.setPosition(x, y);
      sphere.sprite.setVisible(true);
    }

    this.checkEnemyHits(time, cfg);
  }

  checkEnemyHits(time, cfg) {
    const hitRadius = cfg.hitRadius ?? 12 * gameConfig.worldScale;
    const damage = cfg.damage ?? 1;
    const hitCooldown = cfg.hitCooldownMs ?? 220;

    for (const sphere of this.spheres) {
      const sx = sphere.sprite.x;
      const sy = sphere.sprite.y;

      for (const layerName of ENEMY_LAYERS) {
        const group = this.layerManager.getGroup(layerName);
        for (const enemy of group.getChildren()) {
          if (!enemy.active) continue;

          const er = this._enemyHitRadius(enemy);
          const dist = Phaser.Math.Distance.Between(sx, sy, enemy.x, enemy.y);
          if (dist > hitRadius + er) continue;

          const lastHit = this._enemyHitTimes.get(enemy) ?? 0;
          if (time - lastHit < hitCooldown) continue;

          this._enemyHitTimes.set(enemy, time);
          enemy.takeDamage(damage);
        }
      }
    }
  }

  _enemyHitRadius(enemy) {
    const r = enemy.enemyConfig?.hitboxRadius;
    if (r) return r;
    return Math.min(enemy.displayWidth, enemy.displayHeight) * 0.45;
  }

  deactivate() {
    this.active = false;
    this.expiresAt = 0;
    this.config = null;
    this.clearSpheres();
  }

  clearSpheres() {
    for (const sphere of this.spheres) {
      sphere.sprite.destroy();
    }
    this.spheres = [];
    this.orbitAngle = 0;
  }

  destroy() {
    EventBus.off(EVT.PLAYER_DEAD, this._onPlayerDead, this);
    this.clearSpheres();
  }
}
