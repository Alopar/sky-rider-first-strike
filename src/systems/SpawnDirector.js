export class SpawnDirector {
  constructor(scene, enemyFactory, levelConfig) {
    this.scene = scene;
    this.factory = enemyFactory;
    this.config = levelConfig;
    this.waveIndex = 0;
    this.startTime = -1;
  }

  start(time) {
    this.startTime = time;
    this.waveIndex = 0;
  }

  /**
   * X в пикселях: legacy `x`, либо `xRatio` (одна точка), либо линейный разброс между xRatioFrom и xRatioTo.
   */
  resolveSpawnX(wave, index, count) {
    const w = this.scene.game.config.width;
    const clampR = (r) => Phaser.Math.Clamp(r, 0.02, 0.98);

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

    const elapsed = time - this.startTime;

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
        if (!this.scene.sys.isActive()) return;
        const x = this.resolveSpawnX(wave, idx, count);
        this.factory.spawn(wave.type, x, -50);
      });
    }
  }
}
