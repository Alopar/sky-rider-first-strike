import { gameConfig } from '../config/game-config.js';
import { enemiesConfig } from '../config/enemies.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

export class SpawnDirector {
  constructor(scene, enemyFactory, levelConfig) {
    this.scene = scene;
    this.factory = enemyFactory;
    this.config = levelConfig;
    this.waveIndex = 0;
    this.startTime = -1;
    this.levelComplete = false;
  }

  start(time) {
    this.startTime = time;
    this.waveIndex = 0;
    this.levelComplete = false;
  }

  getElapsed(time) {
    if (this.startTime === -1) return 0;
    return time - this.startTime;
  }

  getRemainingMs(time) {
    const duration = this.config.duration ?? 0;
    return Math.max(0, duration - this.getElapsed(time));
  }

  _getSpawnRatioBounds(typeId) {
    const enemy = enemiesConfig[typeId];
    if (!enemy) return null;
    if (enemy.spawnZone === 'main') {
      const margin = gameConfig.spawnZones.main.sideMarginRatio;
      return { mode: 'center', min: margin, max: 1 - margin };
    }
    if (enemy.spawnZone === 'side') {
      return { mode: 'side', ...gameConfig.spawnZones.side };
    }
    return null;
  }

  _clampSpawnRatio(r, bounds) {
    if (!bounds) return Phaser.Math.Clamp(r, 0.02, 0.98);
    if (bounds.mode === 'center') {
      return Phaser.Math.Clamp(r, bounds.min, bounds.max);
    }
    if (bounds.mode === 'side') {
      if (r <= bounds.leftMax) {
        return Phaser.Math.Clamp(r, bounds.leftMin, bounds.leftMax);
      }
      if (r >= bounds.rightMin) {
        return Phaser.Math.Clamp(r, bounds.rightMin, bounds.rightMax);
      }
      if (Phaser.Math.Between(0, 1) === 0) {
        return Phaser.Math.FloatBetween(bounds.leftMin, bounds.leftMax);
      }
      return Phaser.Math.FloatBetween(bounds.rightMin, bounds.rightMax);
    }
    return Phaser.Math.Clamp(r, 0.02, 0.98);
  }

  /**
   * X в пикселях: legacy `x`, либо `xRatio` (одна точка), либо линейный разброс между xRatioFrom и xRatioTo.
   */
  resolveSpawnX(wave, index, count) {
    const w = this.scene.game.config.width;
    const bounds = this._getSpawnRatioBounds(wave.type);
    const clampR = (r) => this._clampSpawnRatio(r, bounds);

    if (typeof wave.x === 'number' && wave.xRatio == null && wave.xRatioFrom == null && wave.xRatioTo == null) {
      return wave.x;
    }

    if (count <= 1) {
      if (wave.xRatio != null) {
        return clampR(wave.xRatio) * w;
      }
      const from = wave.xRatioFrom ?? 0.5;
      const to = wave.xRatioTo ?? from;
      return clampR((from + to) / 2) * w;
    }

    const from = wave.xRatioFrom ?? wave.xRatio ?? 0.08;
    const to = wave.xRatioTo ?? wave.xRatio ?? 0.92;
    const t = count > 1 ? index / (count - 1) : 0;
    return clampR(from + t * (to - from)) * w;
  }

  update(time) {
    if (this.startTime === -1) return;

    const elapsed = this.getElapsed(time);
    const duration = this.config.duration;

    if (duration != null && elapsed >= duration) {
      if (!this.levelComplete) {
        this.levelComplete = true;
        EventBus.emit(EVT.LEVEL_COMPLETE);
      }
      return;
    }

    while (this.waveIndex < this.config.waves.length) {
      const wave = this.config.waves[this.waveIndex];
      if (elapsed >= wave.time) {
        this.spawnWave(wave);
        this.waveIndex++;
      } else {
        break;
      }
    }

    if (
      this.waveIndex >= this.config.waves.length &&
      this.config.loop &&
      this.config.waves.length > 0
    ) {
      this.startTime = time;
      this.waveIndex = 0;
    }
  }

  spawnWave(wave) {
    const interval = wave.interval ?? 0;
    const count = wave.count;
    for (let i = 0; i < count; i++) {
      const idx = i;
      this.scene.time.delayedCall(idx * interval, () => {
        if (!this.scene.sys.isActive() || this.levelComplete) return;
        const x = this.resolveSpawnX(wave, idx, count);
        this.factory.spawn(wave.type, x, -50);
      });
    }
  }
}
