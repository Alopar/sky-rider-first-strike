import { EventBus } from '../../systems/EventBus.js';
import { EVT } from '../../systems/events.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, config, layerGroup) {
    super(scene, 0, -50, config.textureKey);
    scene.add.existing(this);
    layerGroup.add(this);
    
    this.enemyConfig = config;
    this.hp = config.hp;
    this.score = config.score;
    this.lastFired = 0;
    
    this.setDepth(config.layer === 'bgEnemies' ? 150 : 350);
    this.body.setCircle(config.hitboxRadius, config.radius - config.hitboxRadius, config.radius - config.hitboxRadius);
  }

  spawn(x, y) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.hp = this.enemyConfig.hp;
  }

  takeDamage(amount) {
    this.hp -= amount;
    EventBus.emit(EVT.ENEMY_HIT, this);

    // Simple hit flash effect
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      yoyo: true,
      duration: 50,
      onComplete: () => { this.alpha = 1; }
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    EventBus.emit(EVT.ENEMY_KILLED, this.enemyConfig.score, this.x, this.y);
    // Simple explosion effect
    for (let i = 0; i < 8; i++) {
      const line = this.scene.add.line(this.x, this.y, 0, 0, 10, 0, 0xffffff).setLineWidth(2);
      this.scene.physics.add.existing(line);
      const angle = (Math.PI * 2 / 8) * i;
      line.body.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
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
    // Behavior
    const { behavior, speed } = this.enemyConfig;
    if (behavior === 'straightDown' || behavior === 'striker') {
      this.setVelocityY(speed);
      this.setVelocityX(0);
    }
    
    // Firing for striker
    if (this.enemyConfig.fireRate && this.enemyConfig.layer === 'fgEnemies') {
      if (time > this.lastFired + this.enemyConfig.fireRate) {
        this.lastFired = time;
        this.fireBullet();
      }
    }

    if (this.y > this.scene.game.config.height + 50) {
      this.destroy();
    }
  }

  fireBullet() {
    EventBus.emit(EVT.ENEMY_FIRE, this.x, this.y, this.enemyConfig.bulletSpeed);
  }
}
