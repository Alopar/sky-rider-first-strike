import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { GameScene } from './scenes/GameScene.js';
import { gameConfig } from './config/game-config.js';
import { UIOverlay } from './ui/UIOverlay.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: gameConfig.width,
  height: gameConfig.height,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, GameScene]
};

const gameContainer = document.getElementById('game');
gameContainer.style.position = 'relative';
gameContainer.style.width = `${gameConfig.width}px`;
gameContainer.style.height = `${gameConfig.height}px`;
gameContainer.style.margin = '0 auto';

const uiContainer = document.createElement('div');
uiContainer.id = 'ui-layer';
gameContainer.appendChild(uiContainer);

const game = new Phaser.Game(config);

const ui = new UIOverlay('ui-layer');
