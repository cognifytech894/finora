/**
 * Calculate Simple Moving Average
 */
function calcSMA(closes, period) {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

/**
 * Calculate Exponential Moving Average
 */
function calcEMA(closes, period) {
  const k = 2 / (period + 1);
  const ema = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  return ema.map((v, i) => (i < period - 1 ? null : v));
}

/**
 * Calculate RSI (14-period default)
 */
function calcRSI(closes, period = 14) {
  const rsi = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return rsi;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

/**
 * Calculate MACD (12,26,9)
 */
function calcMACD(closes) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => (v != null && ema26[i] != null ? v - ema26[i] : null));
  const validMacd = macdLine.filter(v => v != null);
  const signalRaw = calcEMA(validMacd, 9);
  const signal = new Array(macdLine.length).fill(null);
  let si = 0;
  macdLine.forEach((v, i) => {
    if (v != null) { signal[i] = signalRaw[si++]; }
  });
  const histogram = macdLine.map((v, i) => (v != null && signal[i] != null ? v - signal[i] : null));
  return { macdLine, signal, histogram };
}

/**
 * Calculate Bollinger Bands (20-period, 2 std dev)
 */
function calcBollinger(closes, period = 20, stdDev = 2) {
  const sma = calcSMA(closes, period);
  return closes.map((_, i) => {
    if (sma[i] == null) return { upper: null, middle: null, lower: null };
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    return {
      upper: mean + stdDev * sd,
      middle: mean,
      lower: mean - stdDev * sd,
    };
  });
}

/**
 * Generate BUY / SELL / HOLD signal based on multiple indicators
 */
function generateSignal(closes, rsi, macd, sma20, sma50) {
  const last = closes.length - 1;
  const lastRSI = rsi[last];
  const lastMACD = macd.macdLine[last];
  const lastSignal = macd.signal[last];
  const lastClose = closes[last];
  const lastSMA20 = sma20[last];
  const lastSMA50 = sma50[last];

  let score = 0; // positive = bullish, negative = bearish
  const reasons = [];

  // RSI signals
  if (lastRSI != null) {
    if (lastRSI < 30) { score += 2; reasons.push('RSI oversold (<30) — bullish'); }
    else if (lastRSI < 45) { score += 1; reasons.push('RSI approaching oversold — mild bullish'); }
    else if (lastRSI > 70) { score -= 2; reasons.push('RSI overbought (>70) — bearish'); }
    else if (lastRSI > 60) { score -= 1; reasons.push('RSI elevated — mild bearish'); }
    else { reasons.push(`RSI neutral (${lastRSI?.toFixed(1)})`); }
  }

  // MACD crossover
  if (lastMACD != null && lastSignal != null) {
    const prevMACD = macd.macdLine[last - 1];
    const prevSignal = macd.signal[last - 1];
    if (prevMACD != null && prevSignal != null) {
      if (prevMACD < prevSignal && lastMACD > lastSignal) { score += 2; reasons.push('MACD bullish crossover'); }
      else if (prevMACD > prevSignal && lastMACD < lastSignal) { score -= 2; reasons.push('MACD bearish crossover'); }
      else if (lastMACD > lastSignal) { score += 1; reasons.push('MACD above signal — bullish'); }
      else { score -= 1; reasons.push('MACD below signal — bearish'); }
    }
  }

  // Price vs Moving Averages
  if (lastSMA20 != null && lastClose > lastSMA20) { score += 1; reasons.push('Price above 20-SMA — bullish'); }
  else if (lastSMA20 != null) { score -= 1; reasons.push('Price below 20-SMA — bearish'); }

  if (lastSMA50 != null && lastSMA20 != null) {
    if (lastSMA20 > lastSMA50) { score += 1; reasons.push('Golden cross (SMA20 > SMA50)'); }
    else { score -= 1; reasons.push('Death cross (SMA20 < SMA50)'); }
  }

  let signal, color, strength;
  if (score >= 3) { signal = 'BUY'; color = '#22c55e'; strength = Math.min(100, score * 15 + 40); }
  else if (score <= -3) { signal = 'SELL'; color = '#ef4444'; strength = Math.min(100, Math.abs(score) * 15 + 40); }
  else { signal = 'HOLD'; color = '#f59e0b'; strength = 50; }

  return { signal, color, score, strength, reasons };
}

/**
 * Full analysis pipeline
 */
function analyzeStock(candles) {
  const closes = candles.map(c => c.close);

  const sma20 = calcSMA(closes, 20);
  const sma50 = calcSMA(closes, 50);
  const ema20 = calcEMA(closes, 20);
  const rsi = calcRSI(closes, 14);
  const macd = calcMACD(closes);
  const bollinger = calcBollinger(closes, 20);
  const signal = generateSignal(closes, rsi, macd, sma20, sma50);

  const last = closes.length - 1;
  const prev = closes[last - 1];
  const curr = closes[last];
  const change = curr - prev;
  const changePct = (change / prev) * 100;

  return {
    signal,
    indicators: {
      rsi: rsi[last]?.toFixed(2),
      macd: macd.macdLine[last]?.toFixed(2),
      macdSignal: macd.signal[last]?.toFixed(2),
      sma20: sma20[last]?.toFixed(2),
      sma50: sma50[last]?.toFixed(2),
      bollingerUpper: bollinger[last]?.upper?.toFixed(2),
      bollingerLower: bollinger[last]?.lower?.toFixed(2),
    },
    price: {
      current: curr?.toFixed(2),
      change: change?.toFixed(2),
      changePct: changePct?.toFixed(2),
      high52w: Math.max(...closes).toFixed(2),
      low52w: Math.min(...closes).toFixed(2),
    },
    series: {
      candles,
      sma20: sma20.map((v, i) => ({ time: candles[i].time, value: v })).filter(p => p.value != null),
      sma50: sma50.map((v, i) => ({ time: candles[i].time, value: v })).filter(p => p.value != null),
      ema20: ema20.map((v, i) => ({ time: candles[i].time, value: v })).filter(p => p.value != null),
      rsi: rsi.map((v, i) => ({ time: candles[i].time, value: v })).filter(p => p.value != null),
      macd: macd.macdLine.map((v, i) => ({ time: candles[i].time, value: v })).filter(p => p.value != null),
      macdSignal: macd.signal.map((v, i) => ({ time: candles[i].time, value: v })).filter(p => p.value != null),
      histogram: macd.histogram.map((v, i) => ({ time: candles[i].time, value: v })).filter(p => p.value != null),
      bollinger: bollinger.map((b, i) => ({ time: candles[i].time, ...b })).filter(b => b.upper != null),
    },
  };
}

module.exports = { analyzeStock, calcRSI, calcSMA, calcEMA, calcMACD, calcBollinger };
