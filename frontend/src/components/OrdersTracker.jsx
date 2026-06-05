import { useState } from 'react';

const MOCK_ORDERS = [
  { company: 'BEL', value: '₹1,200 Cr', client: 'Indian Navy', sector: 'Defence', date: 'Today', pos: true },
  { company: 'L&T', value: '₹5,000 Cr', client: 'Govt. Project', sector: 'Infrastructure', date: 'Today', pos: true },
  { company: 'IRCON', value: '₹890 Cr', client: 'Indian Railways', sector: 'Railway', date: '2d ago', pos: true },
  { company: 'HAL', value: '₹2,300 Cr', client: 'IAF', sector: 'Defence', date: '3d ago', pos: true },
  { company: 'NTPC', value: '₹450 Cr', client: 'PGCIL', sector: 'Power', date: '4d ago', pos: true },
  { company: 'TCS', value: '₹780 Cr', client: 'Global Bank', sector: 'IT', date: '5d ago', pos: true },
  { company: 'RVNL', value: '₹1,100 Cr', client: 'Ministry of Railways', sector: 'Railway', date: '1w ago', pos: true },
];

const SECTORS = ['All', 'Defence', 'Railway', 'IT', 'Power', 'Infrastructure'];

const SECTOR_COLORS = {
  Defence: '#ef4444',
  Railway: '#f59e0b',
  IT: '#6366f1',
  Power: '#22c55e',
  Infrastructure: '#38bdf8',
};

export default function OrdersTracker() {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.sector === filter);

  return (
    <div className="orders-root">
      <div className="orders-header">
        <span className="orders-title">🏗️ Major Orders & Contracts</span>
        <span className="orders-badge">Live</span>
      </div>
      <div className="orders-filters">
        {SECTORS.map(s => (
          <button
            key={s}
            className={`orders-filter-btn ${filter === s ? 'active' : ''}`}
            style={filter === s && s !== 'All' ? { borderColor: SECTOR_COLORS[s], color: SECTOR_COLORS[s] } : {}}
            onClick={() => setFilter(s)}
          >{s}</button>
        ))}
      </div>
      <div className="orders-list">
        {filtered.map((o, i) => (
          <div key={i} className="order-row" style={{ borderLeft: `3px solid ${SECTOR_COLORS[o.sector] || '#6366f1'}` }}>
            <div className="order-left">
              <span className="order-company">{o.company}</span>
              <span className="order-client">{o.client}</span>
            </div>
            <div className="order-right">
              <span className="order-value">{o.value}</span>
              <div className="order-meta">
                <span className="order-sector" style={{ color: SECTOR_COLORS[o.sector] }}>{o.sector}</span>
                <span className="order-date">{o.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="orders-note">📌 Data from NSE/BSE corporate announcements</div>
    </div>
  );
}
