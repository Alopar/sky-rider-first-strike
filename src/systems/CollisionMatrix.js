import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

export class CollisionMatrix {
  constructor(scene, layerManager, player) {
    this.scene = scene;
    this.lm = layerManager;
    this.player = player;

    this.setupCollisions();
  }

  setupCollisions() {
    const physics = this.scene.physics;

    // Player vs enemy bullets
    physics.add.overlap(this.player, this.lm.getGroup('enemyBullets'), (p, bullet) => {
      bullet.destroy();
      this.player.takeDamage(1);
    });

    // Player vs fgEnemies
    physics.add.overlap(this.player, this.lm.getGroup('fgEnemies'), (p, enemy) => {
      this.player.takeDamage(1);
      enemy.takeDamage(1);
    });

    // PlayerBullets vs fgEnemies
    physics.add.overlap(this.lm.getGroup('playerBullets'), this.lm.getGroup('fgEnemies'), (bullet, enemy) => {
      bullet.destroy();
      enemy.takeDamage(1);
    });

    // PlayerBullets vs bgEnemies
    physics.add.overlap(this.lm.getGroup('playerBullets'), this.lm.getGroup('bgEnemies'), (bullet, enemy) => {
      bullet.destroy();
      enemy.takeDamage(1);
    });

    // Player vs debris (серые обломки)
    physics.add.overlap(this.player, this.lm.getGroup('debrisEnemies'), (p, enemy) => {
      this.player.takeDamage(1);
      enemy.takeDamage(1);
    });

    // PlayerBullets vs debris
    physics.add.overlap(this.lm.getGroup('playerBullets'), this.lm.getGroup('debrisEnemies'), (bullet, enemy) => {
      bullet.destroy();
      enemy.takeDamage(1);
    });

    // Player vs powerUps
    physics.add.overlap(this.player, this.lm.getGroup('powerUps'), (p, pu) => {
      pu.collect();
    });
  }
}
