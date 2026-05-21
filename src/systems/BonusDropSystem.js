import { bonusesConfig, pickRandomBonusType } from '../config/bonuses.js';
import { PowerUp } from '../entities/powerups/PowerUp.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

export class BonusDropSystem {
  constructor(scene, layerManager, scoreSystem) {
    this.scene = scene;
    this.layerManager = layerManager;
    this.scoreSystem = scoreSystem;

    this.applyDropConfig(bonusesConfig.drop);

    EventBus.on(EVT.ENEMY_KILLED, this.onEnemyKilled, this);
  }

  applyDropConfig(drop) {
    this.scoreInterval = drop.scoreInterval;
    this.nextCheckAt = drop.firstCheckAt;
    this.baseChance = drop.baseChance;
    this.chanceIncrement = drop.chanceIncrement;
    this.maxChance = drop.maxChance;
    this.currentChance = drop.baseChance;
  }

  onEnemyKilled(_points, x, y) {
    const currentScore = this.scoreSystem.score;

    while (currentScore >= this.nextCheckAt) {
      if (Math.random() < this.currentChance) {
        this.spawnBonus(x, y);
        this.currentChance = this.baseChance;
      } else {
        this.currentChance = Math.min(
          this.maxChance,
          this.currentChance + this.chanceIncrement
        );
      }
      this.nextCheckAt += this.scoreInterval;
    }
  }

  spawnBonus(x, y) {
    const typeId = pickRandomBonusType();
    new PowerUp(this.scene, this.layerManager, x, y, typeId);
  }

  reset() {
    this.applyDropConfig(bonusesConfig.drop);
  }

  destroy() {
    EventBus.off(EVT.ENEMY_KILLED, this.onEnemyKilled, this);
  }
}
