import { gameConfig } from '../../config/game-config.js';
import { EventBus } from '../../systems/EventBus.js';
import { EVT } from '../../systems/events.js';

const S = gameConfig.worldScale;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, config, layerGroup) {
    super(scene, 0, -50, config.textureKey);
    scene.add.existing(this);
    layerGroup.add(this);

    this.enemyConfig = config;
    this.hp = config.hp;
    this.score = config.score;
    this.lastFired = 0;
    this.zigPhase = 0;

    this.setDepth(config.layer === 'bgEnemies' ? 150 : 350);
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

  spawn(x, y) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.hp = this.enemyConfig.hp;
    this.lastFired = 0;
    this.zigPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this._applySpawnRotation();
    if (this.enemyConfig.behavior === 'glidePast') {
      this._setGlidePastVelocity(x, y);
    }
  }

  _applySpawnRotation() {
    if (this.enemyConfig.rotateInFlight || this.enemyConfig.facingDown) {
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
    EventBus.emit(EVT.ENEMY_KILLED, this.enemyConfig.score, this.x, this.y);
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

    this._updateFlightRotation();

    if (this.enemyConfig.fireRate && this.enemyConfig.layer === 'fgEnemies') {
      if (time > this.lastFired + this.enemyConfig.fireRate) {
        this.lastFired = time;
        this.fireBullet();
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
