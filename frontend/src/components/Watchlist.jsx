import { useState, useEffect, useRef } from 'react';
import { searchStocks } from '../api/stockApi';

export default function Watchlist({ watchlist, quotes, refreshing, onSelect, onAdd, onRemove }) {
  const [addMode, setAddMode]   = useState(false);
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchStocks(query.trim());
        setResults(Array.isArray(res) ? res : []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleAdd = (symbol, name) => {
    onAdd(symbol, name);
    setQuery('');
    setResults([]);
    setAddMode(false);
  };

  const handleCancel = () => {
    setAddMode(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="wl-root">
      {/* Header */}
      <div className="wl-head">
        <div className="wl-head-row">
          <span className="wl-title">⭐ Watchlist
            {watchlist.length > 0 && <span className="wl-count">{watchlist.length}</span>}
          </span>
          <div style={{ display:'flex', gap:6 }}>
            {watchlist.length > 0 && (
              <span className={`wl-sync ${refreshing ? 'spin' : ''}`} title="Auto-refresh 60s">↻</span>
            )}
            {!addMode && (
              <button className="wl-add-trigger" onClick={() => setAddMode(true)}>＋</button>
            )}
          </div>
        </div>

        {/* Search panel */}
        {addMode && (
          <div className="wl-search-panel">
            <div className="wl-search-row">
              <span className="wl-search-icon">⌕</span>
              <input
                autoFocus
                type="text"
                placeholder="Stock dhundho..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="wl-search-inp"
                spellCheck={false}
              />
              {searching && <span className="wl-spin-sm" />}
              <button className="wl-cancel" onClick={handleCancel}>✕</button>
            </div>

            {results.length > 0 && (
              <div className="wl-results">
                {results.map(r => {
                  const already = watchlist.some(w => w.symbol === r.symbol);
                  return (
                    <button
                      key={r.symbol}
                      className={`wl-res-item ${already ? 'already' : ''}`}
                      onClick={() => !already && handleAdd(r.symbol, r.name)}
                      disabled={already}
                    >
                      <span className="wl-res-sym">{r.symbol}</span>
                      <span className="wl-res-name">{r.name}</span>
                      <span className="wl-res-badge">{already ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {query.trim() && !searching && results.length === 0 && (
              <div className="wl-no-res">Koi stock nahi mila</div>
            )}
          </div>
        )}
      </div>

      {/* Empty */}
      {watchlist.length === 0 && !addMode && (
        <div className="wl-empty">
          <div style={{ fontSize:28, opacity:.3 }}>⭐</div>
          <div className="wl-empty-txt">Watchlist khaali hai</div>
          <button className="wl-add-trigger big" onClick={() => setAddMode(true)}>＋ Stock Add Karo</button>
        </div>
      )}

      {/* Stock rows */}
      <div className="wl-list">
        {watchlist.map(({ symbol, name }) => {
          const q = quotes[symbol];
          const pos = q && parseFloat(q.changePct) >= 0;
          return (
            <div key={symbol} className="wl-item" onClick={() => onSelect(symbol)}>
              <div className="wl-item-top">
                <span className="wl-sym">{symbol}</span>
                <span className={`wl-price ${q && !q.loading ? (pos ? 'up' : 'dn') : ''}`}>
                  {q?.loading ? '...' : q?.error ? '—' : q ? `₹${q.price}` : '—'}
                </span>
              </div>
              <div className="wl-item-bot">
                <span className="wl-name">{q?.name || name}</span>
                <span className={`wl-chg ${q && !q.loading ? (pos ? 'up' : 'dn') : ''}`}>
                  {q?.loading ? '' : q?.error ? '' : q
                    ? `${pos ? '▲' : '▼'} ${Math.abs(parseFloat(q.changePct)).toFixed(2)}%`
                    : ''}
                </span>
              </div>
              <button
                className="wl-del"
                onClick={e => { e.stopPropagation(); onRemove(symbol); }}
                title="Remove"
              >✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
