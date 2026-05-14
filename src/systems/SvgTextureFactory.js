export class SvgTextureFactory {
  static preloadAll(scene) {
    scene.load.svg('player', 'assets/svg/player/player.svg', { width: 32, height: 32 });
    scene.load.svg('player_bullet', 'assets/svg/bullets/player_bullet.svg', { width: 8, height: 16 });
    scene.load.svg('enemy_bullet', 'assets/svg/bullets/enemy_bullet.svg', { width: 10, height: 10 });
    scene.load.svg('enemy_drifter', 'assets/svg/enemies/drifter.svg', { width: 26, height: 26 });
    scene.load.svg('enemy_striker', 'assets/svg/enemies/striker.svg', { width: 32, height: 32 });
  }
}
