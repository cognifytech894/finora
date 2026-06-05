import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

function getTheme(theme) {
  const dark = theme === 'dark';
  return {
    layout: { background: { color: dark ? '#0a0f1a' : '#ffffff' }, textColor: dark ? '#94a3b8' : '#475569' },
    grid: { vertLines: { color: dark ? 'rgba(51,65,85,0.2)' : 'rgba(0,0,0,0.05)' }, horzLines: { color: dark ? 'rgba(51,65,85,0.2)' : 'rgba(0,0,0,0.05)' } },
    rightPriceScale: { borderColor: dark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.12)' },
    timeScale: { borderColor: dark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.12)', timeVisible: true },
  };
}

export default function MACDChart({ macdSeries, signalSeries, histogramSeries, theme }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !macdSeries?.length) return;
    const chart = createChart(containerRef.current, { ...getTheme(theme), width: containerRef.current.clientWidth, height: 160 });
    chartRef.current = chart;

    const hist = chart.addHistogramSeries({ priceLineVisible: false });
    const macd = chart.addLineSeries({ color: '#38bdf8', lineWidth: 1.5, priceLineVisible: false });
    const signal = chart.addLineSeries({ color: '#fb923c', lineWidth: 1, priceLineVisible: false });

    hist.setData((histogramSeries || []).map(d => ({ ...d, color: d.value >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)' })));
    macd.setData(macdSeries || []);
    signal.setData(signalSeries || []);
    chart.timeScale().fitContent();

    const handleResize = () => { if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth }); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [macdSeries, signalSeries, histogramSeries]);

  useEffect(() => {
    if (chartRef.current) chartRef.current.applyOptions(getTheme(theme));
  }, [theme]);

  return (
    <div className="sub-chart">
      <div className="sub-chart-label">MACD (12,26,9)</div>
      <div ref={containerRef} style={{ width: '100%' }} />
    </div>
  );
}
