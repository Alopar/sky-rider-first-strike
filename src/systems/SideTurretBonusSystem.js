import { gameConfig } from '../config/game-config.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

/**
 * Временный бонус: боковые турели, стреляют горизонтально пулями игрока.
 * Повторный подбор обновляет таймер, не стакается.
 */
export class SideTurretBonusSystem {
  constructor(scene, weaponSystem) {
    this.scene = scene;
    this.weaponSystem = weaponSystem;
    this.active = false;
    this.expiresAt = 0;
    this.lastFired = 0;
    this.config = null;
    this.leftTurret = null;
    this.rightTurret = null;

    this._onPlayerDead = () => this.deactivate();
    EventBus.on(EVT.PLAYER_DEAD, this._onPlayerDead, this);
  }

  activate(effect, time) {
    this.config = effect;
    this.expiresAt = time + effect.durationMs;
    this.active = true;
    this.ensureTurrets();
    this.leftTurret.setVisible(true);
    this.rightTurret.setVisible(true);
  }

  ensureTurrets() {
    if (this.leftTurret) return;

    this.leftTurret = this.scene.add
      .image(0, 0, 'player_side_turret')
      .setDepth(399);
    this.rightTurret = this.scene.add
      .image(0, 0, 'player_side_turret')
      .setFlipX(true)
      .setDepth(399);
  }

  update(time, player) {
    if (!this.active) return;
    if (!player || !player.active) {
      this.deactivate();
      return;
    }

    if (time >= this.expiresAt) {
      this.deactivate();
      return;
    }

    const cfg = this.config;
    const ox = cfg.offsetX ?? 32 * gameConfig.worldScale;
    const oy = cfg.offsetY ?? 0;

    this.leftTurret.setPosition(player.x - ox, player.y + oy);
    this.rightTurret.setPosition(player.x + ox, player.y + oy);

    const cooldown = cfg.fireCooldownMs ?? 280;
    if (time >= this.lastFired + cooldown) {
      this.lastFired = time;
      const speed = cfg.bulletSpeed ?? 600 * gameConfig.worldScale;
      this.weaponSystem.fireHorizontalShot(
        this.leftTurret.x,
        this.leftTurret.y,
        -1,
        speed
      );
      this.weaponSystem.fireHorizontalShot(
        this.rightTurret.x,
        this.rightTurret.y,
        1,
        speed
      );
    }
  }

  deactivate() {
    this.active = false;
    this.expiresAt = 0;
    this.config = null;
    if (this.leftTurret) {
      this.leftTurret.setVisible(false);
      this.rightTurret.setVisible(false);
    }
  }

  destroy() {
    EventBus.off(EVT.PLAYER_DEAD, this._onPlayerDead, this);
    this.leftTurret?.destroy();
    this.rightTurret?.destroy();
    this.leftTurret = null;
    this.rightTurret = null;
  }
}
