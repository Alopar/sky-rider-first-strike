import { InputManager } from '../systems/InputManager.js';
import { ParallaxStarfield } from '../systems/ParallaxStarfield.js';
import { LayerManager } from '../systems/LayerManager.js';
import { Player } from '../entities/Player.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { EnemyFactory } from '../systems/EnemyFactory.js';
import { SpawnDirector } from '../systems/SpawnDirector.js';
import { CollisionMatrix } from '../systems/CollisionMatrix.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { BonusDropSystem } from '../systems/BonusDropSystem.js';
import { SideTurretBonusSystem } from '../systems/SideTurretBonusSystem.js';
import { OrbitalSphereBonusSystem } from '../systems/OrbitalSphereBonusSystem.js';
import { gameConfig } from '../config/game-config.js';
import { level01 } from '../config/levels/level-01.js';
import { EventBus } from '../systems/EventBus.js';
import { EVT } from '../systems/events.js';
import { AudioBus } from '../systems/AudioBus.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.layerManager = new LayerManager(this);
    this.starfield = new ParallaxStarfield(this);
    this.inputManager = new InputManager(this);
    
    const marginBottom = Math.round(140 * gameConfig.worldScale);
    this.player = new Player(this, gameConfig.width / 2, gameConfig.height - marginBottom);
    this.registry.set('playerRef', this.player);
    this.weaponSystem = new WeaponSystem(this, this.layerManager);
    this.weaponSystem.setLevel(1);
    this.registry.set('weaponSystem', this.weaponSystem);
    
    this.enemyFactory = new EnemyFactory(this, this.layerManager);
    this.registry.set('enemyFactory', this.enemyFactory);
    this.spawnDirector = new SpawnDirector(this, this.enemyFactory, level01);
    
    this.collisionMatrix = new CollisionMatrix(this, this.layerManager, this.player);
    this.scoreSystem = new ScoreSystem();
    this.bonusDropSystem = new BonusDropSystem(this, this.layerManager, this.scoreSystem);
    this.sideTurretBonus = new SideTurretBonusSystem(this, this.weaponSystem);
    this.registry.set('sideTurretBonus', this.sideTurretBonus);
    this.orbitalSphereBonus = new OrbitalSphereBonusSystem(this, this.layerManager);
    this.registry.set('orbitalSphereBonus', this.orbitalSphereBonus);

    this.audioBus = new AudioBus(this);
    this.audioBus.init();

    this._runElapsedMs = 0;
    this.spawnDirector.start();
    this._levelCleared = false;
    this._runEnded = false;
    this._lastTimerSecond = -1;

    if (this.scene.isPaused('GameScene')) {
      this.scene.resume('GameScene');
    }
    if (this.physics?.world) {
      this.physics.resume();
    }

    EventBus.emit(EVT.GAME_START);
    EventBus.on(EVT.PLAYER_DEAD, this.onPlayerDead, this);
    EventBus.on(EVT.LEVEL_COMPLETE, this.onLevelComplete, this);
    EventBus.on(EVT.FEEDBACK_RETRY, this.onFeedbackRetry, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
  }

  onSceneShutdown() {
    this.time?.removeAllEvents();
    this.spawnDirector?.reset();
    this.registry.remove('playerRef');
    this.registry.remove('weaponSystem');
    this.registry.remove('sideTurretBonus');
    this.registry.remove('orbitalSphereBonus');
    this.registry.remove('enemyFactory');
    EventBus.off(EVT.PLAYER_DEAD, this.onPlayerDead, this);
    EventBus.off(EVT.LEVEL_COMPLETE, this.onLevelComplete, this);
    EventBus.off(EVT.FEEDBACK_RETRY, this.onFeedbackRetry, this);
    this.weaponSystem?.destroy();
    this.scoreSystem?.destroy();
    this.bonusDropSystem?.destroy();
    this.sideTurretBonus?.destroy();
    this.orbitalSphereBonus?.destroy();
    this.audioBus?.destroy();
    this.audioBus = undefined;
  }

  update(time, delta) {
    if (this._runEnded) return;

    this._runElapsedMs += delta;

    if (this.inputManager.isPausePressed()) {
      // Pause not fully implemented yet
    }

    this.starfield.update(delta);
    
    if (this.player && this.player.active) {
      this.player.update(this.inputManager, delta);
      if (this.inputManager.isFiring()) {
        this.weaponSystem.tryFire(this.player, time);
      }
      this.sideTurretBonus.update(time, this.player);
      this.orbitalSphereBonus.update(time, this.player, delta);
    }

    this.spawnDirector.update(this._runElapsedMs);
    if (this._runEnded) return;

    this.updateLevelTimer();

    // Update bullets
    this.layerManager.getGroup('playerBullets').getChildren().forEach(b => b.update());
    this.layerManager.getGroup('enemyBullets').getChildren().forEach(b => b.update());

    // Update enemies
    this.layerManager.getGroup('bgEnemies').getChildren().forEach(e => e.update(time, delta));
    this.layerManager.getGroup('debrisEnemies').getChildren().forEach(e => e.update(time, delta));
    this.layerManager.getGroup('fgEnemies').getChildren().forEach(e => e.update(time, delta));
    this.layerManager.getGroup('powerUps').getChildren().forEach(pu => pu.update(delta));
  }

  updateLevelTimer() {
    if (this._levelCleared || !this.spawnDirector.running) return;

    const elapsedMs = this._runElapsedMs;
    const sec = Math.floor(elapsedMs / 1000);
    if (sec !== this._lastTimerSecond) {
      this._lastTimerSecond = sec;
      EventBus.emit(EVT.LEVEL_TIME_CHANGED, elapsedMs);
    }
  }

  buildRunEndedPayload(outcome) {
    const elapsedMs =
      outcome === 'win' ? level01.duration : this._runElapsedMs;

    return {
      outcome,
      levelId: level01.id,
      score: this.scoreSystem.score,
      elapsedMs,
      hpRemaining: this.player?.hp ?? 0,
      weaponLevel: this.weaponSystem.getLevel()
    };
  }

  endRun(outcome) {
    if (this._runEnded) return;
    this._runEnded = true;
    if (outcome === 'win') {
      this._levelCleared = true;
      EventBus.emit(EVT.LEVEL_TIME_CHANGED, level01.duration);
    }

    this.spawnDirector._stopAllWaves();
    this.physics.pause();
    this.scene.pause('GameScene');

    EventBus.emit(EVT.RUN_ENDED, this.buildRunEndedPayload(outcome));
  }

  onLevelComplete() {
    if (this._levelCleared || this._runEnded) return;
    this.endRun('win');
  }

  onPlayerDead() {
    if (this._levelCleared || this._runEnded) return;
    this.endRun('lose');
  }

  clearBattlefield() {
    if (!this.layerManager?.groups) return;
    for (const group of Object.values(this.layerManager.groups)) {
      group.clear(true, true);
    }
  }

  onFeedbackRetry() {
    this.time.removeAllEvents();
    this.spawnDirector?.reset();
    this.clearBattlefield();
    this.scoreSystem.reset();
    this.bonusDropSystem.reset();
    this.scene.restart();
  }
}
