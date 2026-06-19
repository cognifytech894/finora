import { useState } from 'react';

// ── Helper: proper datetime format ─────────────────────────────────────────────
function fmtDateTime(isoOrMs) {
  const d = new Date(isoOrMs);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time };
}

function timeAgo(isoOrMs) {
  const diff = Date.now() - new Date(isoOrMs).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Mock news with full content + proper ISO timestamps ─────────────────────────
const now = Date.now();
const MOCK_NEWS = [
  {
    id: 1,
    headline: 'Reliance Industries signs major LNG deal with Qatar Energy for 10 years',
    summary: 'Reliance Industries Limited (RIL) has entered into a long-term Liquefied Natural Gas (LNG) supply agreement with QatarEnergy for a period of 10 years. The deal is valued at approximately $5 billion and will ensure steady energy supply for Reliance\'s petrochemicals and industrial operations. This strategic move is aligned with India\'s push to diversify its energy mix and reduce dependence on spot LNG purchases, which have been volatile in recent years due to global supply disruptions.',
    content: 'The agreement was signed during the World Energy Congress in Amsterdam, with Reliance Chairman Mukesh Ambani and QatarEnergy CEO Saad Al-Kaabi present at the signing ceremony. Under the terms, QatarEnergy will supply approximately 5 million metric tonnes per annum (MMTPA) of LNG to Reliance\'s Hazira LNG terminal in Gujarat.\n\nAnalysts view this deal positively for RIL\'s downstream petrochemicals business, which benefits from stable and cost-competitive feedstock. The long-term nature of the contract also hedges Reliance against spot market volatility.\n\nIn reaction to the news, RIL shares rose 1.8% in early trade on NSE, outperforming the broader Nifty 50 index.',
    company: 'RELIANCE',
    symbols: ['RELIANCE'],
    source: 'Economic Times',
    url: 'https://economictimes.indiatimes.com',
    publishedAt: new Date(now - 10 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    sector: 'Energy',
  },
  {
    id: 2,
    headline: 'BEL wins ₹1,200 crore defence contract from Indian Navy for radar systems',
    summary: 'Bharat Electronics Limited (BEL) has secured a significant order worth ₹1,200 crore from the Indian Navy for advanced radar systems. The contract covers supply, installation, and maintenance of next-generation naval surveillance radar systems for frontline warships.',
    content: 'The order is part of India\'s broader Atmanirbhar Bharat defence procurement initiative, aimed at reducing imports and boosting domestic defence manufacturing. BEL will develop and supply the radar systems from its Bengaluru and Hyderabad facilities.\n\nThis win adds to BEL\'s already robust order book of over ₹58,000 crore. The company has been a consistent beneficiary of India\'s defence modernisation push, with orders from all three armed forces.\n\nBEL management indicated the project will be executed over 36 months, generating significant revenue recognition in FY26 and FY27.',
    company: 'BEL',
    symbols: ['BEL'],
    source: 'Business Standard',
    url: 'https://business-standard.com',
    publishedAt: new Date(now - 25 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    sector: 'Defence',
  },
  {
    id: 3,
    headline: 'TCS updates Q2 guidance citing strong demand from BFSI vertical globally',
    summary: 'Tata Consultancy Services (TCS) has revised its Q2 FY26 revenue growth guidance upward, driven by strong deal pipeline and accelerated spending from the Banking, Financial Services, and Insurance (BFSI) vertical across North America and Europe.',
    content: 'In a pre-result analyst briefing, TCS CFO Samir Seksaria noted that deal closures in the BFSI segment have accelerated, particularly for cloud migration and AI-led transformation programs. The company is seeing increased traction in its generative AI-related service offerings.\n\nTCS also highlighted that attrition has declined to 12.3%, the lowest in six quarters, which bodes well for delivery margins. The company expects to hire approximately 40,000 freshers in FY26.\n\nMajor deal wins announced include a $500 million, 7-year managed services contract with a leading European bank and a digital transformation engagement with a US-based insurance conglomerate.',
    company: 'TCS',
    symbols: ['TCS', 'INFY', 'WIPRO', 'HCLTECH'],
    source: 'Mint',
    url: 'https://livemint.com',
    publishedAt: new Date(now - 45 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    sector: 'IT',
  },
  {
    id: 4,
    headline: 'RBI holds repo rate at 6.5%, maintains withdrawal of accommodation stance',
    summary: 'The Reserve Bank of India\'s Monetary Policy Committee (MPC) unanimously decided to hold the repo rate at 6.5% in its June meeting, maintaining its stance of "withdrawal of accommodation" to ensure inflation remains aligned with the 4% target.',
    content: 'RBI Governor Shaktikanta Das, in his post-policy address, emphasized that while headline CPI inflation has moderated to 4.2%, core inflation remains sticky at around 4.9%. The central bank remains vigilant about food price pressures, particularly vegetables and pulses.\n\nThe MPC revised the FY26 GDP growth forecast marginally upward to 7.2% from 7.0%, citing robust domestic consumption and capex recovery. The RBI also announced measures to improve liquidity management in the banking system.\n\nBond markets reacted with the 10-year benchmark yield easing 5 basis points to 6.98%, while the Rupee strengthened modestly against the dollar.',
    company: 'MACRO',
    symbols: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'],
    source: 'RBI Press Release',
    url: 'https://rbi.org.in',
    publishedAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
    sentiment: 'neutral',
    sector: 'Macro',
  },
  {
    id: 5,
    headline: 'Adani Ports reports record container throughput of 4.2 MMT for October',
    summary: 'Adani Ports and Special Economic Zone (APSEZ) reported record container handling of 4.2 million metric tonnes at its Mundra port for October 2025, representing a 14% year-on-year growth. The milestone reinforces Mundra\'s position as India\'s largest commercial port.',
    content: 'The throughput growth was driven by increased EXIM trade, particularly electronics and textiles. APSEZ CEO Karan Adani attributed the performance to investments in berth automation and vessel turnaround optimization.\n\nThe company\'s Vizhinjam deep-water port in Kerala also started commercial operations, adding strategic capacity on India\'s western coast. APSEZ is on track to handle 500 MMT of cargo by FY30.\n\nThe strong operational data supports analyst consensus of ~18% revenue growth for FY26, with margin expansion expected from automation initiatives.',
    company: 'ADANIPORTS',
    symbols: ['ADANIPORTS', 'ADANIENT'],
    source: 'Financial Express',
    url: 'https://financialexpress.com',
    publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    sector: 'Logistics',
  },
  {
    id: 6,
    headline: 'HDFC Bank Q2 net profit rises 18% YoY to ₹16,800 crore, beats estimates',
    summary: 'HDFC Bank reported a strong Q2 FY26 performance with net profit growing 18% year-on-year to ₹16,800 crore, beating Bloomberg consensus estimate of ₹16,100 crore. Net Interest Income grew 12% to ₹30,200 crore.',
    content: 'The bank\'s gross NPA ratio improved to 1.24% from 1.33% in the previous quarter, signaling asset quality improvement post the HDFC merger integration. PCR (Provision Coverage Ratio) stands at a healthy 74%.\n\nHDFC Bank MD & CEO Sashidhar Jagdishan said the focus remains on deposit mobilisation and CASA improvement. The CASA ratio stands at 37.5%, improving from 36.8% last quarter.\n\nCredit growth was led by retail (personal loans, home loans) and commercial banking segments. The management guided for 18–20% credit growth for FY26.',
    company: 'HDFCBANK',
    symbols: ['HDFCBANK', 'HDFCAMC', 'HDFCLIFE'],
    source: 'CNBC-TV18',
    url: 'https://cnbctv18.com',
    publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    sector: 'Banking',
  },
  {
    id: 7,
    headline: 'Paytm faces fresh regulatory scrutiny over KYC compliance issues: Report',
    summary: 'One97 Communications (Paytm) is facing renewed scrutiny from the Financial Intelligence Unit (FIU-IND) over KYC compliance lapses at its payments bank subsidiary. The regulator has sought clarification on customer verification processes for high-value transactions.',
    content: 'According to sources familiar with the matter, FIU-IND has flagged potential gaps in Paytm\'s re-KYC processes for existing customers, particularly those with balances above ₹1 lakh. Paytm is yet to respond officially.\n\nThis development comes at a sensitive time for the fintech company, which has been working to restore regulatory confidence following RBI actions earlier this year. The company has been rebuilding its compliance infrastructure under new leadership.\n\nShares of Paytm fell 4.2% on the news, extending recent underperformance. Analysts caution that further regulatory action could materially impact user retention and revenue momentum.',
    company: 'PAYTM',
    symbols: ['PAYTM'],
    source: 'Reuters India',
    url: 'https://reuters.com',
    publishedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    sentiment: 'negative',
    sector: 'Fintech',
  },
  {
    id: 8,
    headline: 'Maruti Suzuki launches new Brezza with updated features, bookings open',
    summary: 'Maruti Suzuki India launched the 2026 Brezza SUV with a refreshed exterior, enhanced connected car features, and a new 6-speed automatic transmission option. Bookings opened at ₹11,000 via dealerships and the Maruti website.',
    content: 'The updated Brezza features a 1.5L K15C Smart Hybrid petrol engine producing 103 PS, mated to either a 5-speed manual or the new 6-speed AT. Key additions include an improved 9-inch SmartPlay Pro+ infotainment system, ADAS Level 1 features, and panoramic sunroof on top variants.\n\nMaruti expects the new Brezza to maintain its dominant position in the B-SUV segment where it competes with Nexon, Venue, and Vitara Brezza predecessors. The launch price is expected to range from ₹8.5 lakh to ₹15 lakh (ex-showroom).\n\nAnalysts note this launch is strategically timed ahead of the festive season and is expected to boost Q3 volumes. Maruti sold 1.7 lakh units of the Brezza in FY25.',
    company: 'MARUTI',
    symbols: ['MARUTI'],
    source: 'Autocar India',
    url: 'https://autocarindia.com',
    publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    sentiment: 'neutral',
    sector: 'Auto',
  },
  {
    id: 9,
    headline: 'L&T wins ₹5,000 crore order for metro rail project in South India',
    summary: 'Larsen & Toubro\'s infrastructure division has bagged a prestigious ₹5,000 crore order for the construction of a metro rail corridor in a major South Indian city. The project involves 18.5 km of elevated track and 16 stations.',
    content: 'The order includes civil construction, tunneling, viaduct works, and station construction. L&T will also supply traction substations and oversee systems integration. The project is expected to be completed in 42 months.\n\nThis win takes L&T\'s order book to ₹4.8 lakh crore, the highest in the company\'s history. The metro and urban infra segment has been a key growth driver with several Smart City Mission projects under execution.\n\nL&T CFO R. Shankar Raman said the company is on track to achieve 15% order inflow growth in FY26, driven by both domestic and international infrastructure awards.',
    company: 'LT',
    symbols: ['LT', 'LTIM', 'LTTS'],
    source: 'Hindu Business Line',
    url: 'https://thehindubusinessline.com',
    publishedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    sector: 'Infrastructure',
  },
  {
    id: 10,
    headline: 'Infosys revises FY25 revenue guidance upward to 4.5-5% in constant currency',
    summary: 'Infosys raised its FY26 revenue guidance in constant currency terms to 4.5–5%, up from the earlier 4–4.5%, citing strong deal conversions and improving discretionary IT spending environment in key markets.',
    content: 'CEO Salil Parekh attributed the guidance upgrade to accelerating large deal closures and early signs of discretionary spend recovery, particularly in Financial Services and Manufacturing verticals in the US and Europe.\n\nInfosys reported a large deal Total Contract Value (TCV) of $2.4 billion in Q2, its second highest ever. The company\'s headcount has stabilised, with net addition of 2,800 employees in the quarter.\n\nOperating margin came in at 21.1%, within the guided band of 20–22%. Management expressed confidence in delivering the upper end of the margin range for the full year, driven by operational leverage and pyramid optimisation.',
    company: 'INFY',
    symbols: ['INFY', 'TCS', 'WIPRO', 'TECHM'],
    source: 'Moneycontrol',
    url: 'https://moneycontrol.com',
    publishedAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    sentiment: 'positive',
    sector: 'IT',
  },
];

const SENTIMENT_COLORS = { positive: '#22c55e', neutral: '#f59e0b', negative: '#ef4444' };
const SENTIMENT_LABELS = { positive: '▲ Positive', neutral: '● Neutral', negative: '▼ Negative' };

// ── News Detail Page ────────────────────────────────────────────────────────────
function NewsDetail({ article, onBack, onStockSelect }) {
  const { date, time } = fmtDateTime(article.publishedAt);
  const ago = timeAgo(article.publishedAt);

  return (
    <div className="news-detail-root">
      {/* Back button */}
      <button className="news-detail-back" onClick={onBack}>
        ← News par wapas jao
      </button>

      {/* Article header */}
      <div className="news-detail-header">
        <div className="news-detail-meta-row">
          <span className="news-detail-source">{article.source}</span>
          <span className="news-detail-sector-badge">{article.sector}</span>
          <span
            className="news-detail-sentiment"
            style={{ color: SENTIMENT_COLORS[article.sentiment] }}
          >
            {SENTIMENT_LABELS[article.sentiment]}
          </span>
        </div>
        <h1 className="news-detail-headline">{article.headline}</h1>
        <div className="news-detail-datetime">
          <span className="news-detail-date">📅 {date} • {time}</span>
          <span className="news-detail-ago">({ago})</span>
        </div>
      </div>

      {/* Related stocks */}
      {article.symbols?.length > 0 && (
        <div className="news-detail-stocks">
          <span className="news-detail-stocks-label">Related Stocks:</span>
          <div className="news-detail-stocks-list">
            {article.symbols.map(sym => (
              <button
                key={sym}
                className="news-stock-chip"
                onClick={() => onStockSelect && onStockSelect(sym)}
                title={`${sym} ka chart dekhein`}
              >
                {sym} ↗
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="news-detail-section">
        <h3 className="news-detail-section-title">Summary</h3>
        <p className="news-detail-summary">{article.summary}</p>
      </div>

      {/* Full content */}
      <div className="news-detail-section">
        <h3 className="news-detail-section-title">Details</h3>
        {article.content.split('\n\n').map((para, i) => (
          <p key={i} className="news-detail-para">{para}</p>
        ))}
      </div>

      {/* Original link */}
      <div className="news-detail-footer">
        <a
          className="news-detail-link"
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          🔗 Original article padhein — {article.source}
        </a>
      </div>
    </div>
  );
}

// ── News Feed (list view) ───────────────────────────────────────────────────────
export default function NewsFeed({ onStockSelect }) {
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);   // null = list, article = detail

  if (selected) {
    return (
      <NewsDetail
        article={selected}
        onBack={() => setSelected(null)}
        onStockSelect={onStockSelect}
      />
    );
  }

  const filtered = filter === 'all'
    ? MOCK_NEWS
    : MOCK_NEWS.filter(n => n.sentiment === filter);

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
        {filtered.map(n => {
          const { date, time } = fmtDateTime(n.publishedAt);
          const ago = timeAgo(n.publishedAt);
          return (
            <button
              key={n.id}
              className="news-item news-item-clickable"
              onClick={() => setSelected(n)}
              title="Click to read full article"
            >
              <div className="news-item-top">
                <span className="news-company">{n.company}</span>
                <div className="news-time-block">
                  <span className="news-datetime">{date} • {time}</span>
                  <span className="news-time-ago">{ago}</span>
                </div>
              </div>
              <div className="news-headline">{n.headline}</div>
              <div className="news-item-bot">
                <span className="news-sector">{n.sector}</span>
                <span className="news-sentiment" style={{ color: SENTIMENT_COLORS[n.sentiment] }}>
                  {SENTIMENT_LABELS[n.sentiment]}
                </span>
                <span className="news-read-more">Read more →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
