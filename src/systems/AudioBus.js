import { gameConfig } from '../config/game-config.js';
import { SfxGenerator } from '../audio/SfxGenerator.js';
import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

const SHIP_HP_VOLUME = {
  dreadnought: 1.15,
  bastion: 1.05
};

export class AudioBus {
  constructor(scene) {
    this.scene = scene;
    this._masterVolume = gameConfig.audio?.sfxVolume ?? 1;
    this._unlocked = false;

    this._onPlayerFire = () => this._playPlayerShoot();
    this._onEnemyKilled = (data) => this._playEnemyKilled(data);
    this._onBonusPicked = (typeId) => this._playBonusPickup(typeId);

    this._resumeHandler = () => this._tryUnlock();
  }

  init() {
    if (!gameConfig.audio?.sfxEnabled) return;

    SfxGenerator.bakeAll();

    EventBus.on(EVT.PLAYER_FIRE, this._onPlayerFire, this);
    EventBus.on(EVT.ENEMY_KILLED, this._onEnemyKilled, this);
    EventBus.on(EVT.BONUS_PICKED, this._onBonusPicked, this);

    this.scene.input?.once('pointerdown', this._resumeHandler);
    if (this.scene.input?.keyboard) {
      this.scene.input.keyboard.once('keydown', this._resumeHandler);
    }
    window.addEventListener('pointerdown', this._resumeHandler, { once: true });
    window.addEventListener('keydown', this._resumeHandler, { once: true });
  }

  destroy() {
    EventBus.off(EVT.PLAYER_FIRE, this._onPlayerFire, this);
    EventBus.off(EVT.ENEMY_KILLED, this._onEnemyKilled, this);
    EventBus.off(EVT.BONUS_PICKED, this._onBonusPicked, this);

    this.scene.input?.off('pointerdown', this._resumeHandler);
    if (this.scene.input?.keyboard) {
      this.scene.input.keyboard.off('keydown', this._resumeHandler);
    }
    window.removeEventListener('pointerdown', this._resumeHandler);
    window.removeEventListener('keydown', this._resumeHandler);
  }

  async _tryUnlock() {
    const ok = await SfxGenerator.resume();
    if (ok) this._unlocked = true;
  }

  _opts(extra = {}) {
    return { masterVolume: this._masterVolume, ...extra };
  }

  _ensureRunning() {
    if (SfxGenerator.isRunning()) {
      this._unlocked = true;
      return true;
    }
    if (!this._unlocked) {
      SfxGenerator.resume().then((ok) => {
        if (ok) this._unlocked = true;
      });
    }
    return SfxGenerator.isRunning();
  }

  _playPlayerShoot() {
    if (!this._ensureRunning()) return;
    SfxGenerator.play('playerShoot', this._opts({ volume: 0.72, detune: SfxGenerator.randomDetune(8) }));
  }

  _playBonusPickup(typeId) {
    if (!this._ensureRunning()) return;
    const hash = typeId ? typeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
    const detune = ((hash % 7) - 3) * 25;
    SfxGenerator.play('bonusPickup', this._opts({ detune }));
  }

  _playEnemyKilled(data) {
    if (!data || !this._ensureRunning()) return;

    const { layer, id, stage } = data;

    if (layer === 'debrisEnemies') {
      if (stage === 'mega' || (id && id.startsWith('debrisMega'))) {
        this._playMegaExplode();
        return;
      }
      if (stage === 'large') {
        SfxGenerator.play('debrisLarge', this._opts({ detune: SfxGenerator.randomDetune() }));
        return;
      }
      SfxGenerator.play('debrisSmall', this._opts({ detune: SfxGenerator.randomDetune() }));
      return;
    }

    if (layer === 'bgEnemies') {
      const vol = id === 'hauler' ? 1 : 0.72;
      SfxGenerator.play('crateExplode', this._opts({ volume: vol, detune: SfxGenerator.randomDetune() }));
      return;
    }

    if (layer === 'fgEnemies') {
      const scale = SHIP_HP_VOLUME[id] ?? 1;
      SfxGenerator.play('shipExplode', this._opts({ volume: scale, detune: SfxGenerator.randomDetune(20) }));
    }
  }

  _playMegaExplode() {
    const delaySec = (gameConfig.debris?.megaBurst?.vfxBurstDelayMs ?? 75) / 1000;
    const bursts = gameConfig.debris?.megaBurst?.vfxBursts ?? 3;

    for (let i = 0; i < bursts; i++) {
      const vol = 0.85 + i * 0.12;
      const detune = -i * 40 + SfxGenerator.randomDetune(15);
      SfxGenerator.playAt('megaHit', i * delaySec, this._opts({ volume: vol, detune }));
    }
  }
}
