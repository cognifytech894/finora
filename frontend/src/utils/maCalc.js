// Client-side MA calculations for custom indicator overlays

export function calcSMA(closes, period) {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export function calcEMA(closes, period) {
  if (closes.length < period) return closes.map(() => null);
  const k = 2 / (period + 1);
  const result = new Array(period - 1).fill(null);
  // Seed with SMA of first `period` values
  const seed = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(seed);
  for (let i = period; i < closes.length; i++) {
    result.push(closes[i] * k + result[result.length - 1] * (1 - k));
  }
  return result;
}
