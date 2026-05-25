import { enemiesConfig as baseEnemiesConfig } from './enemies.js';
import { level01 as baseLevel01 } from './levels/level-01.js';

/** Текущая ревизия баланса после итерации по feedback */
export const MUTATION_REVISION = 1;

/**
 * Итерация 1 — feedback 2026-05-25 (win, weapon 5, difficulty 0.3):
 * - крупный мусор крепче под прокачанное оружие;
 * - вторая половина (≥150 с): больше стреляющих врагов и чаще залпы.
 */
const LATE_GAME_MS = 150000;
const SHOOTER_TYPES = new Set(['bastion', 'dreadnought', 'striker']);

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
    interval: 1100,
    xRandom: true,
    xRatioFrom: 0.08,
    xRatioTo: 0.92
  },
  { time: 268000, type: 'bastion', count: 3, interval: 340, pattern: 'wideChain', xRatioFrom: 0.12, xRatioTo: 0.88 },
  { time: 269500, type: 'dreadnought', count: 1, xRatio: 0.62 }
];

function cloneConfig(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function applyEnemyMutations(cfg) {
  for (const id of ['debrisLargeRock', 'debrisLargeChunk', 'debrisLargeShard']) {
    if (cfg[id]) cfg[id].hp = 9;
  }
  if (cfg.debrisMegaCharge) cfg.debrisMegaCharge.hp = 26;
  return cfg;
}

function applyLevelMutations(level) {
  const waves = [...level.waves, ...LATE_PRESSURE_WAVES];

  for (const wave of waves) {
    if (wave.time < LATE_GAME_MS || !SHOOTER_TYPES.has(wave.type)) continue;
    if (wave.interval != null) {
      wave.interval = Math.max(120, Math.round(wave.interval * 0.82));
    }
    if (wave.count != null) {
      wave.count = Math.ceil(wave.count * 1.2);
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
  if (elapsedMs < LATE_GAME_MS || !SHOOTER_TYPES.has(typeId)) return 1;
  return 0.68;
}
