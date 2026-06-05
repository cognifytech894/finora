import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { calcSMA, calcEMA } from '../utils/maCalc';

function getChartTheme(theme) {
  const dark = theme === 'dark';
  return {
    layout: {
      background: { color: dark ? '#0a0f1a' : '#ffffff' },
      textColor: dark ? '#94a3b8' : '#475569',
    },
    grid: {
      vertLines: { color: dark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.06)' },
      horzLines: { color: dark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.06)' },
    },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: {
      borderColor: dark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.12)',
    },
    timeScale: {
      borderColor: dark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.12)',
      timeVisible: true,
    },
  };
}

export default function CandlestickChart({ series, customMAs, showVolume, theme }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volumeRef    = useRef(null);
  const maLinesRef   = useRef({}); // { id: lineSeries }

  // Init chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      ...getChartTheme(theme),
      width: containerRef.current.clientWidth,
      height: 400,
    });
    chartRef.current = chart;

    candleRef.current = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });

    volumeRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Theme change
  useEffect(() => {
    chartRef.current?.applyOptions(getChartTheme(theme));
  }, [theme]);

  // Load candle + volume data
  useEffect(() => {
    if (!series?.candles || !candleRef.current) return;
    candleRef.current.setData(series.candles.map(c => ({
      time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
    })));
    volumeRef.current?.setData(series.candles.map((c, i) => ({
      time: c.time,
      value: c.volume || 0,
      color: i > 0 && c.close >= series.candles[i - 1].close
        ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
    })));
    chartRef.current?.timeScale().fitContent();
  }, [series]);

  // Volume visibility
  useEffect(() => {
    volumeRef.current?.applyOptions({ visible: showVolume });
  }, [showVolume]);

  // Custom MAs — add / remove / update visibility
  useEffect(() => {
    if (!series?.candles || !chartRef.current) return;
    const closes = series.candles.map(c => c.close);
    const times  = series.candles.map(c => c.time);
    const currentIds = new Set(customMAs.map(ma => ma.id));

    // Remove deleted MAs
    Object.keys(maLinesRef.current).forEach(id => {
      if (!currentIds.has(parseInt(id))) {
        chartRef.current.removeSeries(maLinesRef.current[id]);
        delete maLinesRef.current[id];
      }
    });

    // Add / update each MA
    customMAs.forEach(ma => {
      const values = ma.type === 'EMA' ? calcEMA(closes, ma.period) : calcSMA(closes, ma.period);
      const lineData = times
        .map((t, i) => ({ time: t, value: values[i] }))
        .filter(p => p.value != null);

      if (!maLinesRef.current[ma.id]) {
        maLinesRef.current[ma.id] = chartRef.current.addLineSeries({
          color: ma.color,
          lineWidth: 1.5,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false,
          title: `${ma.type}${ma.period}`,
        });
      }
      maLinesRef.current[ma.id].setData(lineData);
      maLinesRef.current[ma.id].applyOptions({ color: ma.color, visible: ma.active });
    });
  }, [series, customMAs]);

  return (
    <div className="chart-wrapper">
      <div ref={containerRef} style={{ width: '100%' }} />
    </div>
  );
}
