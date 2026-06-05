import { useState, useEffect, useCallback } from 'react';
import { scan52WeekHigh } from '../api/stockApi';

export default function Week52HighScanner({ onSelect }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState('broke'); // 'broke' | 'near'
  const [lastUpdated, setLastUpdated] = useState(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await scan52WeekHigh();
      setData(result);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Scan failed. Backend server running hai? (localhost:5000)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { runScan(); }, []);

  const allList   = data?.results || [];
  const brokeList = allList.filter(i => i.brokeOut);
  const nearList  = allList.filter(i => !i.brokeOut);
  const list      = tab === 'broke' ? brokeList : nearList;

  return (
    <div className="scanner-section">
      {/* Header */}
      <div className="scanner-header">
        <div className="scanner-title-row">
          <div className="scanner-title">
            <span className="scanner-icon">📊</span>
            <span>52-Week High Scanner</span>
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
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="scanner-tabs">
        <button
          className={`scanner-tab ${tab === 'broke' ? 'active crossed' : ''}`}
          onClick={() => setTab('broke')}
        >
          🚀 52W High Break
          {data && <span className="tab-badge crossed">{brokeList.length}</span>}
        </button>
        <button
          className={`scanner-tab ${tab === 'near' ? 'active near' : ''}`}
          onClick={() => setTab('near')}
        >
          ⚡ Break Hone Wala
          {data && <span className="tab-badge near">{nearList.length}</span>}
        </button>
      </div>

      {/* Body */}
      <div className="scanner-body">
        {loading && (
          <div className="scanner-loading">
            <div className="scanner-spinner" />
            <div>52-Week High data scan ho raha hai…</div>
            <div className="scanner-loading-sub">Yeh thoda time le sakta hai (15-30 sec)</div>
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
            <div className="empty-scan-icon">{tab === 'broke' ? '🔍' : '📊'}</div>
            <div>
              {tab === 'broke'
                ? 'Aaj koi stock 52-week high break nahi kiya'
                : 'Koi stock 52-week high ke 5% ke andar nahi hai'}
            </div>
          </div>
        )}

        {!loading && !error && list.length > 0 && (
          <div className="scanner-list">
            {tab === 'broke' && (
              <div className="scanner-info-banner crossed-banner">
                🚀 Ye stocks aaj <strong>52-Week High tod gaye</strong> — strong breakout signal, momentum strong hai
              </div>
            )}
            {tab === 'near' && (
              <div className="scanner-info-banner near-banner">
                ⚡ Ye stocks 52-Week High se <strong>5% neeche</strong> hain — breakout aane wala hai, watch karo
              </div>
            )}

            <div className="scanner-list-header">
              <span>Stock</span>
              <span>Price</span>
              <span>52W High</span>
              <span>High se %</span>
              <span>Change</span>
            </div>

            {list.map((item) => {
              const pct = parseFloat(item.pctFrom52W);
              return (
                <button
                  key={item.symbol}
                  className={`scanner-row ${item.brokeOut ? 'crossed-row' : 'near-row'}`}
                  onClick={() => onSelect(item.symbol)}
                  title={`Click to analyze ${item.symbol}`}
                >
                  <div className="row-stock">
                    <span className="row-symbol">{item.symbol}</span>
                    <span className="row-name">{item.name}</span>
                  </div>
                  <span className="row-price">₹{item.price}</span>
                  <span className="row-dma">₹{item.high52w}</span>
                  <span className={`row-gap ${pct >= 0 ? 'positive' : 'negative'}`}>
                    {pct >= 0 ? '+' : ''}{item.pctFrom52W}%
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
