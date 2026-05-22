/** Параметры процедурных SFX (рендерятся в AudioBuffer при старте). */
export const SFX_PRESETS = {
  playerShoot: {
    kind: 'sweep',
    duration: 0.05,
    volume: 0.08,
    freqStart: 380,
    freqEnd: 520,
    wave: 'sine',
    attack: 0.014,
    decay: 0.92
  },
  debrisSmall: {
    kind: 'noiseBurst',
    duration: 0.14,
    volume: 0.38,
    filterFreq: 2400,
    filterQ: 0.6,
    thumpFreq: 90,
    thumpGain: 0.35
  },
  debrisLarge: {
    kind: 'noiseBurst',
    duration: 0.22,
    volume: 0.52,
    filterFreq: 1800,
    filterQ: 0.8,
    thumpFreq: 65,
    thumpGain: 0.55
  },
  crateExplode: {
    kind: 'resonantBurst',
    duration: 0.2,
    volume: 0.45,
    resonanceFreq: 195,
    noiseGain: 0.5,
    decay: 0.12
  },
  shipExplode: {
    kind: 'fallingBoom',
    duration: 0.38,
    volume: 0.62,
    freqStart: 220,
    freqEnd: 55,
    noiseGain: 0.65,
    subFreq: 45
  },
  megaHit: {
    kind: 'impact',
    duration: 0.16,
    volume: 0.7,
    freq: 70,
    noiseGain: 0.75
  },
  bonusPickup: {
    kind: 'arpeggio',
    duration: 0.14,
    volume: 0.35,
    notes: [523.25, 659.25, 783.99],
    wave: 'sine'
  }
};
