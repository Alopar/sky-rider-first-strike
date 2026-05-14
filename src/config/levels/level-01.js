export const level01 = {
  duration: 60000,
  /** После последней волны снова отсчитывать тайминг волн с нуля */
  loop: true,
  waves: [
    { time: 1000, type: 'drifter', count: 3, interval: 500, x: 200 },
    { time: 3000, type: 'drifter', count: 3, interval: 500, x: 600 },
    { time: 6000, type: 'striker', count: 1, x: 400 },
    { time: 10000, type: 'drifter', count: 5, interval: 300, x: 300 },
    { time: 12000, type: 'striker', count: 2, interval: 1000, x: 500 },
    { time: 15000, type: 'striker', count: 3, interval: 800, x: 200 },
    { time: 20000, type: 'drifter', count: 10, interval: 200, x: 400 }
  ]
};
