/** Паттерны раскладки точек спавна (ratioX 0–1, yOffset от базового y=-50). */

const DEFAULT_FROM = 0.08;
const DEFAULT_TO = 0.92;

function getCorridor(wave) {
  const from = wave.xRatioFrom ?? wave.xRatio ?? DEFAULT_FROM;
  const to = wave.xRatioTo ?? wave.xRatio ?? DEFAULT_TO;
  const center = wave.xRatio ?? (from + to) / 2;
  return { from, to, center };
}

function getSpread(wave) {
  return wave.patternSpread ?? 0.35;
}

function baseYOffset(wave) {
  return wave.spawnYOffset ?? wave.yOffset ?? 0;
}

function patternLine(wave, index, count, corridor) {
  const t = count > 1 ? index / (count - 1) : 0;
  return {
    ratioX: corridor.from + t * (corridor.to - corridor.from),
    yOffset: baseYOffset(wave)
  };
}

function patternSnake(wave, _index, _count, corridor) {
  return {
    ratioX: corridor.center,
    yOffset: baseYOffset(wave)
  };
}

function patternZigzag(wave, index, count, corridor) {
  const spread = getSpread(wave) * Math.abs(corridor.to - corridor.from);
  const inset = spread * 0.12;
  const left = corridor.from + inset;
  const right = corridor.to - inset;
  const ratioX = index % 2 === 0 ? left : right;
  const rowStep = (wave.spawnYOffset ?? wave.yOffset ?? 14) * 0.35;
  const yOffset = baseYOffset(wave) + (index % 2 === 0 ? -rowStep : rowStep);
  return { ratioX, yOffset };
}

function patternChecker(wave, index, count, corridor) {
  const cols = Math.max(1, Math.ceil(count / 2));
  const col = Math.floor(index / 2);
  const row = index % 2;
  const t = cols > 1 ? col / (cols - 1) : 0.5;
  const ratioX = corridor.from + t * (corridor.to - corridor.from);
  const step = wave.spawnYOffset ?? wave.yOffset ?? 20;
  const yOffset = baseYOffset(wave) + (row === 0 ? -step * 0.5 : step * 0.5);
  return { ratioX, yOffset };
}

function patternWedge(wave, index, count, corridor) {
  const span = Math.abs(corridor.to - corridor.from);
  const step = (getSpread(wave) * span) / Math.max(1, Math.ceil(count / 2));
  if (index === 0) {
    return { ratioX: corridor.center, yOffset: baseYOffset(wave) };
  }
  const pair = Math.ceil(index / 2);
  const side = index % 2 === 1 ? -1 : 1;
  const rowStep = (wave.spawnYOffset ?? wave.yOffset ?? 12) * 0.4;
  return {
    ratioX: corridor.center + side * pair * step,
    yOffset: baseYOffset(wave) + side * rowStep * (pair - 1)
  };
}

const PATTERN_FNS = {
  line: patternLine,
  snake: patternSnake,
  zigzag: patternZigzag,
  checker: patternChecker,
  wedge: patternWedge
};

/**
 * @param {object} wave
 * @param {number} index — индекс спавна в волне (0..count-1 или счётчик stream)
 * @param {number} count — размер пачки (для burst) или 1 для stream
 * @returns {{ ratioX: number, yOffset: number }}
 */
export function computeSpawnSlot(wave, index, count) {
  const pattern = wave.pattern ?? 'line';
  const fn = PATTERN_FNS[pattern] ?? PATTERN_FNS.line;
  const corridor = getCorridor(wave);
  return fn(wave, index, count, corridor);
}

export function randomRatioInCorridor(wave) {
  const { from, to } = getCorridor(wave);
  return Phaser.Math.FloatBetween(from, to);
}
