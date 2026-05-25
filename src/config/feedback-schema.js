import { MUTATION_REVISION } from './level-mutations.js';

export const FEEDBACK_SCHEMA_VERSION = '1.1';

export const FEEDBACK_SCALES = [
  {
    key: 'difficulty',
    label: 'Сложность',
    hint: '0 — перебалансировать, 1 — баланс ок'
  },
  {
    key: 'pace',
    label: 'Темп',
    hint: '0 — слишком медленно/хаотично, 1 — ритм устраивает'
  },
  {
    key: 'variety',
    label: 'Разнообразие',
    hint: '0 — однообразно, 1 — достаточно'
  },
  {
    key: 'fairness',
    label: 'Честность',
    hint: '0 — «дешёвые» смерти, 1 — поражения заслужены'
  },
  {
    key: 'readability',
    label: 'Читаемость',
    hint: '0 — трудно читать поле, 1 — угрозы видны'
  },
  {
    key: 'bulletPressure',
    label: 'Пули врагов',
    hint: '0 — мало опасных выстрелов, 1 — давление от пуль в норме'
  },
  {
    key: 'weaponProgression',
    label: 'Прокачка оружия',
    hint: '0 — темп или ощущение силы не те, 1 — рост оружия понятен и устраивает'
  },
  {
    key: 'heavyEnemyDurability',
    label: 'Крупные враги',
    hint: '0 — dreadnought и крупный мусор слишком хрупкие, 1 — держат удар как надо'
  }
];

export const DEFAULT_RATING = 0.5;

export function createDefaultRatings() {
  const ratings = {};
  for (const scale of FEEDBACK_SCALES) {
    ratings[scale.key] = DEFAULT_RATING;
  }
  return ratings;
}

function roundRating(value) {
  return Math.round(value * 100) / 100;
}

export function buildFeedbackJson({ run, ratings, comment }) {
  const roundedRatings = {};
  for (const scale of FEEDBACK_SCALES) {
    roundedRatings[scale.key] = roundRating(ratings[scale.key] ?? DEFAULT_RATING);
  }

  return {
    schemaVersion: FEEDBACK_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    outcome: run.outcome,
    levelId: run.levelId,
    run: {
      score: run.score,
      elapsedMs: run.elapsedMs,
      hpRemaining: run.hpRemaining,
      weaponLevel: run.weaponLevel
    },
    ratings: roundedRatings,
    comment: comment.trim(),
    mutationRevision: MUTATION_REVISION
  };
}
