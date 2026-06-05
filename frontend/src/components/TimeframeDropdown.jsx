import { useState, useRef, useEffect } from 'react';

const TIMEFRAME_GROUPS = [
  {
    label: 'MINUTES',
    items: [
      { label: '1 minute',   value: '1m',  range: '1d'  },
      { label: '2 minutes',  value: '2m',  range: '5d'  },
      { label: '5 minutes',  value: '5m',  range: '5d'  },
      { label: '15 minutes', value: '15m', range: '5d'  },
      { label: '30 minutes', value: '30m', range: '1mo' },
      { label: '60 minutes', value: '60m', range: '1mo' },
      { label: '90 minutes', value: '90m', range: '1mo' },
    ],
  },
  {
    label: 'HOURS',
    items: [
      { label: '1 hour',  value: '60m', range: '1mo' },
      { label: '2 hours', value: '2h',  range: '3mo' },
    ],
  },
  {
    label: 'DAYS',
    items: [
      { label: '1 day',  value: '1d',  range: '6mo' },
      { label: '5 days', value: '5d',  range: '1y'  },
    ],
  },
  {
    label: 'WEEKS & MONTHS',
    items: [
      { label: '1 week',  value: '1wk', range: '2y' },
      { label: '1 month', value: '1mo', range: '5y' },
      { label: '3 months',value: '3mo', range: '5y' },
    ],
  },
];

// flat list for lookup
const ALL_TF = TIMEFRAME_GROUPS.flatMap(g => g.items);

function getLabelForValue(val) {
  const found = ALL_TF.find(t => t.value === val);
  return found ? found.label : val;
}

export default function TimeframeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item) => {
    onChange(item);
    setOpen(false);
  };

  return (
    <div className="tf-wrap" ref={ref}>
      <button className="tf-trigger" onClick={() => setOpen(o => !o)}>
        <span className="tf-icon">⏱</span>
        <span className="tf-label">{getLabelForValue(value)}</span>
        <span className={`tf-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="tf-dropdown">
          {TIMEFRAME_GROUPS.map(group => (
            <div key={group.label} className="tf-group">
              <div className="tf-group-label">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.value + item.label}
                  className={`tf-item ${value === item.value ? 'active' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <span>{item.label}</span>
                  {value === item.value && <span className="tf-check">✓</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
