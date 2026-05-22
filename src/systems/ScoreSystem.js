import { EventBus } from './EventBus.js';
import { EVT } from './events.js';

export class ScoreSystem {
  constructor() {
    this.score = 0;

    EventBus.on(EVT.ENEMY_KILLED, this.onEnemyKilled, this);
  }

  onEnemyKilled(payload) {
    const points = typeof payload === 'object' ? payload.score : payload;
    this.addScore(points);
  }

  destroy() {
    EventBus.off(EVT.ENEMY_KILLED, this.onEnemyKilled, this);
  }

  addScore(points) {
    this.score += points;
    EventBus.emit(EVT.SCORE_CHANGED, this.score);
  }

  reset() {
    this.score = 0;
    EventBus.emit(EVT.SCORE_CHANGED, this.score);
  }
}
