export const fmt = {
  price: (v) => v != null ? `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
  pct: (v) => v != null ? `${parseFloat(v) >= 0 ? '+' : ''}${parseFloat(v).toFixed(2)}%` : '—',
  num: (v) => v != null ? parseFloat(v).toFixed(2) : '—',
  vol: (v) => {
    if (!v) return '—';
    if (v >= 1e7) return (v / 1e7).toFixed(2) + ' Cr';
    if (v >= 1e5) return (v / 1e5).toFixed(2) + ' L';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
    return v.toString();
  },
};

export const isPositive = (v) => parseFloat(v) >= 0;

export const INTERVALS = [
  { label: '15m', value: '15m', range: '5d' },
  { label: '1h', value: '60m', range: '1mo' },
  { label: '1D', value: '1d', range: '6mo' },
  { label: '1W', value: '1wk', range: '2y' },
  { label: '1M', value: '1mo', range: '5y' },
];

export const RANGES = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
];
