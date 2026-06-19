/**
 * useDataCache.js
 *
 * Lightweight in-memory cache for API calls.
 * Tab switch karne par data reuse hota hai.
 * Sirf manual refresh, pull-to-refresh, ya stale time expire par fresh call hoti hai.
 *
 * Features:
 *  - Global singleton cache (module-level Map)
 *  - Per-key stale time (default: 15 minutes)
 *  - Manual invalidation support
 *  - Loading / error state
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Global in-memory cache (lives as long as browser tab is open) ──────────────
const CACHE = new Map();
// { key: { data, fetchedAt, promise } }

const DEFAULT_STALE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Invalidate a cache entry (force next call to re-fetch).
 */
export function invalidateCache(key) {
  CACHE.delete(key);
}

/**
 * Invalidate all cache entries.
 */
export function invalidateAllCache() {
  CACHE.clear();
}

/**
 * useDataCache(key, fetchFn, options)
 *
 * @param {string}   key       - Unique cache key (e.g. 'scanner:dma200')
 * @param {Function} fetchFn   - Async function that returns data
 * @param {object}   options
 *   @param {number}  staleMs  - Ms before data is considered stale (default 15min)
 *   @param {boolean} enabled  - Set false to skip fetch (default true)
 */
export function useDataCache(key, fetchFn, { staleMs = DEFAULT_STALE_MS, enabled = true } = {}) {
  const [data,        setData]        = useState(() => CACHE.get(key)?.data ?? null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => CACHE.get(key)?.fetchedAt ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    const cached = CACHE.get(key);
    const now    = Date.now();
    const isStale = !cached || (now - cached.fetchedAt) > staleMs;

    // Return cached data if still fresh (and not forced)
    if (!force && cached && !isStale) {
      if (mountedRef.current) {
        setData(cached.data);
        setLastUpdated(cached.fetchedAt);
      }
      return;
    }

    // If another component is already fetching same key, wait for that promise
    if (cached?.promise) {
      try {
        const result = await cached.promise;
        if (mountedRef.current) {
          setData(result);
          setLastUpdated(CACHE.get(key)?.fetchedAt ?? null);
        }
      } catch (e) {
        if (mountedRef.current) setError(e.message);
      }
      return;
    }

    // Start fresh fetch
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    const promise = fetchFn();

    // Store promise so parallel components skip duplicate fetch
    CACHE.set(key, { ...(CACHE.get(key) || {}), promise });

    try {
      const result = await promise;
      const fetchedAt = Date.now();
      CACHE.set(key, { data: result, fetchedAt, promise: null });
      if (mountedRef.current) {
        setData(result);
        setLastUpdated(fetchedAt);
        setError(null);
      }
    } catch (e) {
      CACHE.set(key, { ...(CACHE.get(key) || {}), promise: null });
      if (mountedRef.current) {
        setError(e.message || 'Fetch failed');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [key, fetchFn, staleMs, enabled]);

  // Auto-fetch on mount / when key changes
  useEffect(() => {
    fetchData(false);
  }, [key]);

  // Manual refresh (always forces fresh fetch)
  const refresh = useCallback(() => {
    invalidateCache(key);
    fetchData(true);
  }, [key, fetchData]);

  return { data, loading, error, lastUpdated, refresh };
}
