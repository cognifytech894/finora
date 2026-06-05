import { useState, useEffect } from 'react';

const INDICES = [
  { key: 'NIFTY50', label: 'NIFTY 50', symbol: '^NSEI', mock: { price: '24,752.15', change: '+127.40', pct: '+0.52%', pos: true } },
  { key: 'SENSEX',  label: 'SENSEX',   symbol: '^BSESN', mock: { price: '81,224.90', change: '+389.10', pct: '+0.48%', pos: true } },
  { key: 'BANKNIFTY', label: 'BANK NIFTY', symbol: '^NSEBANK', mock: { price: '52,148.60', change: '-84.25', pct: '-0.16%', pos: false } },
  { key: 'VIX', label: 'INDIA VIX', symbol: '^INDIAVIX', mock: { price: '13.42', change: '+0.28', pct: '+2.13%', pos: false } },
];

export default function MarketBar() {
  const [data] = useState(INDICES.map(i => ({ ...i, ...i.mock })));
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isMarketOpen = () => {
    const h = time.getHours(), m = time.getMinutes();
    const mins = h * 60 + m;
    const day = time.getDay();
    return day >= 1 && day <= 5 && mins >= 555 && mins < 930; // 9:15 to 15:30
  };

  return (
    <div className="market-bar">
      <div className="market-indices">
        {data.map(d => (
          <div key={d.key} className={`market-card ${d.pos ? 'pos' : 'neg'}`}>
            <div className="mc-label">{d.label}</div>
            <div className="mc-price">{d.price}</div>
            <div className={`mc-change ${d.pos ? 'up' : 'dn'}`}>
              {d.change} <span className="mc-pct">({d.pct})</span>
            </div>
          </div>
        ))}
      </div>
      <div className="market-status-area">
        <div className={`mkt-status-dot ${isMarketOpen() ? 'open' : 'closed'}`} />
        <span className="mkt-status-txt">{isMarketOpen() ? 'Market Open' : 'Market Closed'}</span>
        <span className="mkt-time">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    </div>
  );
}
