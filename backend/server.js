const express = require('express');
const cors = require('cors');
const stockRoutes     = require('./routes/stock');
const autoSalesRoutes = require('./routes/autoSales');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stock',     stockRoutes);
app.use('/api/autosales', autoSalesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StockSense API running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
