import { useState, useEffect, useRef } from 'react';
import { useSearch } from '../hooks/useStock';

const POPULAR = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'WIPRO', name: 'Wipro' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
];

export default function SearchBar({ onSelect, currentSymbol }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { results, searching, search, clear } = useSearch();
  const wrapRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { clear(); return; }
    timerRef.current = setTimeout(() => search(query.trim()), 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (symbol) => {
    setQuery('');
    setOpen(false);
    clear();
    onSelect(symbol);
  };

  const displayList = query.trim().length > 0 ? results : POPULAR;
  const showDropdown = open && displayList.length > 0;

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-box">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          placeholder="Search NSE stocks — RELIANCE, TCS, INFY..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="search-input"
          spellCheck={false}
        />
        {searching && <span className="search-spinner" />}
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); clear(); }}>✕</button>
        )}
      </div>

      {showDropdown && (
        <div className="search-dropdown">
          {!query.trim() && <div className="dropdown-section-label">Popular Stocks</div>}
          {displayList.map((item) => (
            <button
              key={item.symbol}
              className={`dropdown-item ${item.symbol === currentSymbol ? 'active' : ''}`}
              onClick={() => handleSelect(item.symbol)}
            >
              <span className="item-symbol">{item.symbol}</span>
              <span className="item-name">{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
