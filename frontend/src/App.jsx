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
import { invalidateAllCache } from './hooks/useDataCache';
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
  const [theme, setTheme]       = useState(() => localStorage.getItem('sharemint-theme') || 'dark');
  const [spinning, setSpinning] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const { watchlist, quotes, refreshing, addToWatchlist, removeFromWatchlist } = useWatchlist();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sharemint-theme', theme);
  }, [theme]);

  // Global refresh: cache invalidate karo, scanners apne aap re-fetch karenge
  const handleRefresh = () => {
    setSpinning(true);
    invalidateAllCache();               // ← sab scanner cache saaf
    setTimeout(() => setSpinning(false), 1200);
  };

  // Stock select from news: dashboard pe le jao aur symbol set karo
  const handleStockSelectFromNews = (sym) => {
    setSymbol(sym);
    setActiveTab('dashboard');
  };

  return (
    <div className="app">
      {/* ── TOP HEADER ── */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Share <em>Mint</em></span>
          <span className="logo-badge">sharemint.co</span>
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
            title="Refresh all scanners (cache clear karke fresh data fetch karega)"
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
            {/*
            <div className="dash-center">
              {/* No key prop needed — cache handles no-refetch on tab switch */}
              <DMA200Scanner onSelect={setSymbol} />
            </div>
            <div className="dash-right">
              <NewsFeed onStockSelect={handleStockSelectFromNews} />
            </div>
            */}
          </div>
        )}

        {/* SCANNERS TAB */}
        {activeTab === 'scanners' && (
          <div className="scanners-layout">
            <div className="col-panel">
              <DMA200Scanner onSelect={setSymbol} />
            </div>
            <div className="col-panel">
              <ATHScanner onSelect={setSymbol} />
            </div>
            <div className="col-panel">
              <AutoSalesScanner onSelect={setSymbol} />
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
            <NewsFeed onStockSelect={handleStockSelectFromNews} />
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
