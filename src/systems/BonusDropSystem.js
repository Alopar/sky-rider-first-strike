import {
  bonusesConfig,
  pickRandomBonusType,
  WEAPON_UPGRADE_BONUS_ID
} from '../config/bonuses.js';
import { PowerUp } from '../entities/powerups/PowerUp.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

export class BonusDropSystem {
  constructor(scene, layerManager, scoreSystem) {
    this.scene = scene;
    this.layerManager = layerManager;
    this.scoreSystem = scoreSystem;

    this.applyConfig();

    EventBus.on(EVT.ENEMY_KILLED, this.onEnemyKilled, this);
    EventBus.on(EVT.SCORE_CHANGED, this.onScoreChanged, this);
    EventBus.on(EVT.WEAPON_LEVEL_CHANGED, this.onWeaponLevelChanged, this);
  }

  applyConfig() {
    const drop = bonusesConfig.drop;
    this.scoreInterval = drop.scoreInterval;
    this.nextCheckAt = drop.firstCheckAt;
    this.baseChance = drop.baseChance;
    this.chanceIncrement = drop.chanceIncrement;
    this.maxChance = drop.maxChance;
    this.currentChance = drop.baseChance;

    this.weaponUpgradeStep = bonusesConfig.weaponUpgradeDrop.scoreStep;
    this.resetWeaponUpgradeProgress();
  }

  getWeaponLevel() {
    return this.scene.registry.get('weaponSystem')?.getLevel() ?? 1;
  }

  /** Порог внутреннего счётчика: тир × 250 (тир 1 → 250, тир 3 → 750) */
  getWeaponUpgradeThreshold() {
    return this.getWeaponLevel() * this.weaponUpgradeStep;
  }

  resetWeaponUpgradeProgress() {
    this.weaponUpgradePoints = 0;
    this._lastMainScore = this.scoreSystem.score;
  }

  onScoreChanged(score) {
    if (score === 0) {
      this.resetWeaponUpgradeProgress();
      return;
    }

    const delta = score - this._lastMainScore;
    this._lastMainScore = score;

    if (delta > 0) {
      this.weaponUpgradePoints += delta;
    } else if (delta < 0) {
      this.weaponUpgradePoints = Math.max(0, this.weaponUpgradePoints + delta);
    }
  }

  onWeaponLevelChanged() {
    this.weaponUpgradePoints = 0;
  }

  trySpawnWeaponUpgrades(x, y) {
    let threshold = this.getWeaponUpgradeThreshold();

    while (this.weaponUpgradePoints >= threshold) {
      this.spawnWeaponUpgrade(x, y);
      this.weaponUpgradePoints = 0;
      threshold = this.getWeaponUpgradeThreshold();
    }
  }

  onEnemyKilled(payload) {
    const kill = typeof payload === 'object'
      ? payload
      : { score: payload, guaranteedBonusDrop: false };
    if (kill.guaranteedBonusDrop && kill.x != null && kill.y != null) {
      this.spawnBonus(kill.x, kill.y);
    }

    if (kill.bonusDropChanceBonus > 0) {
      this.currentChance = Math.min(
        this.maxChance,
        this.currentChance + kill.bonusDropChanceBonus
      );
    }

    const currentScore = this.scoreSystem.score;

    if (kill.x != null && kill.y != null) {
      this.trySpawnWeaponUpgrades(kill.x, kill.y);
    }

    while (currentScore >= this.nextCheckAt) {
      if (Math.random() < this.currentChance && kill.x != null && kill.y != null) {
        this.spawnBonus(kill.x, kill.y);
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

  spawnWeaponUpgrade(x, y) {
    new PowerUp(this.scene, this.layerManager, x, y, WEAPON_UPGRADE_BONUS_ID);
  }

  reset() {
    this.applyConfig();
  }

  destroy() {
    EventBus.off(EVT.ENEMY_KILLED, this.onEnemyKilled, this);
    EventBus.off(EVT.SCORE_CHANGED, this.onScoreChanged, this);
    EventBus.off(EVT.WEAPON_LEVEL_CHANGED, this.onWeaponLevelChanged, this);
  }
}
