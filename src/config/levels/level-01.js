export const level01 = {
  duration: 60000,
  /** После последней волны снова отсчитывать тайминг волн с нуля */
  loop: true,
  waves: [
    { time: 1000, type: 'drifter', count: 3, interval: 500, xRatioFrom: 0.08, xRatioTo: 0.92 },
    { time: 3000, type: 'drifter', count: 3, interval: 500, xRatioFrom: 0.92, xRatioTo: 0.08 },
    { time: 6000, type: 'striker', count: 1, xRatio: 0.5 },
    { time: 10000, type: 'drifter', count: 5, interval: 300, xRatioFrom: 0.04, xRatioTo: 0.96 },
    { time: 12000, type: 'striker', count: 2, interval: 1000, xRatioFrom: 0.2, xRatioTo: 0.8 },
    { time: 15000, type: 'striker', count: 3, interval: 800, xRatioFrom: 0.88, xRatioTo: 0.12 },
    { time: 20000, type: 'drifter', count: 10, interval: 200, xRatioFrom: 0.03, xRatioTo: 0.97 }
  ]
};
