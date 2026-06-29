# Share Mint - React + Node.js Stock Analyzer

NSE stock analysis app with candlestick charts, RSI, MACD, and BUY/SELL/HOLD signals.

## Project Structure

```
sharemint/
├── backend/                 # Node.js Express API
│   ├── server.js            # Entry point
│   ├── routes/
│   │   └── stock.js         # /api/stock/* endpoints
│   ├── services/
│   │   ├── yahooFinance.js  # Data fetching (with fallback proxies)
│   │   └── indicators.js    # RSI, MACD, SMA, EMA, Bollinger Bands
│   └── package.json
│
└── frontend/                # React app
    ├── src/
    │   ├── App.jsx           # Main layout
    │   ├── App.css           # Full styling
    │   ├── api/
    │   │   └── stockApi.js   # Axios API client
    │   ├── hooks/
    │   │   └── useStock.js   # Custom React hooks
    │   ├── components/
    │   │   ├── SearchBar.jsx        # Stock search with dropdown
    │   │   ├── CandlestickChart.jsx # TradingView lightweight-charts
    │   │   ├── RSIChart.jsx         # RSI indicator chart
    │   │   ├── MACDChart.jsx        # MACD + histogram chart
    │   │   ├── SignalCard.jsx       # BUY/SELL/HOLD signal card
    │   │   └── PriceHeader.jsx      # Stock name + price display
    │   └── utils/
    │       └── format.js            # Number formatting helpers
    └── package.json
```

## Setup & Run

### 1. Backend
```bash
cd backend
npm install
npm run dev        # starts on http://localhost:5000
# OR
npm start
```

### 2. Frontend (new terminal)
```bash
cd frontend
npm install
npm start          # starts on http://localhost:3000
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/stock/search?q=RELIANCE` | Search NSE stocks |
| `GET /api/stock/analyze?symbol=RELIANCE&interval=1d&range=6mo` | Full analysis |
| `GET /api/stock/quote?symbol=RELIANCE` | Quick price quote |

### Intervals: `15m`, `60m`, `1d`, `1wk`, `1mo`
### Ranges: `1mo`, `3mo`, `6mo`, `1y`, `2y`

## Features

- **Candlestick chart** with SMA 20/50 and EMA 20 overlays
- **RSI (14)** with overbought/oversold zones
- **MACD (12,26,9)** with signal line and histogram
- **BUY/SELL/HOLD** signal based on multi-indicator scoring
- **Search** any NSE stock with live suggestions
- Multiple timeframes and ranges

## Data Source

Yahoo Finance (free, no API key required). Uses automatic proxy fallback if direct requests are blocked.

## Disclaimer

Educational purpose only. Not financial advice. Consult a SEBI-registered advisor before investing.
