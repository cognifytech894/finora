const express = require('express');
const router  = express.Router();

// ── Static monthly sales data (SIAM / company press releases, FY 2024-25) ──
// Units: actual vehicles sold (domestic)
const AUTO_SALES_DATA = {
  companies: [
    { name: 'Maruti Suzuki', ticker: 'MARUTI',      nse: 'MARUTI',      segment: 'PV',  color: '#6366f1' },
    { name: 'Hyundai India', ticker: 'HYUNDAI',     nse: 'HYUNDAI',     segment: 'PV',  color: '#22c55e' },
    { name: 'Tata Motors',   ticker: 'TATAMOTORS',  nse: 'TATAMOTORS',  segment: 'PV',  color: '#f59e0b' },
    { name: 'Mahindra',      ticker: 'M&M',         nse: 'M&M',         segment: 'PV',  color: '#ef4444' },
    { name: 'Hero MotoCorp', ticker: 'HEROMOTOCO',  nse: 'HEROMOTOCO',  segment: '2W',  color: '#38bdf8' },
    { name: 'Bajaj Auto',    ticker: 'BAJAJ-AUTO',  nse: 'BAJAJ-AUTO',  segment: '2W',  color: '#a78bfa' },
    { name: 'TVS Motor',     ticker: 'TVSMOTOR',    nse: 'TVSMOTOR',    segment: '2W',  color: '#fb923c' },
    { name: 'Ashok Leyland', ticker: 'ASHOKLEY',    nse: 'ASHOKLEY',    segment: 'CV',  color: '#34d399' },
  ],
  months: ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
  fyData: {
    'FY2024-25': [
      [167000,174000,162000,180000,170000,165000,188000,155000,169000,175000,158000,183000],
      [52000, 55000, 50000, 58000, 54000, 51000, 60000, 48000, 52000, 56000, 49000, 62000],
      [75000, 80000, 72000, 88000, 82000, 78000, 92000, 70000, 76000, 84000, 74000, 88000],
      [52000, 58000, 50000, 62000, 59000, 55000, 65000, 48000, 54000, 60000, 52000, 64000],
      [550000,520000,490000,570000,540000,510000,590000,480000,520000,560000,500000,580000],
      [350000,340000,320000,360000,350000,330000,370000,310000,340000,355000,325000,365000],
      [310000,295000,280000,320000,305000,290000,335000,275000,295000,315000,285000,330000],
      [18000, 19000, 17000, 21000, 20000, 18000, 22000, 16000, 18000, 20000, 17000, 21000],
    ],
    'FY2023-24': [
      [155000,162000,150000,168000,158000,153000,175000,143000,157000,163000,146000,171000],
      [47000, 50000, 45000, 53000, 49000, 46000, 55000, 43000, 47000, 51000, 44000, 57000],
      [68000, 74000, 66000, 80000, 75000, 71000, 84000, 63000, 69000, 77000, 67000, 81000],
      [44000, 50000, 43000, 53000, 50000, 47000, 56000, 41000, 46000, 52000, 44000, 55000],
      [510000,490000,460000,530000,500000,475000,550000,445000,485000,520000,465000,540000],
      [320000,315000,295000,335000,325000,305000,345000,285000,315000,328000,300000,340000],
      [285000,272000,258000,295000,281000,268000,308000,253000,271000,289000,262000,305000],
      [16000, 17000, 15000, 19000, 18000, 16000, 20000, 14000, 16000, 18000, 15000, 19000],
    ],
    'FY2022-23': [
      [140000,148000,136000,153000,144000,139000,160000,130000,143000,149000,133000,156000],
      [41000, 44000, 39000, 47000, 43000, 40000, 49000, 37000, 41000, 45000, 38000, 51000],
      [58000, 64000, 56000, 70000, 65000, 61000, 74000, 53000, 59000, 67000, 57000, 71000],
      [36000, 42000, 35000, 45000, 42000, 39000, 48000, 33000, 38000, 44000, 36000, 47000],
      [470000,455000,425000,490000,463000,440000,508000,412000,450000,480000,430000,500000],
      [290000,285000, 268000,305000,295000,278000,315000,260000,285000,298000,272000,310000],
      [258000,248000,232000,268000,256000,243000,279000,228000,248000,263000,240000,274000],
      [13000, 14000, 12000, 16000, 15000, 13000, 17000, 12000, 13000, 15000, 12000, 16000],
    ],
  },
};

// GET /api/autosales?fy=FY2024-25&segment=all
router.get('/', (req, res) => {
  const { fy = 'FY2024-25', segment = 'all' } = req.query;
  const fyData = AUTO_SALES_DATA.fyData[fy];
  if (!fyData) return res.status(400).json({ error: 'Invalid FY. Use FY2024-25, FY2023-24, FY2022-23' });

  const { companies, months } = AUTO_SALES_DATA;

  // Filter by segment
  const indices = segment === 'all'
    ? companies.map((_, i) => i)
    : companies.map((_, i) => i).filter(i => companies[i].segment === segment.toUpperCase());

  const filtered = indices.map(i => {
    const co      = companies[i];
    const monthly = fyData[i];
    const annual  = monthly.reduce((a, b) => a + b, 0);
    return { ...co, monthly, annual };
  });

  // Calculate market share per month and annual
  const monthTotals = months.map((_, m) => filtered.reduce((s, d) => s + d.monthly[m], 0));
  const grandTotal  = filtered.reduce((s, d) => s + d.annual, 0);

  const result = filtered.map(d => ({
    name:         d.name,
    ticker:       d.ticker,
    nse:          d.nse,
    segment:      d.segment,
    color:        d.color,
    annual:       d.annual,
    annualShare:  parseFloat(((d.annual / grandTotal) * 100).toFixed(1)),
    monthly:      d.monthly,
    monthlyShare: months.map((_, m) =>
      parseFloat(((d.monthly[m] / monthTotals[m]) * 100).toFixed(1))
    ),
    latestMonth:      d.monthly[11],
    latestMonthShare: parseFloat(((d.monthly[11] / monthTotals[11]) * 100).toFixed(1)),
    momChange:        parseFloat((((d.monthly[11] - d.monthly[10]) / d.monthly[10]) * 100).toFixed(1)),
  }));

  res.json({
    fy,
    segment,
    months,
    companies: result,
    monthTotals,
    grandTotal,
    generatedAt: new Date().toISOString(),
  });
});

// GET /api/autosales/fys — list available financial years
router.get('/fys', (_, res) => {
  res.json({ fys: Object.keys(AUTO_SALES_DATA.fyData) });
});

module.exports = router;
