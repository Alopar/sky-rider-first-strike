import { EventBus } from '../systems/EventBus.js';
import { EVT } from '../systems/events.js';
import { gameConfig } from '../config/game-config.js';

export class UIOverlay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    const w = gameConfig.width;
    const h = gameConfig.height;

    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = `${w}px`;
    this.container.style.height = `${h}px`;
    this.container.style.pointerEvents = 'none';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.color = '#fff';
    this.container.style.fontFamily = 'sans-serif';
    this.container.style.boxSizing = 'border-box';

    this.buildHUD();
    this.setupListeners();
  }

  buildHUD() {
    this.container.innerHTML = '';
    
    this.hudElement = document.createElement('div');
    this.hudElement.style.position = 'absolute';
    this.hudElement.style.top = '10px';
    this.hudElement.style.left = '10px';
    this.hudElement.style.right = '10px';
    this.hudElement.style.display = 'flex';
    this.hudElement.style.justifyContent = 'space-between';
    this.hudElement.style.fontSize = '32px';
    this.hudElement.style.fontWeight = 'bold';
    
    this.scoreElement = document.createElement('div');
    this.scoreElement.innerText = 'SCORE: 0';
    
    this.hpElement = document.createElement('div');
    this.hpElement.innerText = 'HP: 3';

    this.hudElement.appendChild(this.scoreElement);
    this.hudElement.appendChild(this.hpElement);
    this.container.appendChild(this.hudElement);

    this.gameOverElement = document.createElement('div');
    this.gameOverElement.style.position = 'absolute';
    this.gameOverElement.style.top = '50%';
    this.gameOverElement.style.left = '50%';
    this.gameOverElement.style.transform = 'translate(-50%, -50%)';
    this.gameOverElement.style.fontSize = '72px';
    this.gameOverElement.style.fontWeight = 'bold';
    this.gameOverElement.style.color = '#D63A3A';
    this.gameOverElement.style.display = 'none';
    this.gameOverElement.innerText = 'GAME OVER';

    this.container.appendChild(this.gameOverElement);
  }

  setupListeners() {
    EventBus.on(EVT.SCORE_CHANGED, (score, multiplier) => {
      this.scoreElement.innerText = `SCORE: ${score} ${multiplier > 1 ? '(x' + multiplier + ')' : ''}`;
    });

    EventBus.on(EVT.HP_CHANGED, (hp) => {
      this.hpElement.innerText = `HP: ${hp}`;
    });

    EventBus.on(EVT.GAME_OVER, () => {
      this.gameOverElement.style.display = 'block';
    });

    EventBus.on(EVT.GAME_START, () => {
      this.hpElement.innerText = 'HP: 3';
      this.scoreElement.innerText = 'SCORE: 0';
      this.gameOverElement.style.display = 'none';
    });
  }
}
