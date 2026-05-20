import { gameConfig } from '../config/game-config.js';

const S = gameConfig.worldScale;
const R = (n) => Math.round(n * S);

export class SvgTextureFactory {
  static preloadAll(scene) {
    scene.load.svg('player', 'assets/svg/player/player.svg', { width: R(32), height: R(32) });
    scene.load.svg('player_bullet', 'assets/svg/bullets/player_bullet.svg', { width: R(8), height: R(16) });
    scene.load.svg('enemy_bullet', 'assets/svg/bullets/enemy_bullet.svg', { width: R(6), height: R(20) });
    scene.load.svg('enemy_bullet_round', 'assets/svg/bullets/enemy_bullet_round.svg', { width: R(12), height: R(12) });
    scene.load.svg('enemy_drifter', 'assets/svg/enemies/drifter.svg', { width: R(26), height: R(26) });
    scene.load.svg('enemy_hauler', 'assets/svg/enemies/hauler.svg', { width: R(32), height: R(48) });
    scene.load.svg('enemy_orb', 'assets/svg/enemies/orb.svg', { width: R(24), height: R(24) });
    scene.load.svg('enemy_wobbler', 'assets/svg/enemies/wobbler.svg', { width: R(26), height: R(26) });
    scene.load.svg('enemy_bastion', 'assets/svg/enemies/bastion.svg', { width: R(32), height: R(48) });
    scene.load.svg('enemy_striker', 'assets/svg/enemies/striker.svg', { width: R(32), height: R(32) });
    scene.load.svg('enemy_rammer', 'assets/svg/enemies/rammer.svg', { width: R(30), height: R(30) });
  }
}
