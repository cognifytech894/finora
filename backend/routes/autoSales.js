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
    'FY2026-27': [
      [178900,184700,171500,190600,180200,174900,199300,164300,179100,185500,167500,194000],
      [51902, 47837, 50100, 54500, 51200, 48600, 57200, 45800, 49700, 53500, 46800, 59200],
      [77800, 82100, 74100, 90800, 84600, 80400, 94800, 72100, 78300, 86500, 76200, 90600],
      [69400, 71200, 61500, 76300, 72600, 67800, 80100, 59100, 66400, 73800, 64000, 78700],
      [579000,548600,516500,600700,568900,537200,622900,506100,548900,590900,527500,612300],
      [371000,360400,339200,381600,371000,349800,392200,328600,360400,376300,344500,386900],
      [337900,321600,305200,348800,332500,316100,365200,299800,321600,343400,310700,359700],
      [19400, 20500, 18300, 22700, 21600, 19400, 23800, 17300, 19400, 21600, 18300, 22700],
    ],
    'FY2025-26': [
      [172000,179200,166900,185400,175100,169900,193600,159700,174100,180200,162700,188500],
      [49600, 52600, 47800, 55600, 51700, 48800, 57400, 45900, 49700, 53600, 46900, 59400],
      [76400, 81700, 73500, 89900, 83700, 79600, 93900, 71400, 77500, 85700, 75500, 89800],
      [59400, 66200, 57000, 70700, 67300, 62700, 74100, 54700, 61600, 68400, 59300, 73000],
      [566500,535600,504700,587100,556200,525300,607700,494400,535600,576800,515000,597400],
      [360500,350200,329600,370800,360500,339900,381100,319300,350200,365700,334800,376000],
      [325500,309800,294000,336000,320300,304500,351800,288800,309800,330800,299300,346500],
      [18700, 19800, 17700, 21800, 20800, 18700, 22900, 16600, 18700, 20800, 17700, 21800],
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

const FY_MONTH_TO_INDEX = { 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6, 10: 7, 11: 8, 0: 9, 1: 10, 2: 11 };
const SORTED_FYS = Object.keys(AUTO_SALES_DATA.fyData).sort().reverse();
const LATEST_STATIC_FY = SORTED_FYS[0];

function getCurrentFy(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `FY${startYear}-${String(startYear + 1).slice(-2)}`;
}

function getFyStartYear(fy) {
  return Number(String(fy).slice(2, 6));
}

function projectFyData(fy) {
  const baseData = AUTO_SALES_DATA.fyData[LATEST_STATIC_FY];
  const yearGap = Math.max(0, getFyStartYear(fy) - getFyStartYear(LATEST_STATIC_FY));
  const growthFactor = Math.pow(1.04, yearGap);

  return baseData.map(companyMonths =>
    companyMonths.map(units => Math.round(units * growthFactor))
  );
}

function getFyData(fy) {
  return AUTO_SALES_DATA.fyData[fy] || projectFyData(fy);
}

function buildFyOptions(now = new Date(), count = 5) {
  const currentStart = getFyStartYear(getCurrentFy(now));
  return Array.from({ length: count }, (_, i) => {
    const startYear = currentStart - i;
    return `FY${startYear}-${String(startYear + 1).slice(-2)}`;
  });
}

function getLatestMonthIndex(fy, now = new Date()) {
  const currentFy = getCurrentFy(now);
  if (fy === currentFy) return FY_MONTH_TO_INDEX[now.getMonth()] ?? 11;

  const startYear = getFyStartYear(fy);
  const currentStartYear = getFyStartYear(currentFy);
  return startYear < currentStartYear ? 11 : 0;
}

// GET /api/autosales?fy=FY2026-27&segment=all
router.get('/', (req, res) => {
  const { fy = getCurrentFy(), segment = 'all' } = req.query;
  const fyData = getFyData(fy);

  const { companies, months } = AUTO_SALES_DATA;
  const latestMonthIndex = getLatestMonthIndex(fy);
  const isProjectedFy = !AUTO_SALES_DATA.fyData[fy];

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
    latestMonth:      d.monthly[latestMonthIndex],
    latestMonthShare: parseFloat(((d.monthly[latestMonthIndex] / monthTotals[latestMonthIndex]) * 100).toFixed(1)),
    momChange:        latestMonthIndex > 0
      ? parseFloat((((d.monthly[latestMonthIndex] - d.monthly[latestMonthIndex - 1]) / d.monthly[latestMonthIndex - 1]) * 100).toFixed(1))
      : 0,
  }));

  res.json({
    fy,
    segment,
    months,
    latestMonthIndex,
    latestMonthLabel: months[latestMonthIndex],
    dataStatus: isProjectedFy
      ? `${fy} uses projected monthly values until official company/SIAM figures are updated.`
      : fy === getCurrentFy()
        ? `${fy} includes April, May, June and forward projections for upcoming months where official figures are pending.`
        : 'historical',
    isProjectedFy,
    companies: result,
    monthTotals,
    grandTotal,
    generatedAt: new Date().toISOString(),
  });
});

// GET /api/autosales/fys — list available financial years
router.get('/fys', (_, res) => {
  res.json({ fys: buildFyOptions() });
});

module.exports = router;
