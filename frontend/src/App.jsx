import { useState, useEffect } from 'react';
import DMA200Scanner    from './components/DMA200Scanner';
import ATHScanner       from './components/ATHScanner';
import AutoSalesScanner from './components/AutoSalesScanner';
import Watchlist        from './components/Watchlist';
import MarketBar        from './components/MarketBar';
import PortfolioTracker from './components/PortfolioTracker';
import OrdersTracker    from './components/OrdersTracker';
import NewsFeed         from './components/NewsFeed';
import { useWatchlist } from './hooks/useWatchlist';
import './App.css';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'scanners',  label: 'Scanners',  icon: '🔍' },
  { id: 'orders',    label: 'Orders',    icon: '🏗️' },
  { id: 'news',      label: 'News',      icon: '📰' },
  { id: 'portfolio', label: 'Portfolio', icon: '💼' },
];

export default function App() {
  const [symbol, setSymbol]     = useState(null);
  const [theme, setTheme]       = useState(() => localStorage.getItem('finora-theme') || 'dark');
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const { watchlist, quotes, refreshing, addToWatchlist, removeFromWatchlist } = useWatchlist();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finora-theme', theme);
  }, [theme]);

  const handleRefresh = () => {
    setSpinning(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setSpinning(false), 1200);
  };

  return (
    <div className="app">
      {/* ── TOP HEADER ── */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Fin<em>ora</em></span>
          <span className="logo-badge">India</span>
        </div>

        {/* NAV TABS */}
        <nav className="app-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-right">
          {symbol && (
            <div className="selected-symbol-badge">
              <span className="sel-label">Selected:</span>
              <span className="sel-sym">{symbol}</span>
              <button className="sel-clear" onClick={() => setSymbol(null)}>✕</button>
            </div>
          )}
          <button
            className={`refresh-btn ${spinning ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={spinning}
            title="Refresh all scanners"
          >
            <span className="refresh-icon">↻</span>
            <span className="refresh-txt">Refresh</span>
          </button>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            <span className="toggle-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <div className="toggle-track"><div className="toggle-thumb" /></div>
          </button>
        </div>
      </header>

      {/* ── MARKET BAR ── */}
      <MarketBar />

      {/* ── CONTENT AREA ── */}
      <div className="app-body">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-layout">
            <div className="dash-left">
              <Watchlist
                watchlist={watchlist}
                quotes={quotes}
                refreshing={refreshing}
                onSelect={setSymbol}
                onAdd={addToWatchlist}
                onRemove={removeFromWatchlist}
              />
            </div>
            <div className="dash-center">
              <DMA200Scanner key={`dma-${refreshKey}`} onSelect={setSymbol} />
            </div>
            <div className="dash-right">
              <NewsFeed />
            </div>
          </div>
        )}

        {/* SCANNERS TAB */}
        {activeTab === 'scanners' && (
          <div className="scanners-layout">
            <div className="col-panel">
              <DMA200Scanner key={`dma-s-${refreshKey}`} onSelect={setSymbol} />
            </div>
            <div className="col-panel">
              <ATHScanner key={`ath-s-${refreshKey}`} onSelect={setSymbol} />
            </div>
            <div className="col-panel">
              <AutoSalesScanner key={`auto-s-${refreshKey}`} onSelect={setSymbol} />
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="single-panel-layout">
            <OrdersTracker />
          </div>
        )}

        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <div className="single-panel-layout">
            <NewsFeed />
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="single-panel-layout">
            <PortfolioTracker />
          </div>
        )}

      </div>
    </div>
  );
}
