import { useState, useCallback } from 'react';
import { analyzeStock, searchStocks } from '../api/stockApi';

export function useStockAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (symbol, interval, range) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeStock(symbol, interval, range);
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, analyze };
}

export function useSearch() {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query) => {
    if (!query || query.length < 1) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await searchStocks(query);
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const clear = () => setResults([]);

  return { results, searching, search, clear };
}
