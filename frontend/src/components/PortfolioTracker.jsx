import { useState, useEffect } from 'react';
import { quoteStock } from '../api/stockApi';

const STORAGE_KEY = 'finora-portfolio-v1';

export default function PortfolioTracker() {
  const [holdings, setHoldings] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });
  const [addMode, setAddMode] = useState(false);
  const [form, setForm] = useState({ symbol: '', buyPrice: '', qty: '' });
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    if (holdings.length === 0) return;
    const fetchAll = async () => {
      setLoading(true);
      const results = {};
      await Promise.all(holdings.map(async h => {
        try {
          const q = await quoteStock(h.symbol);
          results[h.symbol] = parseFloat(q.price);
        } catch { results[h.symbol] = null; }
      }));
      setQuotes(results);
      setLoading(false);
    };
    fetchAll();
  }, [holdings]);

  const handleAdd = () => {
    if (!form.symbol.trim() || !form.buyPrice || !form.qty) return;
    const sym = form.symbol.trim().toUpperCase();
    setHoldings(h => [...h, { symbol: sym, buyPrice: parseFloat(form.buyPrice), qty: parseInt(form.qty) }]);
    setForm({ symbol: '', buyPrice: '', qty: '' });
    setAddMode(false);
  };

  const remove = (sym) => setHoldings(h => h.filter(x => x.symbol !== sym));

  const totalInvested = holdings.reduce((s, h) => s + h.buyPrice * h.qty, 0);
  const totalCurrent = holdings.reduce((s, h) => {
    const cur = quotes[h.symbol];
    return s + (cur ? cur * h.qty : h.buyPrice * h.qty);
  }, 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="pf-root">
      <div className="pf-header">
        <div className="pf-title-row">
          <span className="pf-title">💼 Portfolio</span>
          <button className="pf-add-btn" onClick={() => setAddMode(v => !v)}>
            {addMode ? '✕' : '＋'}
          </button>
        </div>
        {holdings.length > 0 && (
          <div className="pf-summary">
            <div className="pf-sum-item">
              <span className="pf-sum-label">Invested</span>
              <span className="pf-sum-val">₹{(totalInvested/100000).toFixed(2)}L</span>
            </div>
            <div className="pf-sum-item">
              <span className="pf-sum-label">Current</span>
              <span className="pf-sum-val">₹{(totalCurrent/100000).toFixed(2)}L</span>
            </div>
            <div className="pf-sum-item">
              <span className="pf-sum-label">P&amp;L</span>
              <span className={`pf-sum-val bold ${totalPnl >= 0 ? 'up' : 'dn'}`}>
                {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toFixed(0)} ({totalPct >= 0 ? '+' : ''}{totalPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {addMode && (
        <div className="pf-add-form">
          <input className="pf-inp" placeholder="Symbol (e.g. RELIANCE)" value={form.symbol}
            onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} />
          <input className="pf-inp" placeholder="Buy Price ₹" type="number" value={form.buyPrice}
            onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} />
          <input className="pf-inp" placeholder="Qty" type="number" value={form.qty}
            onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
          <button className="pf-submit-btn" onClick={handleAdd}>Add</button>
        </div>
      )}

      {holdings.length === 0 && !addMode && (
        <div className="pf-empty">
          <div style={{ fontSize: 24, opacity: .3 }}>💼</div>
          <div className="pf-empty-txt">Portfolio khaali hai</div>
          <button className="pf-add-btn big" onClick={() => setAddMode(true)}>＋ Holding Add Karo</button>
        </div>
      )}

      <div className="pf-list">
        {holdings.map(h => {
          const cur = quotes[h.symbol];
          const pnl = cur ? (cur - h.buyPrice) * h.qty : null;
          const pct = cur ? ((cur - h.buyPrice) / h.buyPrice) * 100 : null;
          return (
            <div key={h.symbol} className="pf-row">
              <div className="pf-row-left">
                <span className="pf-sym">{h.symbol}</span>
                <span className="pf-qty">{h.qty} shares @ ₹{h.buyPrice}</span>
              </div>
              <div className="pf-row-right">
                {loading ? (
                  <span className="pf-loading">...</span>
                ) : cur ? (
                  <>
                    <span className="pf-cur-price">₹{cur.toFixed(2)}</span>
                    <span className={`pf-pnl ${pnl >= 0 ? 'up' : 'dn'}`}>
                      {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toFixed(0)} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
                    </span>
                  </>
                ) : <span className="pf-loading">—</span>}
              </div>
              <button className="pf-del" onClick={() => remove(h.symbol)}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
