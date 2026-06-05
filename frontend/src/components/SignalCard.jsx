export default function SignalCard({ signal, indicators, price }) {
  if (!signal) return null;

  const { signal: sig, color, strength, reasons, score } = signal;

  return (
    <div className="signal-card" style={{ '--sig-color': color }}>
      <div className="signal-badge">
        <div className="signal-label">{sig}</div>
        <div className="signal-strength-bar">
          <div className="signal-strength-fill" style={{ width: `${strength}%`, background: color }} />
        </div>
        <div className="signal-score">Conviction: {strength}%</div>
      </div>

      <div className="indicator-grid">
        <Stat label="RSI (14)" value={indicators?.rsi} hint={
          indicators?.rsi > 70 ? 'Overbought' : indicators?.rsi < 30 ? 'Oversold' : 'Neutral'
        } />
        <Stat label="MACD" value={indicators?.macd} hint={
          parseFloat(indicators?.macd) > parseFloat(indicators?.macdSignal) ? 'Bullish' : 'Bearish'
        } />
        <Stat label="SMA 20" value={`₹${indicators?.sma20}`} />
        <Stat label="SMA 50" value={`₹${indicators?.sma50}`} />
        <Stat label="52W High" value={`₹${price?.high52w}`} />
        <Stat label="52W Low" value={`₹${price?.low52w}`} />
      </div>

      <div className="signal-reasons">
        <div className="reasons-title">Analysis</div>
        {reasons?.map((r, i) => (
          <div key={i} className={`reason-item ${r.includes('bullish') || r.includes('cross') && r.includes('Golden') ? 'bull' : r.includes('bearish') || r.includes('Death') ? 'bear' : 'neutral'}`}>
            <span className="reason-dot" />
            {r}
          </div>
        ))}
      </div>

      <div className="disclaimer">⚠️ Educational only. Consult SEBI-registered advisor before investing.</div>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
