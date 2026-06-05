const fetch = require('node-fetch');

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
};

const PROXIES = [
  (url) => url,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function fetchWithFallback(url, timeout = 12000) {
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy(url);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(proxyUrl, { headers: YF_HEADERS, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      return await res.json();
    } catch (e) {
      continue;
    }
  }
  throw new Error('All fetch attempts failed');
}

/**
 * Fetch OHLCV data from Yahoo Finance
 * @param {string} symbol - NSE symbol e.g. RELIANCE
 * @param {string} interval - 1d, 1h, 15m, etc.
 * @param {string} range - 1mo, 3mo, 6mo, 1y
 */
async function fetchOHLCV(symbol, interval = '1d', range = '6mo') {
  const ticker = symbol.toUpperCase().replace('.NS', '').replace('.BO', '') + '.NS';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}&includePrePost=false`;

  const data = await fetchWithFallback(url);
  const result = data?.chart?.result?.[0];
  if (!result?.timestamp) throw new Error(`No data found for ${symbol}`);

  const { timestamp, indicators } = result;
  const q = indicators.quote[0];
  const meta = result.meta;

  const candles = timestamp.map((t, i) => ({
    time: t,
    open: q.open[i],
    high: q.high[i],
    low: q.low[i],
    close: q.close[i],
    volume: q.volume[i],
  })).filter(c => c.close != null && c.open != null);

  return { candles, meta, ticker };
}

/**
 * Search NSE stocks by query
 */
async function searchStocks(query) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-IN&region=IN&quotesCount=8&newsCount=0&listsCount=0`;
  const data = await fetchWithFallback(url);
  const quotes = data?.quotes || [];
  return quotes
    .filter(q => q.exchange === 'NSI' || q.exchange === 'BSE' || q.quoteType === 'EQUITY')
    .map(q => ({
      symbol: q.symbol?.replace('.NS', '').replace('.BO', '') || q.symbol,
      name: q.longname || q.shortname || q.symbol,
      exchange: q.exchange,
      type: q.quoteType,
    }));
}

module.exports = { fetchOHLCV, searchStocks };
