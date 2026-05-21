import { gameConfig } from './game-config.js';

const S = gameConfig.worldScale;

/** Как у wobbler: плавное покачивание через скорость по X */
const bonusMotion = {
  driftSpeed: 42 * S,
  swayFreq: 0.0012,
  swayAmp: 55 * S
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
    maxChance: 1
  },
  motion: bonusMotion,
  types: {
    health: {
      id: 'health',
      textureKey: 'bonus_health',
      depth: 350,
      hitboxRadius: 10 * S,
      ...bonusMotion,
      effect: { kind: 'heal', amount: 1 },
      weight: 1
    },
    shield: {
      id: 'shield',
      textureKey: 'bonus_shield',
      depth: 350,
      hitboxRadius: 10 * S,
      ...bonusMotion,
      effect: { kind: 'shield', amount: 1 },
      weight: 1
    }
  }
};

const typeList = Object.values(bonusesConfig.types);

export function pickRandomBonusType() {
  const totalWeight = typeList.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const type of typeList) {
    roll -= type.weight;
    if (roll <= 0) return type.id;
  }
  return typeList[0].id;
}

export function getBonusType(typeId) {
  return bonusesConfig.types[typeId];
}
