import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAutoSales } from '../api/stockApi';

const FYS    = ['FY2024-25', 'FY2023-24', 'FY2022-23'];
const SEGS   = [
  { value: 'all', label: 'Sabhi Segments' },
  { value: 'PV',  label: 'Passenger Vehicles' },
  { value: '2W',  label: 'Two Wheelers' },
  { value: 'CV',  label: 'Commercial Vehicles' },
];
const TABS   = ['market-share', 'monthly', 'trend'];
const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

function fmtUnits(n) {
  if (!n && n !== 0) return '—';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)   return Math.round(n / 1000) + 'K';
  return String(n);
}

// ── Tiny bar built with DOM only (no canvas) ─────────────────────────────────
function Bar({ pct, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:6, background:'var(--surface3)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
        <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background:color, borderRadius:3 }} />
      </div>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, minWidth:36, color:'var(--text2)' }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ values, color, width=80, height=28 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Donut chart (pure SVG, no lib) ────────────────────────────────────────────
function DonutChart({ slices, size=160 }) {
  const r    = size * 0.38;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const [hovered, setHovered] = useState(null);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => {
        const dash    = (s.pct / 100) * circ;
        const gap     = circ - dash;
        const rotate  = (offset / 100) * 360 - 90;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={hovered === i ? 18 : 14}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotate} ${cx} ${cy})`}
            style={{ cursor:'pointer', transition:'stroke-width 0.15s', opacity: hovered !== null && hovered !== i ? 0.5 : 1 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        );
        offset += s.pct;
        return el;
      })}
      {hovered !== null && (
        <>
          <text x={cx} y={cy - 8}  textAnchor="middle" fill={slices[hovered].color}  fontSize="13" fontWeight="600">
            {slices[hovered].pct.toFixed(1)}%
          </text>
          <text x={cx} y={cy + 8}  textAnchor="middle" fill="var(--text2)" fontSize="9.5">
            {slices[hovered].name.split(' ')[0]}
          </text>
        </>
      )}
      {hovered === null && (
        <text x={cx} y={cy + 5} textAnchor="middle" fill="var(--text2)" fontSize="10">
          Market
        </text>
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AutoSalesScanner({ onSelect }) {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [fy,          setFy]          = useState('FY2024-25');
  const [seg,         setSeg]         = useState('all');
  const [tab,         setTab]         = useState('market-share');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortMonth,   setSortMonth]   = useState(11); // March by default

  const load = useCallback(async (fyVal, segVal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAutoSales(fyVal, segVal);
      setData(result);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Data load nahi hua. Backend server running hai? (localhost:5000)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(fy, seg); }, []);

  const handleFy  = e => { setFy(e.target.value);  load(e.target.value, seg); };
  const handleSeg = e => { setSeg(e.target.value); load(fy, e.target.value); };

  const companies = data?.companies || [];

  // Sort companies by selected month sales (descending)
  const sorted = [...companies].sort((a, b) => b.monthly[sortMonth] - a.monthly[sortMonth]);

  return (
    <div className="scanner-section">

      {/* ── HEADER ── */}
      <div className="scanner-header">
        <div className="scanner-title-row">
          <div className="scanner-title">
            <span className="scanner-icon">🚗</span>
            <span>Auto Sales &amp; Market Share</span>
          </div>
          <button
            className={`scanner-refresh-btn ${loading ? 'spinning' : ''}`}
            onClick={() => load(fy, seg)}
            disabled={loading}
            title="Refresh"
          >↻</button>
        </div>

        <div style={{ display:'flex', gap:8, padding:'6px 12px 0', flexWrap:'wrap' }}>
          <select
            value={fy}
            onChange={handleFy}
            style={{ fontSize:11, padding:'4px 8px', borderRadius:6,
              background:'var(--surface3)', border:'1px solid var(--border)',
              color:'var(--text)', cursor:'pointer' }}
          >
            {FYS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={seg}
            onChange={handleSeg}
            style={{ fontSize:11, padding:'4px 8px', borderRadius:6,
              background:'var(--surface3)', border:'1px solid var(--border)',
              color:'var(--text)', cursor:'pointer' }}
          >
            {SEGS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="scanner-meta" style={{ paddingLeft:12, paddingTop:4 }}>
          {lastUpdated && !loading && (
            <span className="scanner-time">
              {fy} · {companies.length} companies
              {data && ` · Total: ${fmtUnits(data.grandTotal)} units`}
            </span>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="scanner-tabs">
        <button
          className={`scanner-tab ${tab === 'market-share' ? 'active crossed' : ''}`}
          onClick={() => setTab('market-share')}
        >
          🥧 Market Share
        </button>
        <button
          className={`scanner-tab ${tab === 'monthly' ? 'active near' : ''}`}
          onClick={() => setTab('monthly')}
        >
          📋 Monthly Data
        </button>
        <button
          className={`scanner-tab ${tab === 'trend' ? 'active' : ''}`}
          onClick={() => setTab('trend')}
          style={tab === 'trend' ? {
            background:'rgba(56,189,248,0.12)', color:'#38bdf8',
            borderBottom:'2px solid #38bdf8'
          } : {}}
        >
          📈 Trend
        </button>
      </div>

      {/* ── BODY ── */}
      <div className="scanner-body">

        {loading && (
          <div className="scanner-loading">
            <div className="scanner-spinner" />
            <div>Auto sales data load ho raha hai…</div>
          </div>
        )}

        {error && !loading && (
          <div className="scanner-error">
            <span>⚠️</span> {error}
            <button className="scanner-retry" onClick={() => load(fy, seg)}>Retry</button>
          </div>
        )}

        {/* ── MARKET SHARE TAB ── */}
        {!loading && !error && data && tab === 'market-share' && (
          <div>
            <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap', marginBottom:16 }}>
              <DonutChart
                size={148}
                slices={companies.map(c => ({ name: c.name, pct: c.annualShare, color: c.color }))}
              />
              <div style={{ flex:1, minWidth:200 }}>
                {companies
                  .slice()
                  .sort((a,b) => b.annualShare - a.annualShare)
                  .map(c => (
                    <div
                      key={c.ticker}
                      onClick={() => onSelect && onSelect(c.nse)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0',
                        borderBottom:'1px solid var(--border)', cursor:'pointer' }}
                    >
                      <span style={{ width:8, height:8, borderRadius:'50%',
                        background:c.color, flexShrink:0, display:'inline-block' }} />
                      <span style={{ flex:1, fontSize:12, color:'var(--text)', fontWeight:500 }}>
                        {c.name}
                      </span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:11,
                        color:'var(--text2)', minWidth:40, textAlign:'right' }}>
                        {fmtUnits(c.annual)}
                      </span>
                      <div style={{ width:120 }}>
                        <Bar pct={c.annualShare} color={c.color} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              {companies
                .slice()
                .sort((a,b) => b.annualShare - a.annualShare)
                .slice(0,2)
                .map((c, i) => (
                  <div key={c.ticker}
                    onClick={() => onSelect && onSelect(c.nse)}
                    style={{
                      background:'var(--surface2)', borderRadius:8,
                      border:`1px solid ${c.color}44`, padding:'10px 12px', cursor:'pointer'
                    }}>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:2 }}>
                      {i === 0 ? '🏆 Market Leader' : '🥈 #2 Rank'}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:c.color }}>{c.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:18, color:'var(--text)', marginTop:2 }}>
                      {c.annualShare}%
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>{fmtUnits(c.annual)} units/year</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── MONTHLY DATA TAB ── */}
        {!loading && !error && data && tab === 'monthly' && (
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>
              Month select karke sort karein ↓
            </div>

            {/* Month selector */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
              {MONTHS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setSortMonth(i)}
                  style={{
                    fontSize:10, padding:'3px 7px', borderRadius:4,
                    border:`1px solid ${sortMonth === i ? 'var(--accent)' : 'var(--border)'}`,
                    background: sortMonth === i ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: sortMonth === i ? 'var(--accent)' : 'var(--text2)',
                    cursor:'pointer',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Company rows */}
            {sorted.map(c => (
              <div
                key={c.ticker}
                onClick={() => onSelect && onSelect(c.nse)}
                style={{
                  background:'var(--surface2)', borderRadius:8,
                  border:'1px solid var(--border)', padding:'10px 12px',
                  marginBottom:8, cursor:'pointer',
                  transition:'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = c.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%',
                      background:c.color, display:'inline-block' }} />
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{c.name}</span>
                    <span style={{ fontSize:10, color:'var(--text3)',
                      background:'var(--surface3)', borderRadius:4, padding:'1px 5px' }}>
                      {c.segment}
                    </span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:c.color, fontWeight:600 }}>
                      {fmtUnits(c.monthly[sortMonth])}
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>
                      {MONTHS[sortMonth]} · {c.monthlyShare[sortMonth]}% share
                    </div>
                  </div>
                </div>

                {/* Mini monthly bar chart */}
                <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:28 }}>
                  {c.monthly.map((v, mi) => {
                    const maxV = Math.max(...c.monthly);
                    const h    = Math.max(3, (v / maxV) * 24);
                    const isSelected = mi === sortMonth;
                    return (
                      <div
                        key={mi}
                        title={`${MONTHS[mi]}: ${fmtUnits(v)} (${c.monthlyShare[mi]}%)`}
                        style={{
                          flex:1, height:h,
                          background: isSelected ? c.color : c.color + '55',
                          borderRadius:'2px 2px 0 0',
                          transition:'height 0.2s',
                        }}
                      />
                    );
                  })}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:10, color:'var(--text3)' }}>Apr</span>
                  <span style={{ fontSize:10, color:'var(--text3)' }}>Mar</span>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'var(--text3)' }}>
                  <span>Annual: <b style={{ color:'var(--text2)' }}>{fmtUnits(c.annual)}</b></span>
                  <span>MoM: <b style={{ color: c.momChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {c.momChange >= 0 ? '▲' : '▼'}{Math.abs(c.momChange)}%
                  </b></span>
                  <span>Share: <b style={{ color:c.color }}>{c.annualShare}%</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TREND TAB ── */}
        {!loading && !error && data && tab === 'trend' && (
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10 }}>
              Har company ka monthly sales trend (sparkline) aur market share
            </div>

            {/* Stacked share bar per month */}
            <div style={{ background:'var(--surface2)', borderRadius:8,
              border:'1px solid var(--border)', padding:'10px 12px', marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text2)', marginBottom:8, fontWeight:500 }}>
                Monthly market share stacked
              </div>
              {MONTHS.map((m, mi) => (
                <div key={m} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{ width:24, fontSize:10, color:'var(--text3)', flexShrink:0 }}>{m}</span>
                  <div style={{ flex:1, display:'flex', height:12, borderRadius:4, overflow:'hidden', gap:1 }}>
                    {companies.map(c => (
                      <div
                        key={c.ticker}
                        title={`${c.name}: ${c.monthlyShare[mi]}%`}
                        style={{ width:`${c.monthlyShare[mi]}%`, background:c.color,
                          transition:'width 0.3s' }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize:10, color:'var(--text3)', minWidth:52,
                    fontFamily:'var(--font-mono)' }}>
                    {fmtUnits(data.monthTotals[mi])}
                  </span>
                </div>
              ))}

              {/* Legend */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
                {companies.map(c => (
                  <div key={c.ticker} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10 }}>
                    <span style={{ width:8, height:8, borderRadius:2,
                      background:c.color, display:'inline-block' }} />
                    <span style={{ color:'var(--text2)' }}>{c.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-company sparkline rows */}
            {[...companies]
              .sort((a,b) => b.annualShare - a.annualShare)
              .map(c => (
                <div
                  key={c.ticker}
                  onClick={() => onSelect && onSelect(c.nse)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                    borderRadius:8, border:'1px solid var(--border)',
                    background:'var(--surface2)', marginBottom:6, cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = c.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span style={{ width:8, height:8, borderRadius:'50%',
                    background:c.color, flexShrink:0, display:'inline-block' }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text)',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>{c.ticker} · {c.segment}</div>
                  </div>
                  <Sparkline values={c.monthly} color={c.color} width={72} height={26} />
                  <div style={{ textAlign:'right', minWidth:52 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:13,
                      color:c.color, fontWeight:600 }}>
                      {c.annualShare}%
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>share</div>
                  </div>
                  <div style={{ textAlign:'right', minWidth:40 }}>
                    <div style={{ fontSize:11, color: c.momChange >= 0 ? 'var(--green)' : 'var(--red)',
                      fontFamily:'var(--font-mono)' }}>
                      {c.momChange >= 0 ? '▲' : '▼'}{Math.abs(c.momChange)}%
                    </div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>MoM</div>
                  </div>
                </div>
              ))}
          </div>
        )}

      </div>
    </div>
  );
}
