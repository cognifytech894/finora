import { useState, useCallback } from 'react';
import { scanDMA200 } from '../api/stockApi';
import { useDataCache } from '../hooks/useDataCache';

export default function DMA200Scanner({ onSelect }) {
  const [tab, setTab] = useState('crossed');

  const fetchFn = useCallback(() => scanDMA200(), []);
  const { data, loading, error, lastUpdated, refresh } = useDataCache(
    'scanner:dma200',
    fetchFn,
    { staleMs: 15 * 60 * 1000 }   // 15 min stale time
  );

  const list = data ? (tab === 'crossed' ? data.crossed : data.near) : [];

  const fmtUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-IN')
    : null;

  return (
    <div className="scanner-section">
      {/* Header */}
      <div className="scanner-header">
        <div className="scanner-title-row">
          <div className="scanner-title">
            <span className="scanner-icon">📈</span>
            <span>200 DMA Crossover Scanner</span>
          </div>
          <button
            className={`scanner-refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={refresh}
            disabled={loading}
            title="Refresh scan"
          >
            ↻
          </button>
        </div>
        <div className="scanner-meta">
          {fmtUpdated && !loading && (
            <span className="scanner-time">
              Updated: {fmtUpdated}
              {data && ` · ${data.totalScanned} stocks scanned`}
              {data?.symbolSource && ` · ${data.symbolSource}`}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="scanner-tabs">
        <button
          className={`scanner-tab ${tab === 'crossed' ? 'active crossed' : ''}`}
          onClick={() => setTab('crossed')}
        >
          🚀 Crossed Above
          {data && <span className="tab-badge crossed">{data.crossed.length}</span>}
        </button>
        <button
          className={`scanner-tab ${tab === 'near' ? 'active near' : ''}`}
          onClick={() => setTab('near')}
        >
          ⚡ Near Crossover
          {data && <span className="tab-badge near">{data.near.length}</span>}
        </button>
      </div>

      {/* Body */}
      <div className="scanner-body">
        {loading && (
          <div className="scanner-loading">
            <div className="scanner-spinner" />
            <div>Poore NSE market ka 200 DMA scan ho raha hai…</div>
            <div className="scanner-loading-sub">2000+ stocks · 1Y data · 2–5 min lag sakta hai</div>
          </div>
        )}

        {error && !loading && (
          <div className="scanner-error">
            <span>⚠️</span> {error}
            <button className="scanner-retry" onClick={refresh}>Retry</button>
          </div>
        )}

        {!loading && !error && data && list.length === 0 && (
          <div className="scanner-empty">
            <div className="empty-scan-icon">{tab === 'crossed' ? '🔍' : '📊'}</div>
            <div>
              {tab === 'crossed'
                ? 'Aaj koi stock 200 DMA ke upar cross nahi kiya'
                : 'Koi stock 200 DMA ke paas nahi hai (within 1.5%)'}
            </div>
          </div>
        )}

        {!loading && !error && list.length > 0 && (
          <div className="scanner-list">
            {tab === 'crossed' && (
              <div className="scanner-info-banner crossed-banner">
                ✅ Ye stocks aaj 200 DMA ke <strong>niche se upar</strong> cross kar gaye — strong bullish signal
              </div>
            )}
            {tab === 'near' && (
              <div className="scanner-info-banner near-banner">
                ⚡ Ye stocks 200 DMA se <strong>1.5% niche</strong> hain — crossover hone wala hai
              </div>
            )}

            <div className="scanner-list-header">
              <span>Stock</span>
              <span>Price</span>
              <span>200 DMA</span>
              <span>Gap %</span>
              <span>Change</span>
            </div>

            {list.map((item) => (
              <button
                key={item.symbol}
                className={`scanner-row ${item.crossedAbove ? 'crossed-row' : 'near-row'}`}
                onClick={() => onSelect(item.symbol)}
                title={`Click to analyze ${item.symbol}`}
              >
                <div className="row-stock">
                  <span className="row-symbol">{item.symbol}</span>
                  <span className="row-name">{item.name}</span>
                </div>
                <span className="row-price">₹{item.price}</span>
                <span className="row-dma">₹{item.dma200}</span>
                <span className={`row-gap ${parseFloat(item.gapPct) >= 0 ? 'positive' : 'negative'}`}>
                  {parseFloat(item.gapPct) >= 0 ? '+' : ''}{item.gapPct}%
                </span>
                <span className={`row-change ${parseFloat(item.changePct) >= 0 ? 'positive' : 'negative'}`}>
                  {parseFloat(item.changePct) >= 0 ? '+' : ''}{item.changePct}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
