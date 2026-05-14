import { InputManager } from '../systems/InputManager.js';
import { ParallaxStarfield } from '../systems/ParallaxStarfield.js';
import { LayerManager } from '../systems/LayerManager.js';
import { Player } from '../entities/Player.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { EnemyFactory } from '../systems/EnemyFactory.js';
import { SpawnDirector } from '../systems/SpawnDirector.js';
import { CollisionMatrix } from '../systems/CollisionMatrix.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { level01 } from '../config/levels/level-01.js';
import { EventBus } from '../systems/EventBus.js';
import { EVT } from '../systems/events.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.layerManager = new LayerManager(this);
    this.starfield = new ParallaxStarfield(this);
    this.inputManager = new InputManager(this);
    
    this.player = new Player(this, 400, 500);
    this.weaponSystem = new WeaponSystem(this, this.layerManager);
    this.weaponSystem.setLevel(1);
    
    this.enemyFactory = new EnemyFactory(this, this.layerManager);
    this.spawnDirector = new SpawnDirector(this, this.enemyFactory, level01);
    
    this.collisionMatrix = new CollisionMatrix(this, this.layerManager, this.player);
    this.scoreSystem = new ScoreSystem();
    
    this.spawnDirector.start(this.time.now);

    EventBus.emit(EVT.GAME_START);
    EventBus.on(EVT.PLAYER_DEAD, this.onPlayerDead, this);
  }

  update(time, delta) {
    if (this.inputManager.isPausePressed()) {
      // Pause not fully implemented yet
    }

    this.starfield.update(delta);
    
    if (this.player && this.player.active) {
      this.player.update(this.inputManager, delta);
      if (this.inputManager.isFiring()) {
        this.weaponSystem.tryFire(this.player, time);
      }
    }

    this.spawnDirector.update(time);

    // Update bullets
    this.layerManager.getGroup('playerBullets').getChildren().forEach(b => b.update());
    this.layerManager.getGroup('enemyBullets').getChildren().forEach(b => b.update());

    // Update enemies
    this.layerManager.getGroup('bgEnemies').getChildren().forEach(e => e.update(time, delta));
    this.layerManager.getGroup('fgEnemies').getChildren().forEach(e => e.update(time, delta));
  }

  onPlayerDead() {
    EventBus.emit(EVT.GAME_OVER);
    this.time.delayedCall(2000, () => {
      this.scoreSystem.reset();
      this.scene.restart();
    });
  }
}
