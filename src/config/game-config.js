/** Внутреннее разрешение рендера: Full HD, 16:9 */
const WORLD_SCALE = 2.25;

export const gameConfig = {
  width: 1920,
  height: 1080,
  /** Общий множитель размеров спрайтов, скоростей и хитбоксов */
  worldScale: WORLD_SCALE,
  player: {
    speed: Math.round(300 * WORLD_SCALE),
    hitboxRadius: 8 * WORLD_SCALE,
    /** Половина стороны квадрата текстуры игрока (подстройка круга физики) */
    textureHalf: 16 * WORLD_SCALE,
    startHp: 3,
    maxHp: 3
  },
  /** Зоны появления врагов (доли ширины экрана, 0–1) */
  spawnZones: {
    /** Основные (красные) враги: центральные 80%, по 10% с каждого края свободны */
    main: {
      sideMarginRatio: 0.1
    }
  },
  /** Серые обломки (астероиды) */
  debris: {
    /** Разброс скорости от базовой: ±доля (0.15 = ±15%) */
    speedVariance: 0.15,
    /** Угол отклонения осколков от вектора полёта при расколе (радианы) */
    splitAngleRad: 0.55,
    /** Скорость разлёта осколков и пуль при уничтожении */
    scatterSpeed: {
      /** Как у малых астероидов (пикс/с) */
      fragment: 95 * WORLD_SCALE,
      /** Пули чуть быстрее осколков */
      bulletOverFragment: 1.12
    },
    /** Вращение вокруг оси (радиан/с) */
    spinRadPerSec: {
      mega: { min: 0.8, max: 1.5 },
      large: { min: 1.4, max: 2.8 },
      small: { min: 2.2, max: 4.2 }
    },
    /** Радиальный взрыв мега-астероида */
    megaBurst: {
      largeFragmentCount: 3,
      smallFragmentCount: 5,
      scatterSpeed: {
        large: { min: 115 * WORLD_SCALE, max: 185 * WORLD_SCALE },
        small: { min: 95 * WORLD_SCALE, max: 165 * WORLD_SCALE }
      },
      vfxBursts: 3,
      vfxBurstDelayMs: 75,
      vfxJitter: 18
    }
  },
  weapon: {
    overdrive: {
      fireRateMultiplier: 1.25,
      durationMs: 10000
    }
  },
  /** Бонус: орбитальные энергосферы */
  bonuses: {
    orbitalSphere: {
      /** Время действия (мс) */
      durationMs: 30000,
      /** Радиус орбиты вокруг корабля (px) */
      orbitRadius: 75 * WORLD_SCALE,
      /** Скорость вращения по орбите (радиан/с) */
      angularSpeedRad: 5,
      maxSpheres: 3,
      hitRadius: 12 * WORLD_SCALE,
      damage: 1,
      hitCooldownMs: 220
    }
  }
};
