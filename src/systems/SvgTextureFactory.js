import { gameConfig } from '../config/game-config.js';

const S = gameConfig.worldScale;
const R = (n) => Math.round(n * S);

export class SvgTextureFactory {
  static preloadAll(scene) {
    scene.load.svg('player', 'assets/svg/player/player.svg', { width: R(32), height: R(32) });
    scene.load.svg('player_bullet', 'assets/svg/bullets/player_bullet.svg', { width: R(8), height: R(16) });
    scene.load.svg('enemy_bullet', 'assets/svg/bullets/enemy_bullet.svg', { width: R(10), height: R(10) });
    scene.load.svg('enemy_drifter', 'assets/svg/enemies/drifter.svg', { width: R(26), height: R(26) });
    scene.load.svg('enemy_striker', 'assets/svg/enemies/striker.svg', { width: R(32), height: R(32) });
  }
}
