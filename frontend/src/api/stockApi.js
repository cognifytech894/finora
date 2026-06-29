import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export const searchStocks = (q) =>
  api.get('/stock/search', { params: { q } }).then(r => r.data?.results || r.data || []);

export const analyzeStock = (symbol, interval, range) =>
  api.get('/stock/analyze', { params: { symbol, interval, range } }).then(r => r.data);

export const quoteStock = (symbol) =>
  api.get('/stock/quote', { params: { symbol } }).then(r => r.data);

export const scanDMA200 = () =>
  api.get('/stock/scanner/dma200').then(r => r.data);

export const scanATHHigh = () =>
  api.get('/stock/scanner/athhigh').then(r => r.data);

export const fetchAutoSales = (fy, segment = 'all') =>
  api.get('/autosales', { params: { fy, segment } }).then(r => r.data);
