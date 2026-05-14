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
  }

  spawnWave(wave) {
    for (let i = 0; i < wave.count; i++) {
      this.scene.time.delayedCall(i * (wave.interval || 0), () => {
        this.factory.spawn(wave.type, wave.x, -50);
      });
    }
  }
}
