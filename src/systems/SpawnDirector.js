import { gameConfig } from '../config/game-config.js';
import { fireRateMulForSpawn } from '../config/level-mutations.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';
import { computeSpawnSlot, randomRatioInCorridor } from './spawn-patterns.js';

const SPAWN_Y = -50;

class ActiveWave {
  constructor(director, wave, startElapsed) {
    this.director = director;
    this.wave = wave;
    this.startElapsed = startElapsed;
    this.mode = wave.mode ?? 'burst';
    this.timers = [];
    this.spawned = 0;
    this.nextSpawnAt = 0;
    this.done = false;

    if (this.mode === 'burst') {
      this._startBurst();
    }
  }

  _startBurst() {
    const interval = this.wave.interval ?? 0;
    const count = this.wave.count ?? 1;
    if (count <= 0) {
      this.done = true;
      return;
    }
    for (let i = 0; i < count; i++) {
      const idx = i;
      const evt = this.director.scene.time.delayedCall(idx * interval, () => {
        if (this.director._shouldAbortSpawn()) {
          this.done = true;
          return;
        }
        this.director.spawnAtIndex(this.wave, idx, count);
        this.spawned++;
        if (this.spawned >= count) this.done = true;
      });
      this.timers.push(evt);
    }
  }

  tick(elapsed) {
    if (this.done || this.director.levelComplete) return;
    if (this.mode !== 'stream') return;

    const local = elapsed - this.startElapsed;
    const duration = this.wave.duration ?? 0;
    const interval = this.wave.interval ?? 600;
    const maxCount = this.wave.count;

    if (duration > 0 && local >= duration) {
      this.done = true;
      return;
    }

    while (local >= this.nextSpawnAt) {
      if (this.director._shouldAbortSpawn()) {
        this.done = true;
        return;
      }
      if (maxCount != null && this.spawned >= maxCount) {
        this.done = true;
        return;
      }
      if (duration > 0 && this.nextSpawnAt >= duration) {
        this.done = true;
        return;
      }

      this.director.spawnStreamOne(this.wave, this.spawned);
      this.spawned++;
      this.nextSpawnAt += interval;

      if (maxCount != null && this.spawned >= maxCount) {
        this.done = true;
        return;
      }
    }
  }

  cancel() {
    for (const t of this.timers) {
      if (t?.remove) t.remove(false);
    }
    this.timers = [];
    this.done = true;
  }

  isDone() {
    return this.done;
  }
}

export class SpawnDirector {
  constructor(scene, enemyFactory, levelConfig, enemiesConfig) {
    this.scene = scene;
    this.factory = enemyFactory;
    this.config = levelConfig;
    this.enemiesConfig = enemiesConfig;
    this.waveIndex = 0;
    this.running = false;
    this.levelComplete = false;
    this.activeWaves = [];
  }

  reset() {
    this._stopAllWaves();
    this.waveIndex = 0;
    this.levelComplete = false;
    this.running = false;
  }

  start() {
    this.reset();
    this.running = true;
  }

  getRemainingMs(elapsedMs) {
    const duration = this.config.duration ?? 0;
    return Math.max(0, duration - elapsedMs);
  }

  _shouldAbortSpawn() {
    return this.levelComplete || !this.scene.sys.isActive();
  }

  _stopAllWaves() {
    for (const w of this.activeWaves) w.cancel();
    this.activeWaves = [];
  }

  getElapsedMs() {
    return this.scene._runElapsedMs ?? 0;
  }

  _spawnOptions(typeId) {
    const elapsed = this.getElapsedMs();
    const mul = fireRateMulForSpawn(typeId, elapsed);
    return mul === 1 ? {} : { fireRateMul: mul };
  }

  _getSpawnRatioBounds(typeId) {
    const enemy = this.enemiesConfig[typeId];
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

  _ratioToPixelX(ratioX, typeId) {
    const bounds = this._getSpawnRatioBounds(typeId);
    const r = this._clampSpawnRatio(ratioX, bounds);
    return r * this.scene.game.config.width;
  }

  /** Legacy: абсолютный x без паттерна */
  _usesLegacyX(wave) {
    return (
      typeof wave.x === 'number' &&
      wave.xRatio == null &&
      wave.xRatioFrom == null &&
      wave.xRatioTo == null
    );
  }

  spawnAtIndex(wave, index, count) {
    if (this._shouldAbortSpawn()) return;

    let x;
    let y = SPAWN_Y;

    if (this._usesLegacyX(wave)) {
      x = wave.x;
    } else {
      const slot = computeSpawnSlot(wave, index, count);
      const ratioX = wave.xRandom ? randomRatioInCorridor(wave) : slot.ratioX;
      x = this._ratioToPixelX(ratioX, wave.type);
      y = SPAWN_Y + (slot.yOffset ?? 0);
    }

    this.factory.spawn(wave.type, x, y, this._spawnOptions(wave.type));
  }

  spawnStreamOne(wave, index) {
    if (this._shouldAbortSpawn()) return;

    let x;
    let y = SPAWN_Y;

    if (this._usesLegacyX(wave)) {
      x = wave.x;
    } else {
      let ratioX;
      if (wave.xRandom) {
        ratioX = randomRatioInCorridor(wave);
      } else {
        const slot = computeSpawnSlot(wave, index, Math.max(1, wave.count ?? 1));
        ratioX = slot.ratioX;
        y = SPAWN_Y + (slot.yOffset ?? 0);
      }
      x = this._ratioToPixelX(ratioX, wave.type);
    }

    this.factory.spawn(wave.type, x, y, this._spawnOptions(wave.type));
  }

  update(elapsedMs) {
    if (!this.running) return;

    const elapsed = elapsedMs;
    const duration = this.config.duration;

    if (duration != null && elapsed >= duration) {
      if (!this.levelComplete) {
        this.levelComplete = true;
        this._stopAllWaves();
        EventBus.emit(EVT.LEVEL_COMPLETE);
      }
      return;
    }

    while (this.waveIndex < this.config.waves.length) {
      const wave = this.config.waves[this.waveIndex];
      if (elapsed >= wave.time) {
        this.activeWaves.push(new ActiveWave(this, wave, elapsed));
        this.waveIndex++;
      } else {
        break;
      }
    }

    this.activeWaves = this.activeWaves.filter((w) => {
      w.tick(elapsed);
      if (w.isDone()) {
        w.cancel();
        return false;
      }
      return true;
    });

    if (
      this.waveIndex >= this.config.waves.length &&
      this.config.loop &&
      this.config.waves.length > 0
    ) {
      this.waveIndex = 0;
    }
  }
}
