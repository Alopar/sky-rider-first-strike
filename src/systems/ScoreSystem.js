import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

export class ScoreSystem {
  constructor() {
    this.score = 0;
    this.multiplier = 1;
    this.combo = 0;

    EventBus.on(EVT.ENEMY_KILLED, this.onEnemyKilled, this);
    EventBus.on(EVT.PLAYER_HIT, this.onPlayerHit, this);
  }

  onEnemyKilled(points) {
    this.addScore(points);
  }

  onPlayerHit() {
    this.resetMultiplier();
  }

  destroy() {
    EventBus.off(EVT.ENEMY_KILLED, this.onEnemyKilled, this);
    EventBus.off(EVT.PLAYER_HIT, this.onPlayerHit, this);
  }

  addScore(points) {
    this.combo++;
    if (this.combo > 10) this.multiplier = 2;
    if (this.combo > 25) this.multiplier = 3;

    this.score += points * this.multiplier;
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.multiplier);
  }

  resetMultiplier() {
    this.combo = 0;
    this.multiplier = 1;
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.multiplier);
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.multiplier = 1;
    EventBus.emit(EVT.SCORE_CHANGED, this.score, this.multiplier);
  }
}
