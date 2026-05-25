import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { GameScene } from './scenes/GameScene.js';
import { gameConfig } from './config/game-config.js';
import { UIOverlay } from './ui/UIOverlay.js';
import { EndGameFeedbackScreen } from './ui/EndGameFeedbackScreen.js';
import { MainMenuScreen } from './ui/MainMenuScreen.js';

const W = gameConfig.width;
const H = gameConfig.height;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, GameScene]
};

const scaler = document.getElementById('game-viewport-scaler');
const viewport = document.getElementById('game-viewport');
const gameParent = document.getElementById('game');

function layoutGameShell() {
  const pad = 24;
  const sx = (window.innerWidth - pad) / W;
  const sy = (window.innerHeight - pad) / H;
  const scale = Math.min(sx, sy, 1);

  viewport.style.width = `${W}px`;
  viewport.style.height = `${H}px`;
  viewport.style.transformOrigin = 'top left';
  viewport.style.transform = `scale(${scale})`;

  scaler.style.width = `${W * scale}px`;
  scaler.style.height = `${H * scale}px`;
}

layoutGameShell();
window.addEventListener('resize', layoutGameShell);

gameParent.style.position = 'absolute';
gameParent.style.left = '0';
gameParent.style.top = '0';
gameParent.style.width = `${W}px`;
gameParent.style.height = `${H}px`;

const uiContainer = document.createElement('div');
uiContainer.id = 'ui-layer';
viewport.appendChild(uiContainer);

uiContainer.style.position = 'absolute';
uiContainer.style.left = '0';
uiContainer.style.top = '0';
uiContainer.style.width = `${W}px`;
uiContainer.style.height = `${H}px`;
uiContainer.style.zIndex = '2';
uiContainer.style.pointerEvents = 'none';
uiContainer.style.boxSizing = 'border-box';

const game = new Phaser.Game(config);
new UIOverlay('ui-layer');
new EndGameFeedbackScreen('ui-layer');

const mainMenu = new MainMenuScreen('ui-layer', () => {
  game.scene.start('GameScene');
});
mainMenu.show();
