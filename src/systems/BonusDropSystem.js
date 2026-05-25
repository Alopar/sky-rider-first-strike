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
  }

  applyConfig() {
    const drop = bonusesConfig.drop;
    this.scoreInterval = drop.scoreInterval;
    this.nextCheckAt = drop.firstCheckAt;
    this.baseChance = drop.baseChance;
    this.chanceIncrement = drop.chanceIncrement;
    this.maxChance = drop.maxChance;
    this.currentChance = drop.baseChance;

    const weapon = bonusesConfig.weaponUpgradeDrop;
    this.weaponUpgradeInterval = weapon.scoreInterval;
    this.nextWeaponUpgradeAt = weapon.firstAt;
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
      while (currentScore >= this.nextWeaponUpgradeAt) {
        this.spawnWeaponUpgrade(kill.x, kill.y);
        this.nextWeaponUpgradeAt += this.weaponUpgradeInterval;
      }
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
  }
}
