export class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(200);
  }

  fire(x, y, vx, vy) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocity(vx, vy);
  }

  update() {
    if (this.y < -50 || this.x < -50 || this.x > this.scene.game.config.width + 50) {
      this.destroy();
    }
  }
}

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(350);
  }

  fire(x, y, vx, vy) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocity(vx, vy);
  }

  update() {
    const gameHeight = this.scene.game.config.height;
    if (this.y > gameHeight + 50 || this.x < -50 || this.x > this.scene.game.config.width + 50) {
      this.destroy();
    }
  }
}
