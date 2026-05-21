import { gameConfig } from '../config/game-config.js';
import { EventBus } from '../systems/EventBus.js';
import { EVT } from '../systems/events.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(400);
    const half = gameConfig.player.textureHalf;
    const hb = gameConfig.player.hitboxRadius;
    this.body.setCircle(hb, half - hb, half - hb);
    this.setCollideWorldBounds(true);

    this.maxHp = gameConfig.player.maxHp;
    this.hp = gameConfig.player.startHp;
    this.shield = 0;
    this.isInvulnerable = false;

    this.shieldOverlay = scene.add.image(x, y, 'player_shield_ring');
    this.shieldOverlay.setDepth(401);
    this.shieldOverlay.setVisible(false);

    EventBus.emit(EVT.HP_CHANGED, this.hp);
    EventBus.emit(EVT.SHIELD_CHANGED, this.shield);
  }

  update(input, dt) {
    const speed = gameConfig.player.speed;
    let vx = 0;
    let vy = 0;

    if (input.isLeft()) vx = -speed;
    else if (input.isRight()) vx = speed;

    if (input.isUp()) vy = -speed;
    else if (input.isDown()) vy = speed;

    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }

    this.setVelocity(vx, vy);

    if (this.shieldOverlay) {
      this.shieldOverlay.setPosition(this.x, this.y);
    }
  }

  takeDamage(amount) {
    if (this.isInvulnerable || this.hp <= 0) return;

    if (this.shield > 0) {
      this.shield = 0;
      EventBus.emit(EVT.SHIELD_CHANGED, this.shield);
      this.flashShieldBreak();
      return;
    }

    this.hp -= amount;
    EventBus.emit(EVT.PLAYER_HIT);
    EventBus.emit(EVT.HP_CHANGED, this.hp);

    if (this.hp <= 0) {
      this.die();
    } else {
      this.startInvulnerability();
    }
  }

  heal(amount) {
    if (this.hp >= this.maxHp) return;
    this.hp = Math.min(this.hp + amount, this.maxHp);
    EventBus.emit(EVT.HP_CHANGED, this.hp);
  }

  grantShield() {
    this.shield = 1;
    this.shieldOverlay.setVisible(true);
    EventBus.emit(EVT.SHIELD_CHANGED, this.shield);

    this.scene.tweens.add({
      targets: this.shieldOverlay,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeOut'
    });
  }

  flashShieldBreak() {
    this.scene.tweens.add({
      targets: this.shieldOverlay,
      alpha: 0.2,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 80,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.shieldOverlay.setVisible(false);
        this.shieldOverlay.setAlpha(1);
        this.shieldOverlay.setScale(1);
      }
    });
  }

  startInvulnerability() {
    this.isInvulnerable = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      yoyo: true,
      repeat: 5,
      duration: 100,
      onComplete: () => {
        this.isInvulnerable = false;
        this.alpha = 1;
      }
    });
  }

  die() {
    EventBus.emit(EVT.PLAYER_DEAD);
    if (this.shieldOverlay) {
      this.shieldOverlay.destroy();
      this.shieldOverlay = null;
    }
    this.destroy();
  }
}
