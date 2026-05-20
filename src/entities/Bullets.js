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
    const m = 75;
    if (this.y < -m || this.x < -m || this.x > this.scene.game.config.width + m) {
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

  fire(x, y, vx, vy, style = 'laser') {
    const textureKey = style === 'round' ? 'enemy_bullet_round' : 'enemy_bullet';
    if (this.texture.key !== textureKey) {
      this.setTexture(textureKey);
    }

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocity(vx, vy);
    this.alpha = 1;

    if (style === 'round') {
      this.setRotation(0);
    } else if (vx !== 0 || vy !== 0) {
      this.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
    } else {
      this.setRotation(0);
    }
  }

  update() {
    const gameHeight = this.scene.game.config.height;
    const m = 75;
    if (this.y > gameHeight + m || this.x < -m || this.x > this.scene.game.config.width + m) {
      this.destroy();
    }
  }
}
