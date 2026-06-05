const express = require('express');
const router  = express.Router();
const { fetchOHLCV, searchStocks }                       = require('../services/yahooFinance');
const { analyzeStock }                                   = require('../services/indicators');
const { getNSESymbols, refreshNSESymbols, getCacheInfo } = require('../services/nseSymbols');

// ─── SEARCH ──────────────────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1)
    return res.status(400).json({ error: 'Query required' });
  try {
    res.json({ results: await searchStocks(q.trim()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ANALYZE ─────────────────────────────────────────────────────────────────
router.get('/analyze', async (req, res) => {
  const { symbol, interval = '1d', range = '6mo' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });
  try {
    const { candles, meta, ticker } = await fetchOHLCV(symbol, interval, range);
    if (candles.length < 30)
      return res.status(422).json({ error: 'Not enough data (need 30+ candles)' });
    const analysis = analyzeStock(candles);
    res.json({
      symbol: symbol.toUpperCase(), ticker,
      name:     meta?.longName || meta?.shortName || symbol,
      currency: meta?.currency  || 'INR',
      exchange: meta?.exchangeName || 'NSE',
      interval, range,
      ...analysis,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── QUOTE ───────────────────────────────────────────────────────────────────
router.get('/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });
  try {
    const { candles, meta } = await fetchOHLCV(symbol, '1d', '5d');
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const change = last.close - prev.close;
    res.json({
      symbol:    symbol.toUpperCase(),
      name:      meta?.longName || symbol,
      price:     last.close?.toFixed(2),
      change:    change?.toFixed(2),
      changePct: ((change / prev.close) * 100)?.toFixed(2),
      volume:    last.volume,
      high:      last.high?.toFixed(2),
      low:       last.low?.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NSE SYMBOLS ─────────────────────────────────────────────────────────────
router.get('/symbols', async (req, res) => {
  try {
    const symbols = await getNSESymbols();
    res.json({ total: symbols.length, symbols, ...getCacheInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/symbols/info', (req, res) => res.json(getCacheInfo()));
router.post('/symbols/refresh', async (req, res) => {
  try {
    const symbols = await refreshNSESymbols();
    res.json({ message: 'Refreshed', total: symbols.length, ...getCacheInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SHARED: run a scan over full NSE list ────────────────────────────────────
// checkFn(candles, meta) → result object or null
// range: Yahoo range string e.g. '1y', '5y'
async function runFullScan({ checkFn, range, concurrency = 8, req }) {
  const allSymbols = await getNSESymbols();

  const pageSize  = parseInt(req.query.pageSize) || 0;
  const page      = Math.max(1, parseInt(req.query.page) || 1);
  const stockList = pageSize > 0
    ? allSymbols.slice((page - 1) * pageSize, page * pageSize)
    : allSymbols;

  const con = Math.min(10, Math.max(1, parseInt(req.query.concurrency) || concurrency));

  const results = [], errors = [];

  for (let i = 0; i < stockList.length; i += con) {
    const batch = stockList.slice(i, i + con);
    await Promise.all(batch.map(async (sym) => {
      try {
        const { candles, meta } = await fetchOHLCV(sym, '1d', range);
        const result = checkFn(candles);
        if (!result) return;
        results.push({ symbol: sym, name: meta?.longName || meta?.shortName || sym, ...result });
      } catch (e) {
        errors.push({ symbol: sym, error: e.message });
      }
    }));
  }

  return {
    scannedAt:    new Date().toISOString(),
    symbolSource: getCacheInfo().source,
    totalStocks:  allSymbols.length,
    totalScanned: stockList.length,
    page:         pageSize > 0 ? page : 1,
    pageSize:     pageSize > 0 ? pageSize : stockList.length,
    results,
    errors,
  };
}

// ─── ALL-TIME HIGH SCANNER ───────────────────────────────────────────────────
// GET /api/stock/scanner/athhigh
// Scans ALL NSE stocks trading within 10% of their all-time high (5Y data)

function checkNearATH(candles) {
  if (candles.length < 30) return null;
  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const n      = closes.length;

  const allTimeHigh  = Math.max(...highs);
  const currentPrice = closes[n - 1];
  const pctFromATH   = ((currentPrice - allTimeHigh) / allTimeHigh) * 100;
  if (pctFromATH < -10) return null;

  const change = currentPrice - closes[n - 2];
  return {
    price:       currentPrice.toFixed(2),
    allTimeHigh: allTimeHigh.toFixed(2),
    pctFromATH:  pctFromATH.toFixed(2),
    change:      change.toFixed(2),
    changePct:   ((change / closes[n - 2]) * 100).toFixed(2),
    volume:      candles[n - 1].volume,
  };
}

router.get('/scanner/athhigh', async (req, res) => {
  try {
    const scan = await runFullScan({ checkFn: checkNearATH, range: '5y', req });
    scan.results.sort((a, b) => parseFloat(b.pctFromATH) - parseFloat(a.pctFromATH));
    res.json(scan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 200 DMA CROSSOVER SCANNER ───────────────────────────────────────────────
// GET /api/stock/scanner/dma200
// Scans ALL NSE stocks for 200 DMA crossover / near-crossover (1Y data)

function check200DMACrossover(candles) {
  if (candles.length < 202) return null;
  const closes = candles.map(c => c.close);
  const n      = closes.length;

  const dma200Today = closes.slice(n - 200, n).reduce((a, b) => a + b, 0) / 200;
  const dma200Prev  = closes.slice(n - 201, n - 1).reduce((a, b) => a + b, 0) / 200;
  const priceToday  = closes[n - 1];
  const pricePrev   = closes[n - 2];

  const crossedAbove  = pricePrev < dma200Prev && priceToday > dma200Today;
  const gapPct        = ((priceToday - dma200Today) / dma200Today) * 100;
  const nearCrossover = gapPct >= -1.5 && gapPct < 0 && pricePrev < dma200Prev;

  const change = priceToday - pricePrev;
  return {
    price:        priceToday.toFixed(2),
    dma200:       dma200Today.toFixed(2),
    gapPct:       gapPct.toFixed(2),
    change:       change.toFixed(2),
    changePct:    ((change / pricePrev) * 100).toFixed(2),
    crossedAbove,
    nearCrossover,
    volume:       candles[n - 1].volume,
  };
}

router.get('/scanner/dma200', async (req, res) => {
  try {
    const scan    = await runFullScan({ checkFn: check200DMACrossover, range: '1y', req });
    const crossed = scan.results.filter(r => r.crossedAbove);
    const near    = scan.results.filter(r => r.nearCrossover);
    crossed.sort((a, b) => parseFloat(b.gapPct) - parseFloat(a.gapPct));
    near.sort((a, b) => parseFloat(b.gapPct) - parseFloat(a.gapPct));
    res.json({ ...scan, results: undefined, crossed, near });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
