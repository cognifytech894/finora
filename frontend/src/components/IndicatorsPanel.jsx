import { useState } from 'react';

const POPULAR = [
  { key: 'rsi',        label: 'Relative Strength Index',   short: 'RSI',        type: 'subchart' },
  { key: 'macd',       label: 'MACD',                       short: 'MACD',       type: 'subchart' },
  { key: 'bollinger',  label: 'Bollinger Bands',            short: 'BB',         type: 'overlay'  },
  { key: 'vwap',       label: 'VWAP',                       short: 'VWAP',       type: 'overlay'  },
  { key: 'supertrend', label: 'SuperTrend',                 short: 'ST',         type: 'overlay'  },
  { key: 'volume',     label: 'Volume',                     short: 'VOL',        type: 'overlay'  },
];

const MOVING_AVERAGES = [
  { key: 'sma',  label: 'Moving Average (SMA)', short: 'SMA', type: 'ma' },
  { key: 'ema',  label: 'Moving Average Exponential (EMA)', short: 'EMA', type: 'ma' },
  { key: 'wma',  label: 'Weighted Moving Average (WMA)',    short: 'WMA', type: 'ma' },
];

const OTHER = [
  { key: 'atr',       label: 'Average True Range',         short: 'ATR',   type: 'subchart' },
  { key: 'stoch',     label: 'Stochastic Oscillator',      short: 'STOCH', type: 'subchart' },
  { key: 'cci',       label: 'CCI',                        short: 'CCI',   type: 'subchart' },
  { key: 'adx',       label: 'Average Directional Index',  short: 'ADX',   type: 'subchart' },
  { key: 'obv',       label: 'On Balance Volume',          short: 'OBV',   type: 'subchart' },
  { key: 'williams',  label: 'Williams %R',                short: 'WR',    type: 'subchart' },
  { key: 'pivots',    label: 'Pivot Points Standard',      short: 'PP',    type: 'overlay'  },
  { key: 'high52',    label: '52 Week High / Low',         short: '52W',   type: 'overlay'  },
];

const ALL = [...POPULAR, ...MOVING_AVERAGES, ...OTHER];

const TYPE_COLOR = { overlay: '#6366f1', subchart: '#f59e0b', ma: '#22c55e' };

export default function IndicatorsPanel({
  activeIndicators, onToggle,
  showVolume, onVolumeToggle,
  customMAs, onAddMA, onRemoveMA, onToggleMA
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [maConfig, setMaConfig] = useState({ period: '', type: 'SMA', color: '#f59e0b' });

  const filtered = query.trim()
    ? ALL.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.short.toLowerCase().includes(query.toLowerCase()))
    : null;

  const handleToggle = (ind) => {
    if (ind.key === 'volume') { onVolumeToggle(); return; }
    if (ind.type === 'ma') return; // MAs handled separately
    onToggle(ind.key);
  };

  const isActive = (key) => {
    if (key === 'volume') return showVolume;
    return activeIndicators.includes(key);
  };

  const handleAddMA = () => {
    const p = parseInt(maConfig.period);
    if (!p || p < 1 || p > 500) return;
    onAddMA({ period: p, type: maConfig.type, color: maConfig.color });
    setMaConfig(c => ({ ...c, period: '' }));
  };

  return (
    <>
      {/* Trigger button */}
      <button className="ind-trigger-btn" onClick={() => setOpen(true)}>
        <span>📊</span> Indicators
        {(activeIndicators.length + customMAs.filter(m=>m.active).length + (showVolume?1:0)) > 0 && (
          <span className="ind-trigger-badge">
            {activeIndicators.length + customMAs.filter(m=>m.active).length + (showVolume?1:0)}
          </span>
        )}
      </button>

      {/* Active chips below chart toolbar */}
      {(activeIndicators.length > 0 || customMAs.length > 0 || showVolume) && (
        <div className="ind-active-chips">
          {showVolume && (
            <span className="ind-chip-active" style={{'--chip-c':'#94a3b8'}}>
              VOL <button onClick={onVolumeToggle}>✕</button>
            </span>
          )}
          {activeIndicators.map(key => {
            const ind = ALL.find(i => i.key === key);
            return ind ? (
              <span key={key} className="ind-chip-active" style={{'--chip-c': TYPE_COLOR[ind.type] || '#6366f1'}}>
                {ind.short} <button onClick={() => onToggle(key)}>✕</button>
              </span>
            ) : null;
          })}
          {customMAs.map(ma => (
            <span key={ma.id} className="ind-chip-active" style={{'--chip-c': ma.color}}>
              {ma.type}{ma.period}
              <button onClick={() => onToggleMA(ma.id)} style={{opacity: ma.active ? 1 : 0.4}}>{'●'}</button>
              <button onClick={() => onRemoveMA(ma.id)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="ind-backdrop" onClick={() => setOpen(false)}>
          <div className="ind-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="ind-modal-header">
              <span className="ind-modal-title">Indicators</span>
              <button className="ind-modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Search */}
            <div className="ind-modal-search">
              <span className="ind-search-icon">⌕</span>
              <input
                autoFocus
                type="text"
                placeholder="Search indicators..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="ind-search-input"
              />
              {query && <button className="ind-search-clear" onClick={() => setQuery('')}>✕</button>}
            </div>

            <div className="ind-modal-body">
              {/* Search results */}
              {filtered ? (
                <div className="ind-section">
                  <div className="ind-section-label">RESULTS</div>
                  {filtered.length === 0 && <div className="ind-no-results">Koi indicator nahi mila</div>}
                  {filtered.map(ind => (
                    <IndRow key={ind.key} ind={ind} active={isActive(ind.key)} onToggle={() => handleToggle(ind)} />
                  ))}
                </div>
              ) : (
                <>
                  {/* Popular */}
                  <div className="ind-section">
                    <div className="ind-section-label">POPULAR INDICATORS</div>
                    {POPULAR.map(ind => (
                      <IndRow key={ind.key} ind={ind} active={isActive(ind.key)} onToggle={() => handleToggle(ind)} />
                    ))}
                  </div>

                  {/* Moving Averages */}
                  <div className="ind-section">
                    <div className="ind-section-label">MOVING AVERAGES</div>
                    {MOVING_AVERAGES.map(ind => (
                      <IndRow key={ind.key} ind={ind} active={false} onToggle={() => {}} isMA />
                    ))}
                    {/* MA Config */}
                    <div className="ind-ma-config">
                      <input
                        type="number" min="1" max="500"
                        placeholder="Period (1–500)"
                        value={maConfig.period}
                        onChange={e => setMaConfig(c => ({...c, period: e.target.value}))}
                        className="ind-ma-input"
                        onKeyDown={e => e.key === 'Enter' && handleAddMA()}
                      />
                      <select className="ind-ma-select" value={maConfig.type} onChange={e => setMaConfig(c => ({...c, type: e.target.value}))}>
                        <option>SMA</option>
                        <option>EMA</option>
                        <option>WMA</option>
                      </select>
                      <input type="color" value={maConfig.color} onChange={e => setMaConfig(c => ({...c, color: e.target.value}))} className="ind-ma-color" />
                      <button className="ind-ma-add" onClick={handleAddMA}>+ Add</button>
                    </div>
                    {/* Active MAs */}
                    {customMAs.map(ma => (
                      <div key={ma.id} className="ind-ma-row">
                        <span className="ind-ma-dot" style={{background: ma.color}} />
                        <span className="ind-ma-label">{ma.type} {ma.period}</span>
                        <button className={`ind-ma-toggle ${ma.active ? 'on' : 'off'}`} onClick={() => onToggleMA(ma.id)}>
                          {ma.active ? 'ON' : 'OFF'}
                        </button>
                        <button className="ind-ma-del" onClick={() => onRemoveMA(ma.id)}>✕</button>
                      </div>
                    ))}
                  </div>

                  {/* Other */}
                  <div className="ind-section">
                    <div className="ind-section-label">OTHER INDICATORS</div>
                    {OTHER.map(ind => (
                      <IndRow key={ind.key} ind={ind} active={isActive(ind.key)} onToggle={() => handleToggle(ind)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IndRow({ ind, active, onToggle }) {
  return (
    <button className={`ind-row ${active ? 'active' : ''}`} onClick={onToggle}>
      <div className="ind-row-left">
        <span className="ind-row-label">{ind.label}</span>
      </div>
      <div className={`ind-row-check ${active ? 'checked' : ''}`}>
        {active ? '✓' : ''}
      </div>
    </button>
  );
}
