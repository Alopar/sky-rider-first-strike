/** Внутреннее разрешение рендера: Full HD, 16:9 */
const WORLD_SCALE = 1.5;

export const gameConfig = {
  width: 1920,
  height: 1080,
  /** Общий множитель размеров спрайтов, скоростей и хитбоксов */
  worldScale: WORLD_SCALE,
  player: {
    speed: Math.round(300 * WORLD_SCALE),
    hitboxRadius: 8 * WORLD_SCALE,
    /** Половина стороны квадрата текстуры игрока (подстройка круга физики) */
    textureHalf: 16 * WORLD_SCALE
  }
};
