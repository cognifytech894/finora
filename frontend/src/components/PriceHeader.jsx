import { fmt, isPositive } from '../utils/format';

export default function PriceHeader({ data }) {
  if (!data) return null;
  const { name, symbol, exchange, currency, price } = data;
  const pos = isPositive(price?.change);

  return (
    <div className="price-header">
      <div className="price-meta">
        <div className="stock-name">{name}</div>
        <div className="stock-tags">
          <span className="tag">{symbol}</span>
          <span className="tag">{exchange}</span>
          <span className="tag">{currency}</span>
        </div>
      </div>
      <div className="price-block">
        <div className="price-current">{fmt.price(price?.current)}</div>
        <div className={`price-change ${pos ? 'pos' : 'neg'}`}>
          {pos ? '▲' : '▼'} {fmt.price(Math.abs(price?.change))} ({fmt.pct(price?.changePct)})
        </div>
      </div>
    </div>
  );
}
