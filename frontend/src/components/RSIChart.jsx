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

export default function RSIChart({ rsiSeries, theme }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, { ...getTheme(theme), width: containerRef.current.clientWidth, height: 160 });
    chartRef.current = chart;

    const rsiLine = chart.addLineSeries({ color: '#a78bfa', lineWidth: 1.5, priceLineVisible: false });
    const ob = chart.addLineSeries({ color: 'rgba(239,68,68,0.5)', lineWidth: 1, priceLineVisible: false, lineStyle: 2 });
    const os = chart.addLineSeries({ color: 'rgba(34,197,94,0.5)', lineWidth: 1, priceLineVisible: false, lineStyle: 2 });

    if (rsiSeries?.length) {
      rsiLine.setData(rsiSeries);
      ob.setData(rsiSeries.map(d => ({ time: d.time, value: 70 })));
      os.setData(rsiSeries.map(d => ({ time: d.time, value: 30 })));
      chart.timeScale().fitContent();
    }

    const handleResize = () => { if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth }); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [rsiSeries]);

  useEffect(() => {
    if (chartRef.current) chartRef.current.applyOptions(getTheme(theme));
  }, [theme]);

  return (
    <div className="sub-chart">
      <div className="sub-chart-label">RSI (14)</div>
      <div ref={containerRef} style={{ width: '100%' }} />
    </div>
  );
}
