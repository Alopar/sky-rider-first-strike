import { gameConfig } from '../config/game-config.js';

const S = gameConfig.worldScale;

/**
 * Вспышка, осколки и пыль при уничтожении серых астероидов.
 */
export class DebrisDestroyVfx {
  static play(scene, x, y, opts = {}) {
    const stage = opts.stage ?? 'small';
    const isLarge = stage === 'large' || stage === 'mega';

    DebrisDestroyVfx._shockwave(scene, x, y, isLarge);
    DebrisDestroyVfx._chips(scene, x, y, isLarge);
    DebrisDestroyVfx._dust(scene, x, y, isLarge);
    if (isLarge) {
      DebrisDestroyVfx._crackLines(scene, x, y);
    }
  }

  /** Серия из 3 смещённых взрывов (мега-астероид) */
  static playExplosive(scene, x, y) {
    const cfg = gameConfig.debris.megaBurst;
    const bursts = cfg.vfxBursts ?? 3;
    const delay = cfg.vfxBurstDelayMs ?? 75;
    const jitter = (cfg.vfxJitter ?? 18) * S;

    DebrisDestroyVfx._chips(scene, x, y, true);
    DebrisDestroyVfx._explosionSparks(scene, x, y, 20);

    for (let i = 0; i < bursts; i++) {
      scene.time.delayedCall(i * delay, () => {
        if (!scene.sys?.isActive()) return;
        const ox = x + Phaser.Math.FloatBetween(-jitter, jitter);
        const oy = y + Phaser.Math.FloatBetween(-jitter, jitter);
        DebrisDestroyVfx._shockwave(scene, ox, oy, true, {
          color: 0xff6b4a,
          maxScale: 5.5 + i * 1.2,
          duration: 280 + i * 40
        });
        DebrisDestroyVfx._explosionCore(scene, ox, oy);
        DebrisDestroyVfx._explosionSparks(scene, ox, oy, 10 + i * 2);
        DebrisDestroyVfx._fireDust(scene, ox, oy);
      });
    }
  }

  static _shockwave(scene, x, y, isLarge, opts = {}) {
    const color = opts.color ?? 0xb8c4d4;
    const maxScale = opts.maxScale ?? (isLarge ? 5.5 : 3.2);
    const duration = opts.duration ?? (isLarge ? 320 : 200);
    const ring = scene.add.circle(x, y, 6 * S, color, 0.55).setDepth(420);
    scene.tweens.add({
      targets: ring,
      scaleX: maxScale,
      scaleY: maxScale,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  static _explosionCore(scene, x, y) {
    const core = scene.add.circle(x, y, 10 * S, 0xffe8d8, 0.9).setDepth(423);
    scene.tweens.add({
      targets: core,
      scaleX: 2.8,
      scaleY: 2.8,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => core.destroy()
    });
  }

  static _explosionSparks(scene, x, y, count) {
    const colors = [0xff5540, 0xff8a5c, 0xffd23f, 0xff6b6b];
    for (let i = 0; i < count; i++) {
      const spark = scene.add
        .circle(x, y, Phaser.Math.Between(2, 5) * S, colors[i % colors.length], 0.95)
        .setDepth(424);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(25, 70) * S;
      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: Phaser.Math.Between(160, 320),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  static _fireDust(scene, x, y) {
    for (let i = 0; i < 4; i++) {
      const r = Phaser.Math.Between(10, 18) * S;
      const puff = scene.add
        .circle(x, y, r, 0xff6b4a, Phaser.Math.FloatBetween(0.3, 0.5))
        .setDepth(419);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const drift = Phaser.Math.Between(20, 45) * S;
      scene.tweens.add({
        targets: puff,
        x: x + Math.cos(angle) * drift,
        y: y + Math.sin(angle) * drift,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: Phaser.Math.Between(300, 450),
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy()
      });
    }
  }

  static _chips(scene, x, y, isLarge) {
    const colors = [0x9ca8b8, 0x7a8494, 0x4a5260, 0xc5cdd8, 0x5c6675];
    const count = isLarge ? 16 : 10;
    for (let i = 0; i < count; i++) {
      const w = Phaser.Math.Between(3, 9) * S;
      const h = Phaser.Math.Between(2, 7) * S;
      const chip = scene.add
        .rectangle(x, y, w, h, colors[i % colors.length])
        .setDepth(421)
        .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(isLarge ? 35 : 20, isLarge ? 100 : 60) * S;
      const duration = Phaser.Math.Between(180, isLarge ? 420 : 300);
      scene.tweens.add({
        targets: chip,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        rotation: chip.rotation + Phaser.Math.FloatBetween(-3, 3),
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => chip.destroy()
      });
    }
  }

  static _dust(scene, x, y, isLarge) {
    const puffCount = isLarge ? 6 : 4;
    for (let i = 0; i < puffCount; i++) {
      const r = Phaser.Math.Between(8, 16) * S;
      const puff = scene.add
        .circle(x, y, r, 0x6e7888, Phaser.Math.FloatBetween(0.25, 0.45))
        .setDepth(419);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const drift = Phaser.Math.Between(12, isLarge ? 40 : 28) * S;
      scene.tweens.add({
        targets: puff,
        x: x + Math.cos(angle) * drift,
        y: y + Math.sin(angle) * drift,
        scaleX: Phaser.Math.FloatBetween(1.6, 2.4),
        scaleY: Phaser.Math.FloatBetween(1.6, 2.4),
        alpha: 0,
        duration: Phaser.Math.Between(280, 500),
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy()
      });
    }
  }

  static _crackLines(scene, x, y) {
    for (let i = 0; i < 5; i++) {
      const len = Phaser.Math.Between(18, 36) * S;
      const angle = (Math.PI * 2 / 5) * i + Phaser.Math.FloatBetween(-0.2, 0.2);
      const line = scene.add
        .line(x, y, 0, 0, Math.cos(angle) * len, Math.sin(angle) * len, 0xd4dce8)
        .setLineWidth(2 * S)
        .setDepth(422)
        .setAlpha(0.85);
      scene.tweens.add({
        targets: line,
        alpha: 0,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 220,
        ease: 'Cubic.easeOut',
        onComplete: () => line.destroy()
      });
    }
  }
}
