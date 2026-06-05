import { useState, useEffect, useCallback, useRef } from 'react';
import { quoteStock } from '../api/stockApi';

const STORAGE_KEY = 'ss-watchlist';
const REFRESH_INTERVAL = 60000; // 60 seconds auto-refresh

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToStorage(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

export function useWatchlist() {
  // list = [{ symbol, name, addedAt }]
  const [watchlist, setWatchlist] = useState(() => loadFromStorage());
  // quotes = { [symbol]: { price, change, changePct, high, low, volume, loading, error } }
  const [quotes, setQuotes] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  // Persist on change
  useEffect(() => { saveToStorage(watchlist); }, [watchlist]);

  // Fetch quotes for all watchlist symbols
  const fetchQuotes = useCallback(async (symbols) => {
    if (!symbols.length) return;
    setRefreshing(true);
    // Mark all as loading
    setQuotes(prev => {
      const next = { ...prev };
      symbols.forEach(sym => { next[sym] = { ...(prev[sym] || {}), loading: true, error: null }; });
      return next;
    });
    // Fetch concurrently
    await Promise.all(symbols.map(async (sym) => {
      try {
        const q = await quoteStock(sym);
        setQuotes(prev => ({ ...prev, [sym]: { ...q, loading: false, error: null } }));
      } catch (e) {
        setQuotes(prev => ({ ...prev, [sym]: { ...(prev[sym] || {}), loading: false, error: 'Failed' } }));
      }
    }));
    setRefreshing(false);
  }, []);

  // Fetch on mount + whenever watchlist changes
  useEffect(() => {
    const syms = watchlist.map(w => w.symbol);
    if (syms.length) fetchQuotes(syms);
  }, [watchlist.map(w => w.symbol).join(',')]);

  // Auto-refresh every 60s
  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const syms = watchlist.map(w => w.symbol);
      if (syms.length) fetchQuotes(syms);
    }, REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [watchlist, fetchQuotes]);

  const addToWatchlist = useCallback((symbol, name = '') => {
    setWatchlist(prev => {
      if (prev.find(w => w.symbol === symbol)) return prev; // already exists
      return [...prev, { symbol, name, addedAt: Date.now() }];
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    setQuotes(prev => { const n = { ...prev }; delete n[symbol]; return n; });
  }, []);

  const isInWatchlist = useCallback((symbol) => {
    return watchlist.some(w => w.symbol === symbol);
  }, [watchlist]);

  const refresh = useCallback(() => {
    fetchQuotes(watchlist.map(w => w.symbol));
  }, [watchlist, fetchQuotes]);

  return { watchlist, quotes, refreshing, addToWatchlist, removeFromWatchlist, isInWatchlist, refresh };
}
