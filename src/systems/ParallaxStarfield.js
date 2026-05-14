import { gameConfig } from '../config/game-config.js';

const S = gameConfig.worldScale;

export class ParallaxStarfield {
  constructor(scene) {
    this.scene = scene;
    this.stars = [];
    this.speedMultiplier = 1;

    this.layers = [
      { count: 150, speed: 20 * S, size: Math.max(1, Math.round(1 * S)), alpha: 0.35, color: 0xffffff },
      { count: 70, speed: 60 * S, size: Math.max(1, Math.round(2 * S)), alpha: 0.6, color: 0xffffff },
      { count: 30, speed: 140 * S, size: Math.max(1, Math.round(3 * S)), alpha: 0.85, color: 0xffd9aa }
    ];

    this.init();
  }

  init() {
    const width = this.scene.game.config.width;
    const height = this.scene.game.config.height;

    this.layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const star = this.scene.add.rectangle(x, y, layer.size, layer.size, layer.color);
        star.setAlpha(layer.alpha);
        star.setDepth(10); // Background depth
        
        this.stars.push({
          sprite: star,
          speed: layer.speed
        });
      }
    });
  }

  update(dt) {
    const height = this.scene.game.config.height;
    const width = this.scene.game.config.width;
    const deltaSeconds = dt / 1000;

    this.stars.forEach(starData => {
      starData.sprite.y += starData.speed * deltaSeconds * this.speedMultiplier;
      if (starData.sprite.y > height) {
        starData.sprite.y = 0;
        starData.sprite.x = Phaser.Math.Between(0, width);
      }
    });
  }

  setSpeedMultiplier(m) {
    this.speedMultiplier = m;
  }
}
