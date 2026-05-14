import { gameConfig } from '../config/game-config.js';

const S = gameConfig.worldScale;

/** Белые и слегка голубоватые оттенки, без жёлтого/оранжевого контраста */
const COOL_STAR_COLORS = [0xffffff, 0xf2f8ff, 0xe4f0ff, 0xd6e8ff, 0xc8e0ff, 0xbad8f8];

function pickCoolColor() {
  return Phaser.Math.RND.pick(COOL_STAR_COLORS);
}

export class ParallaxStarfield {
  constructor(scene) {
    this.scene = scene;
    this.stars = [];
    this.speedMultiplier = 1;

    this.layers = [
      { count: 150, speed: 20 * S, size: Math.max(1, Math.round(1 * S)), alpha: 0.35, starChance: 0.28 },
      { count: 70, speed: 60 * S, size: Math.max(1, Math.round(2 * S)), alpha: 0.55, starChance: 0.45 },
      { count: 30, speed: 140 * S, size: Math.max(1, Math.round(3 * S)), alpha: 0.78, starChance: 0.62 }
    ];

    this.init();
  }

  _spawnSprite(x, y, layer) {
    const color = pickCoolColor();
    const sz = layer.size;
    const useStar = Phaser.Math.FloatBetween(0, 1) < layer.starChance;

    if (useStar) {
      const outer = Math.max(1.2, sz * 0.95);
      const inner = outer * 0.32;
      const star = this.scene.add.star(x, y, 4, inner, outer, color, layer.alpha);
      star.setDepth(10);
      return {
        sprite: star,
        kind: 'star',
        baseAlpha: layer.alpha,
        spin: Phaser.Math.FloatBetween(0.35, 1.1) * (Math.random() < 0.5 ? -1 : 1)
      };
    }

    const r = Math.max(0.8, sz * 0.42);
    const circle = this.scene.add.circle(x, y, r, color, layer.alpha);
    circle.setDepth(10);
    return {
      sprite: circle,
      kind: 'circle',
      baseAlpha: layer.alpha,
      twPhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      twSpeed: Phaser.Math.FloatBetween(0.7, 1.6)
    };
  }

  init() {
    const width = this.scene.game.config.width;
    const height = this.scene.game.config.height;

    this.layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const data = this._spawnSprite(x, y, layer);
        data.speed = layer.speed;
        this.stars.push(data);
      }
    });
  }

  update(dt) {
    const height = this.scene.game.config.height;
    const width = this.scene.game.config.width;
    const deltaSeconds = dt / 1000;

    this.stars.forEach((starData) => {
      const s = starData.sprite;
      s.y += starData.speed * deltaSeconds * this.speedMultiplier;
      if (s.y > height) {
        s.y = 0;
        s.x = Phaser.Math.Between(0, width);
      }

      if (starData.kind === 'star') {
        s.rotation += starData.spin * deltaSeconds;
      } else {
        starData.twPhase += dt * 0.0009 * starData.twSpeed;
        const wobble = 0.88 + Math.sin(starData.twPhase) * 0.12;
        s.setAlpha(Phaser.Math.Clamp(starData.baseAlpha * wobble, 0.08, 1));
      }
    });
  }

  setSpeedMultiplier(m) {
    this.speedMultiplier = m;
  }
}
