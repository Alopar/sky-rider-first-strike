import { enemiesConfig as baseEnemiesConfig } from './enemies.js';
import { level01 as baseLevel01 } from './levels/level-01.js';

/** Текущая ревизия баланса после итерации по feedback */
export const MUTATION_REVISION = 2;

/**
 * Итерация 1 — feedback 2026-05-25 (difficulty 0.3):
 * крупный мусор крепче; вторая половина — больше стрелков.
 *
 * Итерация 2 — feedback 2026-05-25 (difficulty 0.1, pace 1):
 * dreadnought значительно крепче; с 2:30 — плотнее стрелки, с 3:00 — больше врагов верхнего слоя.
 */
const LATE_GAME_MS = 150000;
const THIRD_MINUTE_MS = 180000;
const SHOOTER_TYPES = new Set(['bastion', 'dreadnought', 'striker']);
const FG_DENSITY_TYPES = new Set(['orb', 'wobbler', 'striker', 'bastion', 'dreadnought']);

const LATE_PRESSURE_WAVES = [
  { time: 150500, type: 'bastion', count: 2, interval: 420, pattern: 'wideChain', xRatioFrom: 0.28, xRatioTo: 0.72 },
  { time: 152000, type: 'striker', count: 3, interval: 400, pattern: 'snake', xRatioFrom: 0.18, xRatioTo: 0.82 },
  { time: 187000, type: 'dreadnought', count: 1, xRatio: 0.5 },
  { time: 187800, type: 'bastion', count: 2, interval: 380, pattern: 'zigzag', xRatioFrom: 0.22, xRatioTo: 0.78 },
  { time: 216000, type: 'striker', count: 4, interval: 360, pattern: 'wideChain', xRatioFrom: 0.1, xRatioTo: 0.9 },
  {
    time: 249000,
    mode: 'stream',
    type: 'striker',
    duration: 48000,
    interval: 900,
    xRandom: true,
    xRatioFrom: 0.08,
    xRatioTo: 0.92
  },
  { time: 268000, type: 'bastion', count: 3, interval: 340, pattern: 'wideChain', xRatioFrom: 0.12, xRatioTo: 0.88 },
  { time: 269500, type: 'dreadnought', count: 1, xRatio: 0.62 }
];

/** Доп. волны итерации 2 — давление пулями и плотность с 3-й минуты */
const REV2_PRESSURE_WAVES = [
  { time: 180500, type: 'bastion', count: 2, interval: 360, pattern: 'wideChain', xRatioFrom: 0.2, xRatioTo: 0.8 },
  { time: 181200, type: 'striker', count: 4, interval: 320, pattern: 'snake', xRatioFrom: 0.12, xRatioTo: 0.88 },
  { time: 192000, type: 'dreadnought', count: 1, xRatio: 0.38 },
  { time: 193000, type: 'bastion', count: 3, interval: 340, pattern: 'zigzag', xRatioFrom: 0.15, xRatioTo: 0.85 },
  { time: 204500, type: 'striker', count: 4, interval: 380, pattern: 'wedge', xRatioFrom: 0.22, xRatioTo: 0.78 },
  { time: 220000, type: 'dreadnought', count: 1, xRatio: 0.55 },
  { time: 221000, type: 'bastion', count: 3, interval: 360, pattern: 'wideChain', xRatioFrom: 0.08, xRatioTo: 0.92 },
  { time: 235000, type: 'striker', count: 5, interval: 300, pattern: 'zigzag', xRatioFrom: 0.1, xRatioTo: 0.9 },
  {
    time: 251000,
    mode: 'stream',
    type: 'bastion',
    duration: 42000,
    interval: 2800,
    count: 14,
    xRandom: true,
    xRatioFrom: 0.1,
    xRatioTo: 0.9
  },
  { time: 258000, type: 'dreadnought', count: 1, xRatio: 0.48 },
  { time: 274000, type: 'bastion', count: 2, interval: 280, pattern: 'wideChain', xRatioFrom: 0.25, xRatioTo: 0.75 },
  { time: 275500, type: 'dreadnought', count: 1, xRatio: 0.52 },
  { time: 288000, type: 'striker', count: 6, interval: 260, pattern: 'wedge', xRatioFrom: 0.05, xRatioTo: 0.95 }
];

function cloneConfig(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function applyEnemyMutations(cfg) {
  for (const id of ['debrisLargeRock', 'debrisLargeChunk', 'debrisLargeShard']) {
    if (cfg[id]) cfg[id].hp = 9;
  }
  if (cfg.debrisMegaCharge) cfg.debrisMegaCharge.hp = 26;
  if (cfg.dreadnought) cfg.dreadnought.hp = 24;
  if (cfg.miniBoss) cfg.miniBoss.hp = (cfg.dreadnought?.hp ?? 24) * 6;
  if (cfg.bastion) cfg.bastion.hp = 8;
  return cfg;
}

function tuneShooterWave(wave, fromThirdMinute) {
  if (wave.interval != null) {
    const intervalMul = fromThirdMinute ? 0.72 : 0.78;
    wave.interval = Math.max(100, Math.round(wave.interval * intervalMul));
  }
  if (wave.count != null) {
    const countMul = fromThirdMinute ? 1.4 : 1.28;
    wave.count = Math.ceil(wave.count * countMul);
  }
}

function tuneFgDensityWave(wave) {
  if (wave.mode === 'stream') return;
  if (wave.interval != null) {
    wave.interval = Math.max(90, Math.round(wave.interval * 0.88));
  }
  if (wave.count != null) {
    wave.count = Math.ceil(wave.count * 1.25);
  }
}

function applyLevelMutations(level) {
  const waves = [...level.waves, ...LATE_PRESSURE_WAVES, ...REV2_PRESSURE_WAVES];

  for (const wave of waves) {
    const t = wave.time;

    if (SHOOTER_TYPES.has(wave.type) && t >= LATE_GAME_MS) {
      tuneShooterWave(wave, t >= THIRD_MINUTE_MS);
    } else if (FG_DENSITY_TYPES.has(wave.type) && t >= THIRD_MINUTE_MS) {
      tuneFgDensityWave(wave);
    }
  }

  waves.sort((a, b) => a.time - b.time);
  return { ...level, waves };
}

let _cached = null;

/** Активные конфиги уровня и врагов с учётом мутаций */
export function getMutatedGameConfigs() {
  if (_cached && _cached.revision === MUTATION_REVISION) {
    return _cached;
  }

  const enemies = applyEnemyMutations(cloneConfig(baseEnemiesConfig));
  const level = applyLevelMutations(cloneConfig(baseLevel01));

  _cached = { revision: MUTATION_REVISION, enemies, level };
  return _cached;
}

/** Множитель fireRate для спавна: <1 — стреляют чаще */
export function fireRateMulForSpawn(typeId, elapsedMs) {
  if (!SHOOTER_TYPES.has(typeId)) return 1;
  if (elapsedMs >= THIRD_MINUTE_MS) return 0.5;
  if (elapsedMs >= LATE_GAME_MS) return 0.58;
  return 1;
}
