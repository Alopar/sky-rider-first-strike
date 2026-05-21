import { gameConfig } from './game-config.js';

const S = gameConfig.worldScale;

/** Как у wobbler: плавное покачивание через скорость по X */
const bonusMotion = {
  driftSpeed: 42 * S,
  swayFreq: 0.0012,
  swayAmp: 55 * S
};

/** Осколочный залп при подборе (пули игрока, player_bullet) */
const fragmentBurstEffect = {
  kind: 'fragmentBurst',
  bulletCount: 12,
  speed: 550 * S,
  /** Угол разлёта: 360 = во все стороны */
  spreadDeg: 360,
  /** Смещение первого луча (градусы, 0 = вправо, 90 = вниз) */
  startAngleDeg: -90
};

export const bonusesConfig = {
  drop: {
    /** Каждые N очков счёта — проверка на выпадение бонуса */
    scoreInterval: 100,
    /** Первая проверка при достижении этого счёта */
    firstCheckAt: 100,
    /** Стартовый шанс выпадения (0–1) */
    baseChance: 0.1,
    /** При неудаче шанс увеличивается на эту величину до следующей проверки */
    chanceIncrement: 0.1,
    /** Потолок шанса (1 = гарантия при накоплении) */
    maxChance: 1,
    /**
     * Относительные веса типа, если бонус уже выпал (сумма не обязана быть 100).
     * fragment — самый частый, shield реже, health реже щита.
     */
    typeWeights: {
      fragment: 50,
      shield: 15,
      health: 5
    }
  },
  motion: bonusMotion,
  types: {
    health: {
      id: 'health',
      textureKey: 'bonus_health',
      depth: 350,
      hitboxRadius: 10 * S,
      ...bonusMotion,
      effect: { kind: 'heal', amount: 1 }
    },
    shield: {
      id: 'shield',
      textureKey: 'bonus_shield',
      depth: 350,
      hitboxRadius: 10 * S,
      ...bonusMotion,
      effect: { kind: 'shield', amount: 1 }
    },
    fragment: {
      id: 'fragment',
      textureKey: 'bonus_fragment',
      depth: 350,
      hitboxRadius: 10 * S,
      ...bonusMotion,
      effect: { ...fragmentBurstEffect }
    }
  }
};

export function pickRandomBonusType() {
  const weights = bonusesConfig.drop.typeWeights;
  const types = bonusesConfig.types;
  const entries = Object.entries(weights).filter(([id, w]) => w > 0 && types[id]);
  if (entries.length === 0) {
    return Object.keys(bonusesConfig.types)[0];
  }

  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * totalWeight;
  for (const [typeId, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return typeId;
  }
  return entries[entries.length - 1][0];
}

export function getBonusType(typeId) {
  return bonusesConfig.types[typeId];
}
