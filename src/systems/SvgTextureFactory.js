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
    scene.load.svg('enemy_debris_mega_charge', 'assets/svg/enemies/debris_mega_charge.svg', { width: R(52), height: R(52) });
    scene.load.svg('enemy_debris_large_rock', 'assets/svg/enemies/debris_large_rock.svg', { width: R(36), height: R(36) });
    scene.load.svg('enemy_debris_large_chunk', 'assets/svg/enemies/debris_large_chunk.svg', { width: R(40), height: R(32) });
    scene.load.svg('enemy_debris_large_shard', 'assets/svg/enemies/debris_large_shard.svg', { width: R(34), height: R(38) });
    scene.load.svg('enemy_debris_small_rock', 'assets/svg/enemies/debris_small_rock.svg', { width: R(20), height: R(20) });
    scene.load.svg('enemy_debris_small_chunk', 'assets/svg/enemies/debris_small_chunk.svg', { width: R(22), height: R(18) });
    scene.load.svg('enemy_debris_small_shard', 'assets/svg/enemies/debris_small_shard.svg', { width: R(18), height: R(20) });
    scene.load.svg('bonus_health', 'assets/svg/powerups/bonus_health.svg', { width: R(20), height: R(20) });
    scene.load.svg('bonus_shield', 'assets/svg/powerups/bonus_shield.svg', { width: R(20), height: R(20) });
    scene.load.svg('bonus_fragment', 'assets/svg/powerups/bonus_fragment.svg', { width: R(20), height: R(20) });
    scene.load.svg('player_shield_ring', 'assets/svg/powerups/player_shield_ring.svg', { width: R(50), height: R(50) });
  }
}
