import { gameConfig } from '../config/game-config.js';
import { EventBus } from '../systems/EventBus.js';
import { EVT } from '../systems/events.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(400);
    this.body.setCircle(gameConfig.player.hitboxRadius, 16 - gameConfig.player.hitboxRadius, 16 - gameConfig.player.hitboxRadius);
    this.setCollideWorldBounds(true);

    this.hp = 3;
    this.maxHp = 3;
    this.isInvulnerable = false;
  }

  update(input, dt) {
    const speed = gameConfig.player.speed;
    let vx = 0;
    let vy = 0;

    if (input.isLeft()) vx = -speed;
    else if (input.isRight()) vx = speed;

    if (input.isUp()) vy = -speed;
    else if (input.isDown()) vy = speed;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx*vx + vy*vy);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }

    this.setVelocity(vx, vy);
  }

  takeDamage(amount) {
    if (this.isInvulnerable || this.hp <= 0) return;
    
    this.hp -= amount;
    EventBus.emit(EVT.PLAYER_HIT);
    EventBus.emit(EVT.HP_CHANGED, this.hp);

    if (this.hp <= 0) {
      this.die();
    } else {
      this.startInvulnerability();
    }
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
    this.destroy();
  }
}
