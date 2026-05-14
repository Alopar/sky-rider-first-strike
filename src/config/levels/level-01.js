export const level01 = {
  duration: 60000,
  /** После последней волны снова отсчитывать тайминг волн с нуля */
  loop: true,
  waves: [
    { time: 1000, type: 'drifter', count: 3, interval: 500, xRatioFrom: 0.08, xRatioTo: 0.92 },
    { time: 3000, type: 'drifter', count: 3, interval: 500, xRatioFrom: 0.92, xRatioTo: 0.08 },
    { time: 4500, type: 'hauler', count: 1, xRatio: 0.5 },
    { time: 6000, type: 'striker', count: 1, xRatio: 0.5 },
    { time: 7500, type: 'rammer', count: 5, interval: 100, xRatioFrom: 0.1, xRatioTo: 0.9 },
    { time: 10000, type: 'drifter', count: 5, interval: 300, xRatioFrom: 0.04, xRatioTo: 0.96 },
    { time: 11000, type: 'hauler', count: 1, xRatio: 0.22 },
    { time: 12000, type: 'striker', count: 2, interval: 1000, xRatioFrom: 0.2, xRatioTo: 0.8 },
    { time: 13500, type: 'rammer', count: 7, interval: 70, xRatioFrom: 0.06, xRatioTo: 0.94 },
    { time: 15000, type: 'striker', count: 3, interval: 800, xRatioFrom: 0.88, xRatioTo: 0.12 },
    { time: 16500, type: 'hauler', count: 2, interval: 400, xRatioFrom: 0.25, xRatioTo: 0.75 },
    { time: 18500, type: 'rammer', count: 8, interval: 55, xRatioFrom: 0.12, xRatioTo: 0.88 },
    { time: 20000, type: 'drifter', count: 10, interval: 200, xRatioFrom: 0.03, xRatioTo: 0.97 },
    { time: 22000, type: 'rammer', count: 6, interval: 80, xRatioFrom: 0.85, xRatioTo: 0.15 }
  ]
};
