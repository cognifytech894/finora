/**
 * nseSymbols.js
 *
 * Fetches all NSE-listed equity symbols dynamically.
 * Uses a multi-strategy approach with fallbacks:
 *
 *   Strategy 1 (Primary): Yahoo Finance v1 POST screener
 *                          → filters exchange=NSI, paginates 250 at a time
 *                          → covers all ~2000+ NSE listed equities
 *
 *   Strategy 2 (Fallback): Yahoo Finance predefined screeners
 *                          → MOST_ACTIVES_IN, DAY_GAINERS_IN, DAY_LOSERS_IN, etc.
 *                          → gives ~500–800 liquid stocks
 *
 *   Strategy 3 (Last resort): Hardcoded Nifty 500 list
 *                          → always works, never fails
 *
 * Cache: in-memory, refreshes every 24 hours automatically.
 */

const fetch = require('node-fetch');

// ── Config ───────────────────────────────────────────────────────────────────
const CACHE_TTL_MS  = 24 * 60 * 60 * 1000;  // 24 hours
const PAGE_SIZE     = 250;                    // Yahoo max per request
const MAX_SYMBOLS   = 3000;                   // safety cap
const FETCH_TIMEOUT = 15000;                  // 15s per request
const BATCH_DELAY   = 300;                    // ms between pages (rate limit)

const YF_HEADERS = {
  'User-Agent':   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':       'application/json',
  'Content-Type': 'application/json',
  'Referer':      'https://finance.yahoo.com/',
  'Origin':       'https://finance.yahoo.com',
};

// ── In-memory cache ──────────────────────────────────────────────────────────
let _cache = {
  symbols:   [],
  fetchedAt: null,
  source:    'none',
};

// ── Nifty 500 fallback (hardcoded, always available) ─────────────────────────
const FALLBACK_SYMBOLS = [
  'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','SBIN','HINDUNILVR','BHARTIARTL',
  'ITC','KOTAKBANK','AXISBANK','LT','BAJFINANCE','ASIANPAINT','MARUTI','TITAN',
  'SUNPHARMA','WIPRO','ULTRACEMCO','NESTLEIND','TECHM','POWERGRID','NTPC','ONGC',
  'JSWSTEEL','TATASTEEL','COALINDIA','BPCL','HCLTECH','GRASIM','CIPLA','DRREDDY',
  'DIVISLAB','EICHERMOT','HEROMOTOCO','BAJAJFINSV','SBILIFE','ADANIENT','ADANIPORTS',
  'TATACONSUM','VEDL','HINDALCO','INDUSINDBK','MM','APOLLOHOSP','PIDILITIND',
  'BRITANNIA','DABUR','MARICO','GODREJCP','ADANIGREEN','ADANIPOWER','AMBUJACEM',
  'AUROPHARMA','BAJAJ-AUTO','BALKRISIND','BANDHANBNK','BANKBARODA','BEL','BERGEPAINT',
  'BIOCON','BOSCHLTD','CANBK','CHOLAFIN','COLPAL','CONCOR','CUMMINSIND','DLF',
  'FEDERALBNK','GAIL','GODREJPROP','HAVELLS','HDFCAMC','HDFCLIFE','ICICIGI',
  'ICICIPRULI','INDUSTOWER','INDIGO','IOC','IRCTC','JINDALSTEL','JUBLFOOD',
  'LICHSGFIN','LUPIN','MCDOWELL-N','MFSL','MPHASIS','MRF','MUTHOOTFIN','NAUKRI',
  'NMDC','OFSS','PAGEIND','PEL','PETRONET','PFC','PIIND','PNB','RECLTD','SAIL',
  'SHREECEM','SIEMENS','SRF','TATAPOWER','TORNTPHARM','TRENT','UBL','UNITDSPR',
  'UPL','VOLTAS','ZYDUSLIFE','AARTIIND','ABCAPITAL','ACC','AIAENG','AJANTPHARM',
  'ALKEM','APOLLOTYRE','ASHOKLEY','ASTRAL','AUBANK','BALKRISIND','BATAINDIA',
  'BHARATFORG','BHEL','BLUESTARCO','BSE','CANFINHOME','CDSL','CENTURYTEX','CESC',
  'COFORGE','CROMPTON','CYIENT','DALBHARAT','DEEPAKNTR','DELHIVERY','DIXON',
  'ECLERX','ELGIEQUIP','EMAMILTD','ESCORTS','EXIDEIND','FINEORG','FLUOROCHEM',
  'FORTIS','GICRE','GLAXO','GMRAIRPORT','GNFC','GODREJIND','GRINDWELL','GSPL',
  'GUJTGAS','HAPPSTMNDS','HFCL','HONAUT','HUDCO','IDFCFIRSTB','IEX','IIFL',
  'INDIAMART','INDIACEM','INDIANB','INDHOTEL','INTELLECT','IPCALAB','IRB','IRFC',
  'ISEC','JINDALSTEL','JKLAKSHMI','JKPAPER','JMFINANCL','JSL','JSWENERGY',
  'KAJARIACER','KALPATPOWR','KANSAINER','KARURVYSYA','KEC','KPITTECH','KRBL',
  'LAURUSLABS','LICI','LALPATHLAB','LTIM','LTTS','LUXIND','MANAPPURAM','MAXHEALTH',
  'MCX','METROPOLIS','MOIL','MOREPENLAB','MOTILALOFS','NATCOPHARM','NAVINFLUOR',
  'NBCC','NCC','NIACL','NLCINDIA','NOCIL','NUVAMA','OBEROIRLTY','OIL','OLECTRA',
  'PATELENG','PCBL','PERSISTENT','PGHH','PHOENIXLTD','PNBHOUSING','POLICYBZR',
  'POLYCAB','POLYMED','PRAJIND','PRINCEPIPE','PVRINOX','RADICO','RAILTEL',
  'RALLIS','RAMCOCEM','RAYMOND','REDINGTON','RELAXO','RITES','ROSSARI','ROUTE',
  'SAFARI','SAREGAMA','SBFC','SCHAEFFLER','SJVN','SKFINDIA','SOBHA','SONACOMS',
  'SPANDANA','STAR','STARHEALTH','STLTECH','SUMICHEM','SUNDARMFIN','SUNTV',
  'SUPREMEIND','SUZLON','SYMPHONY','TANLA','TATACOMM','TATACHEM','TATAELXSI',
  'TATATECH','TEJASNET','THERMAX','TIMKEN','TITAGARH','TORNTPOWER','TTKPRESTIG',
  'TVSMOTORS','UCOBANK','UJJIVANSFB','UNIONBANK','UNOMINDA','VGUARD','VBL',
  'WELSPUNIND','WESTLIFE','WOCKPHARMA','YESBANK','ZENSARTECH','ZOMATO','ZYDUSWELL',
];

// ── Helper: clean a Yahoo symbol to bare NSE ticker ──────────────────────────
function cleanSymbol(raw) {
  if (!raw) return null;
  return raw.replace(/\.(NS|BO)$/i, '').toUpperCase().trim();
}

// ── Strategy 1: Yahoo v1 POST screener (exchange = NSI) ──────────────────────
async function fetchViaPostScreener() {
  const symbols = new Set();
  let offset = 0;

  while (symbols.size < MAX_SYMBOLS) {
    const body = JSON.stringify({
      offset,
      size: PAGE_SIZE,
      sortField:  'intradaymarketcap',
      sortType:   'DESC',
      quoteType:  'EQUITY',
      query: {
        operator: 'AND',
        operands: [{ operator: 'eq', operands: ['exchange', 'NSI'] }],
      },
      userId: '', userIdType: 'guid',
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(
      'https://query1.finance.yahoo.com/v1/finance/screener?formatted=false&lang=en-IN&region=IN',
      { method: 'POST', headers: YF_HEADERS, body, signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const quotes = data?.finance?.result?.[0]?.quotes || [];
    if (quotes.length === 0) break;

    quotes.forEach(q => {
      const sym = cleanSymbol(q.symbol);
      if (sym) symbols.add(sym);
    });

    // If fewer results than page size, we've reached the end
    if (quotes.length < PAGE_SIZE) break;

    offset += PAGE_SIZE;
    await new Promise(r => setTimeout(r, BATCH_DELAY));
  }

  return [...symbols];
}

// ── Strategy 2: Yahoo predefined screeners (liquid stocks) ───────────────────
const PREDEFINED_SCREENERS = [
  'MOST_ACTIVES_IN',
  'DAY_GAINERS_IN',
  'DAY_LOSERS_IN',
  'UNDERVALUED_LARGE_CAPS_IN',
  'GROWTH_TECHNOLOGY_STOCKS_IN',
];

async function fetchViaPredefinedScreeners() {
  const symbols = new Set();

  for (const scrId of PREDEFINED_SCREENERS) {
    try {
      for (let offset = 0; offset < 500; offset += PAGE_SIZE) {
        const url =
          `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved` +
          `?formatted=false&lang=en-IN&region=IN&scrIds=${scrId}` +
          `&count=${PAGE_SIZE}&offset=${offset}`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
        const res = await fetch(url, { headers: YF_HEADERS, signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) break;
        const data = await res.json();
        const quotes = data?.finance?.result?.[0]?.quotes || [];
        if (quotes.length === 0) break;

        quotes
          .filter(q => q.exchange === 'NSI' || q.fullExchangeName === 'NSE')
          .forEach(q => {
            const sym = cleanSymbol(q.symbol);
            if (sym) symbols.add(sym);
          });

        if (quotes.length < PAGE_SIZE) break;
        await new Promise(r => setTimeout(r, BATCH_DELAY));
      }
    } catch (e) {
      console.warn(`[nseSymbols] predefined screener ${scrId} failed:`, e.message);
    }
  }

  return [...symbols];
}

// ── Main fetch orchestrator ───────────────────────────────────────────────────
async function fetchAllSymbols() {
  // Try Strategy 1 first
  try {
    console.log('[nseSymbols] Strategy 1: Yahoo v1 POST screener…');
    const syms = await fetchViaPostScreener();
    if (syms.length > 200) {
      console.log(`[nseSymbols] Strategy 1 success: ${syms.length} symbols`);
      return { symbols: syms, source: 'yahoo-post-screener' };
    }
    console.warn(`[nseSymbols] Strategy 1 returned too few (${syms.length}), trying Strategy 2…`);
  } catch (err) {
    console.warn('[nseSymbols] Strategy 1 failed:', err.message);
  }

  // Try Strategy 2
  try {
    console.log('[nseSymbols] Strategy 2: Yahoo predefined screeners…');
    const syms = await fetchViaPredefinedScreeners();
    if (syms.length > 100) {
      console.log(`[nseSymbols] Strategy 2 success: ${syms.length} symbols`);
      return { symbols: syms, source: 'yahoo-predefined-screeners' };
    }
    console.warn(`[nseSymbols] Strategy 2 returned too few (${syms.length})`);
  } catch (err) {
    console.warn('[nseSymbols] Strategy 2 failed:', err.message);
  }

  // Strategy 3: fallback
  console.warn('[nseSymbols] Using hardcoded Nifty 500 fallback');
  return { symbols: FALLBACK_SYMBOLS, source: 'fallback-nifty500' };
}

// ── Public API ────────────────────────────────────────────────────────────────

async function getNSESymbols() {
  const now   = Date.now();
  const stale = !_cache.fetchedAt || (now - _cache.fetchedAt) > CACHE_TTL_MS;

  if (!stale && _cache.symbols.length > 0) return _cache.symbols;

  console.log('[nseSymbols] Cache stale or empty — refreshing…');
  const { symbols, source } = await fetchAllSymbols();
  _cache = { symbols, fetchedAt: now, source };
  return symbols;
}

async function refreshNSESymbols() {
  _cache.fetchedAt = null;   // force stale
  return getNSESymbols();
}

function getCacheInfo() {
  return {
    totalSymbols: _cache.symbols.length,
    fetchedAt:    _cache.fetchedAt ? new Date(_cache.fetchedAt).toISOString() : null,
    source:       _cache.source || 'none',
  };
}

module.exports = { getNSESymbols, refreshNSESymbols, getCacheInfo };
