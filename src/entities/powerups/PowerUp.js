import { gameConfig } from '../../config/game-config.js';
import { getBonusType } from '../../config/bonuses.js';
import { EventBus } from '../../systems/EventBus.js';
import { EVT } from '../../systems/events.js';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, layerManager, x, y, typeId) {
    const config = getBonusType(typeId);
    super(scene, x, y, config.textureKey);

    this.bonusConfig = config;
    this.typeId = typeId;
    this.swayPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const r = config.hitboxRadius;
    const d = r * 2;
    this.body.setCircle(r, (this.displayWidth - d) / 2, (this.displayHeight - d) / 2);
    this.setDepth(config.depth);

    layerManager.getGroup('powerUps').add(this);
  }

  update(dt) {
    const cfg = this.bonusConfig;
    const dtMs = dt ?? 0;
    const freq = cfg.swayFreq ?? 0.0012;
    const amp = cfg.swayAmp ?? 55 * gameConfig.worldScale;

    this.swayPhase += dtMs * freq;
    this.setVelocity(Math.sin(this.swayPhase) * amp, cfg.driftSpeed);

    const margin = 60;
    if (this.y > gameConfig.height + margin) {
      this.destroy();
    }
  }

  collect() {
    const player = this.scene.registry.get('playerRef');
    if (player && player.active) {
      this.applyEffect(player);
    }
    EventBus.emit(EVT.BONUS_PICKED, this.typeId);
    this.destroy();
  }

  applyEffect(player) {
    const effect = this.bonusConfig.effect;
    if (effect.kind === 'heal') {
      player.heal(effect.amount);
    } else if (effect.kind === 'shield') {
      player.grantShield();
    } else if (effect.kind === 'fragmentBurst') {
      const weaponSystem = this.scene.registry.get('weaponSystem');
      weaponSystem?.fireFragmentBurst(player.x, player.y, effect);
    }
  }
}
