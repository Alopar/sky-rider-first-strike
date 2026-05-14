import { SvgTextureFactory } from '../systems/SvgTextureFactory.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Используем встроенный лоадер Phaser для SVG файлов
    SvgTextureFactory.preloadAll(this);
  }

  create() {
    // Start game
    this.scene.start('GameScene');
  }
}
