import { gameConfig } from '../../config/game-config.js';
import { DebrisDestroyVfx } from '../../systems/DebrisDestroyVfx.js';
import { EventBus } from '../../systems/EventBus.js';
import { EVT } from '../../systems/events.js';

const S = gameConfig.worldScale;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  static depthForLayer(layer) {
    if (layer === 'bgEnemies') return 150;
    if (layer === 'debrisEnemies') return 180;
    return 350;
  }

  constructor(scene, config, layerGroup) {
    super(scene, 0, -50, config.textureKey);
    scene.add.existing(this);
    layerGroup.add(this);

    this.enemyConfig = config;
    this.hp = config.hp;
    this.score = config.score;
    this.lastFired = 0;
    this.zigPhase = 0;

    this.setDepth(Enemy.depthForLayer(config.layer));
    this.syncBodyFromConfig();
  }

  syncBodyFromConfig() {
    const c = this.enemyConfig;
    if (!this.body) return;

    const rect = c.hitboxRect;
    if (rect && rect.w > 0 && rect.h > 0) {
      this.body.setSize(rect.w, rect.h);
      this.body.setOffset(
        (this.displayWidth - rect.w) / 2,
        (this.displayHeight - rect.h) / 2
      );
    } else {
      const r = c.hitboxRadius;
      const d = r * 2;
      this.body.setCircle(r, (this.displayWidth - d) / 2, (this.displayHeight - d) / 2);
    }
  }

  spawn(x, y, options = {}) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.hp = this.enemyConfig.hp;
    this.lastFired = 0;
    this.zigPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    if (this.body) this.setAngularVelocity(0);
    this._debrisSpin = 0;
    this._burstActive = false;
    this._flightSpin = 0;
    this._applySpawnRotation();
    this._applyFlightSpin();

    const { behavior } = this.enemyConfig;
    if (options.velocity) {
      this.setVelocity(options.velocity.vx, options.velocity.vy);
    } else if (behavior === 'debrisDrift') {
      this._applyDebrisVelocity();
    } else if (behavior === 'glidePast') {
      this._setGlidePastVelocity(x, y);
    }

    if (behavior === 'debrisDrift') {
      this._applyDebrisSpin();
    }
  }

  _applyFlightSpin() {
    if (!this.enemyConfig.spinInFlight) return;
    const speed = this.enemyConfig.spinRadPerSec ?? 2.2;
    const sign = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this._flightSpin = speed * sign;
  }

  _applyDebrisSpin() {
    const stage = this.enemyConfig.stage ?? 'small';
    const range = gameConfig.debris.spinRadPerSec[stage]
      ?? gameConfig.debris.spinRadPerSec.small;
    const sign = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this._debrisSpin = Phaser.Math.FloatBetween(range.min, range.max) * sign;
  }

  _applyDebrisVelocity() {
    const base = this.enemyConfig.speed;
    const variance = this.enemyConfig.speedVariance ?? gameConfig.debris.speedVariance;
    const mult = 1 + Phaser.Math.FloatBetween(-variance, variance);
    this.setVelocity(0, base * mult);
  }

  _applySpawnRotation() {
    if (this.enemyConfig.behavior === 'debrisDrift') {
      this.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
    } else if (this.enemyConfig.rotateInFlight || this.enemyConfig.facingDown) {
      this.setRotation(Math.PI);
    } else {
      this.setRotation(0);
    }
  }

  _updateFlightRotation() {
    if (!this.enemyConfig.rotateInFlight) return;
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    if (Math.hypot(vx, vy) > 0.5) {
      this.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
    }
  }

  /**
   * Один раз при спавне: направление на позицию игрока в этот момент, дальше полёт по инерции (без самонаведения).
   */
  _setGlidePastVelocity(spawnX, spawnY) {
    const speed = this.enemyConfig.speed;
    const player = this.scene.registry.get('playerRef');
    let vx = 0;
    let vy = speed;
    if (player && player.active) {
      const dx = player.x - spawnX;
      const dy = player.y - spawnY;
      const len = Math.hypot(dx, dy) || 1;
      vx = (dx / len) * speed;
      vy = (dy / len) * speed;
    }
    this.setVelocity(vx, vy);
    this._updateFlightRotation();
  }

  _emitKilled(x, y) {
    EventBus.emit(EVT.ENEMY_KILLED, {
      score: this.enemyConfig.score,
      x,
      y,
      guaranteedBonusDrop: !!this.enemyConfig.guaranteedBonusDrop,
      bonusDropChanceBonus: this.enemyConfig.bonusDropChanceBonus ?? 0
    });
  }

  takeDamage(amount) {
    this.hp -= amount;
    EventBus.emit(EVT.ENEMY_HIT, this);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      yoyo: true,
      duration: 50,
      onComplete: () => {
        this.alpha = 1;
      }
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (this.enemyConfig.splitMode === 'radial') {
      this._dieRadialBurst();
      return;
    }
    if (this.enemyConfig.splitsInto) {
      this._dieAndSplit();
      return;
    }

    this._emitKilled(this.x, this.y);
    if (this.enemyConfig.layer === 'debrisEnemies') {
      DebrisDestroyVfx.play(this.scene, this.x, this.y, { stage: this.enemyConfig.stage ?? 'small' });
      this.destroy();
      return;
    }

    for (let i = 0; i < 8; i++) {
      const line = this.scene.add.line(this.x, this.y, 0, 0, 10 * S, 0, 0xffffff).setLineWidth(2 * S);
      this.scene.physics.add.existing(line);
      const angle = (Math.PI * 2 / 8) * i;
      line.body.setVelocity(Math.cos(angle) * 100 * S, Math.sin(angle) * 100 * S);
      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 250,
        onComplete: () => line.destroy()
      });
    }
    this.destroy();
  }

  _fragmentScatterSpeed() {
    const scatter = gameConfig.debris.scatterSpeed;
    return scatter?.fragment ?? 90 * S;
  }

  _spawnMegaFragments(factory, x, y, burst, waveType, count) {
    const range = burst.scatterSpeed?.[waveType === 'debrisLarge' ? 'large' : 'small'];
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = range
        ? Phaser.Math.FloatBetween(range.min, range.max)
        : this._fragmentScatterSpeed();
      factory?.spawn(waveType, x, y, {
        velocity: {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed
        }
      });
    }
  }

  _dieRadialBurst() {
    const burst = gameConfig.debris.megaBurst;
    const x = this.x;
    const y = this.y;
    this._emitKilled(x, y);
    DebrisDestroyVfx.playExplosive(this.scene, x, y);

    const factory = this.scene.registry.get('enemyFactory');
    const largeCount = burst.largeFragmentCount ?? 3;
    const smallCount = burst.smallFragmentCount ?? 5;

    this._spawnMegaFragments(factory, x, y, burst, 'debrisLarge', largeCount);
    this._spawnMegaFragments(factory, x, y, burst, 'debrisSmall', smallCount);

    this.destroy();
  }

  _dieAndSplit() {
    this._emitKilled(this.x, this.y);
    DebrisDestroyVfx.play(this.scene, this.x, this.y, { stage: 'large' });

    const vx = this.body?.velocity?.x ?? 0;
    const vy = this.body?.velocity?.y ?? 0;
    const moveAngle = Math.hypot(vx, vy) > 1 ? Math.atan2(vy, vx) : Math.PI / 2;
    const splitAngle = this.enemyConfig.splitAngleRad ?? gameConfig.debris.splitAngleRad;
    const fragmentSpeed = this._fragmentScatterSpeed();
    const factory = this.scene.registry.get('enemyFactory');

    for (const sign of [-1, 1]) {
      const a = moveAngle + sign * splitAngle;
      factory?.spawn(this.enemyConfig.splitsInto, this.x, this.y, {
        velocity: { vx: Math.cos(a) * fragmentSpeed, vy: Math.sin(a) * fragmentSpeed }
      });
    }
    this.destroy();
  }

  update(time, dt) {
    const { behavior, speed } = this.enemyConfig;
    const dtMs = dt ?? 0;

    if (behavior === 'slowZigzag' || behavior === 'smoothSway') {
      const freq = behavior === 'smoothSway'
        ? (this.enemyConfig.swayFreq ?? 0.0012)
        : (this.enemyConfig.zigFreq ?? 0.002);
      const amp = behavior === 'smoothSway'
        ? (this.enemyConfig.swayAmp ?? 55 * S)
        : (this.enemyConfig.zigAmp ?? 40 * S);
      this.zigPhase += dtMs * freq;
      this.setVelocityY(speed);
      this.setVelocityX(Math.sin(this.zigPhase) * amp);
    } else if (behavior === 'straightDown' || behavior === 'striker') {
      this.setVelocityY(speed);
      this.setVelocityX(0);
    }
    // debrisDrift: скорость задаётся при спавне, не перезаписываем
    if (behavior === 'debrisDrift' && this._debrisSpin) {
      this.rotation += this._debrisSpin * (dtMs / 1000);
    } else if (this.enemyConfig.spinInFlight && this._flightSpin) {
      this.rotation += this._flightSpin * (dtMs / 1000);
    }

    this._updateFlightRotation();

    if (this.enemyConfig.fireRate && this.enemyConfig.layer === 'fgEnemies' && !this._burstActive) {
      if (time > this.lastFired + this.enemyConfig.fireRate) {
        this.lastFired = time;
        if (this.enemyConfig.fireMode === 'burstForward') {
          this._fireBurstForward();
        } else {
          this.fireBullet();
        }
      }
    }

    const h = this.scene.game.config.height;
    const w = this.scene.game.config.width;
    const margin = 100;
    if (behavior === 'glidePast') {
      if (this.y > h + margin || this.y < -margin * 2 || this.x < -margin || this.x > w + margin) {
        this.destroy();
      }
    } else if (this.y > h + 120) {
      this.destroy();
    }
  }

  _fireBurstForward() {
    const cfg = this.enemyConfig;
    const salvos = cfg.burstSalvos ?? 3;
    const delay = cfg.burstSalvoDelayMs ?? 160;
    this._burstActive = true;

    for (let s = 0; s < salvos; s++) {
      this.scene.time.delayedCall(s * delay, () => {
        if (!this.active) return;
        this._fireForwardSalvo();
      });
    }

    this.scene.time.delayedCall((salvos - 1) * delay + 80, () => {
      this._burstActive = false;
    });
  }

  _fireForwardSalvo() {
    const cfg = this.enemyConfig;
    const speed = cfg.bulletSpeed;
    const size = cfg.burstSalvoSize ?? 3;
    const spread = cfg.burstSpreadRad ?? 0.12;
    const style = cfg.bulletStyle ?? 'round';
    const points = cfg.firePoints;
    const down = Math.PI / 2;

    const emit = (ox, oy, spreadT) => {
      const angle = down + spreadT * spread;
      EventBus.emit(
        EVT.ENEMY_FIRE,
        ox,
        oy,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        style
      );
    };

    if (points?.length) {
      const n = Math.min(size, points.length);
      for (let i = 0; i < n; i++) {
        const pt = points[i];
        const t = n > 1 ? (i / (n - 1) - 0.5) * 2 : 0;
        emit(this.x + pt.x, this.y + pt.y, t);
      }
      return;
    }

    const offsetY = (cfg.fireOffsetY ?? 0) * S;
    for (let i = 0; i < size; i++) {
      const t = size > 1 ? (i / (size - 1) - 0.5) * 2 : 0;
      emit(this.x, this.y + offsetY, t);
    }
  }

  fireBullet() {
    const speed = this.enemyConfig.bulletSpeed;
    const offsetY = (this.enemyConfig.fireOffsetY ?? 0) * S;
    const ox = this.x;
    const oy = this.y + offsetY;

    let vx = 0;
    let vy = speed;

    if (this.enemyConfig.fireMode === 'aimPlayer') {
      const player = this.scene.registry.get('playerRef');
      if (player && player.active) {
        const dx = player.x - ox;
        const dy = player.y - oy;
        const len = Math.hypot(dx, dy) || 1;
        vx = (dx / len) * speed;
        vy = (dy / len) * speed;
      }
    }

    const style = this.enemyConfig.bulletStyle ?? 'laser';
    EventBus.emit(EVT.ENEMY_FIRE, ox, oy, vx, vy, style);
  }
}
