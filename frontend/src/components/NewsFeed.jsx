import { useState, useEffect } from 'react';

const MOCK_NEWS = [
  { id: 1, headline: 'Reliance Industries signs major LNG deal with Qatar Energy for 10 years', company: 'RELIANCE', time: '10m ago', sentiment: 'positive', sector: 'Energy' },
  { id: 2, headline: 'BEL wins ₹1,200 crore defence contract from Indian Navy for radar systems', company: 'BEL', time: '25m ago', sentiment: 'positive', sector: 'Defence' },
  { id: 3, headline: 'TCS updates Q2 guidance citing strong demand from BFSI vertical globally', company: 'TCS', time: '45m ago', sentiment: 'positive', sector: 'IT' },
  { id: 4, headline: 'RBI holds repo rate at 6.5%, maintains withdrawal of accommodation stance', company: 'MACRO', time: '1h ago', sentiment: 'neutral', sector: 'Macro' },
  { id: 5, headline: 'Adani Ports reports record container throughput of 4.2 MMT for October', company: 'ADANIPORTS', time: '2h ago', sentiment: 'positive', sector: 'Logistics' },
  { id: 6, headline: 'HDFC Bank Q2 net profit rises 18% YoY to ₹16,800 crore, beats estimates', company: 'HDFCBANK', time: '3h ago', sentiment: 'positive', sector: 'Banking' },
  { id: 7, headline: 'Paytm faces fresh regulatory scrutiny over KYC compliance issues: Report', company: 'PAYTM', time: '4h ago', sentiment: 'negative', sector: 'Fintech' },
  { id: 8, headline: 'Maruti Suzuki launches new Brezza with updated features, bookings open', company: 'MARUTI', time: '5h ago', sentiment: 'neutral', sector: 'Auto' },
  { id: 9, headline: 'L&T wins ₹5,000 crore order for metro rail project in South India', company: 'LT', time: '6h ago', sentiment: 'positive', sector: 'Infrastructure' },
  { id: 10, headline: 'Infosys revises FY25 revenue guidance upward to 4.5-5% in constant currency', company: 'INFY', time: '8h ago', sentiment: 'positive', sector: 'IT' },
];

const SENTIMENT_COLORS = { positive: '#22c55e', neutral: '#f59e0b', negative: '#ef4444' };
const SENTIMENT_LABELS = { positive: '▲ Positive', neutral: '● Neutral', negative: '▼ Negative' };

export default function NewsFeed() {
  const [filter, setFilter] = useState('all');
  const [news] = useState(MOCK_NEWS);

  const filtered = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  return (
    <div className="news-root">
      <div className="news-header">
        <span className="news-title">📰 Live News</span>
        <div className="news-filters">
          {['all', 'positive', 'neutral', 'negative'].map(f => (
            <button
              key={f}
              className={`news-filter ${filter === f ? 'active' : ''}`}
              style={filter === f && f !== 'all' ? { color: SENTIMENT_COLORS[f], borderColor: SENTIMENT_COLORS[f] } : {}}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="news-list">
        {filtered.map(n => (
          <div key={n.id} className="news-item">
            <div className="news-item-top">
              <span className="news-company">{n.company}</span>
              <span className="news-time">{n.time}</span>
            </div>
            <div className="news-headline">{n.headline}</div>
            <div className="news-item-bot">
              <span className="news-sector">{n.sector}</span>
              <span className="news-sentiment" style={{ color: SENTIMENT_COLORS[n.sentiment] }}>
                {SENTIMENT_LABELS[n.sentiment]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
