import { useState, useEffect, useCallback } from 'react';
import { scanATHHigh } from '../api/stockApi';

export default function ATHScanner({ onSelect }) {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await scanATHHigh();
      setData(result);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Scan failed. Backend server running hai? (localhost:5000)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { runScan(); }, []);

  const list = data?.results || [];

  return (
    <div className="scanner-section">
      {/* Header */}
      <div className="scanner-header">
        <div className="scanner-title-row">
          <div className="scanner-title">
            <span className="scanner-icon">🏔️</span>
            <span>All-Time High Scanner</span>
          </div>
          <button
            className={`scanner-refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={runScan}
            disabled={loading}
            title="Refresh scan"
          >
            ↻
          </button>
        </div>
        <div className="scanner-meta">
          {lastUpdated && !loading && (
            <span className="scanner-time">
              Updated: {lastUpdated.toLocaleTimeString('en-IN')}
              {data && ` · ${data.totalScanned} stocks scanned`}
              {data?.symbolSource && ` · ${data.symbolSource}`}
            </span>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="scanner-tabs" style={{ padding: '0 12px 8px' }}>
        <div className="scanner-info-banner" style={{
          background: 'rgba(234,179,8,0.12)',
          border: '1px solid rgba(234,179,8,0.3)',
          color: '#ca8a04',
          borderRadius: 8,
          padding: '7px 10px',
          fontSize: 12,
          lineHeight: 1.4,
        }}>
          🏔️ Sabhi NSE stocks jo apne <strong>All-Time High se 10% ya kam</strong> neeche hain — breakout zone
        </div>
      </div>

      {/* Body */}
      <div className="scanner-body">
        {loading && (
          <div className="scanner-loading">
            <div className="scanner-spinner" />
            <div>Poore NSE market ka ATH scan ho raha hai…</div>
            <div className="scanner-loading-sub">2000+ stocks · 5Y data · 2–5 min lag sakta hai</div>
          </div>
        )}

        {error && !loading && (
          <div className="scanner-error">
            <span>⚠️</span> {error}
            <button className="scanner-retry" onClick={runScan}>Retry</button>
          </div>
        )}

        {!loading && !error && data && list.length === 0 && (
          <div className="scanner-empty">
            <div className="empty-scan-icon">🔍</div>
            <div>Koi stock ATH se 10% ke andar nahi hai</div>
          </div>
        )}

        {!loading && !error && list.length > 0 && (
          <div className="scanner-list">
            <div className="scanner-list-header">
              <span>Stock</span>
              <span>Price</span>
              <span>ATH</span>
              <span>ATH se %</span>
              <span>Change</span>
            </div>

            {list.map((item) => {
              const pct      = parseFloat(item.pctFromATH);
              const isAtTop  = pct >= -2;
              return (
                <button
                  key={item.symbol}
                  className="scanner-row near-row"
                  style={isAtTop ? { borderLeft: '3px solid #eab308' } : {}}
                  onClick={() => onSelect(item.symbol)}
                  title={`Click to analyze ${item.symbol}`}
                >
                  <div className="row-stock">
                    <span className="row-symbol">
                      {isAtTop && <span style={{ marginRight: 3 }}>⭐</span>}
                      {item.symbol}
                    </span>
                    <span className="row-name">{item.name}</span>
                  </div>
                  <span className="row-price">₹{item.price}</span>
                  <span className="row-dma">₹{item.allTimeHigh}</span>
                  <span className={`row-gap ${pct >= 0 ? 'positive' : 'negative'}`}>
                    {pct >= 0 ? '+' : ''}{item.pctFromATH}%
                  </span>
                  <span className={`row-change ${parseFloat(item.changePct) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(item.changePct) >= 0 ? '+' : ''}{item.changePct}%
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
