import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all stocks with latest prices
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, sort = 'symbol', order = 'ASC' } = req.query;
    const db = getDatabase();

    const stocks = await db.all(`
      SELECT 
        s.id,
        s.symbol,
        s.name,
        s.sector,
        s.industry,
        s.market_cap,
        s.pe_ratio,
        s.dividend_yield,
        sp.price,
        sp.change_amount,
        sp.change_percent,
        sp.volume,
        sp.high,
        sp.low,
        sp.open_price,
        sp.close_price,
        sp.timestamp,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    // Get total count
    const totalCount = await db.get('SELECT COUNT(*) as count FROM stocks');

    res.json({
      stocks,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount.count
      }
    });
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({ error: 'Failed to get stocks' });
  }
});

// Search stocks
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const db = getDatabase();

    if (!q || q.length < 2) {
      return res.json({ stocks: [] });
    }

    const stocks = await db.all(`
      SELECT 
        s.id,
        s.symbol,
        s.name,
        s.sector,
        s.industry,
        sp.price,
        sp.change_percent,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE (s.symbol LIKE ? OR s.name LIKE ? OR s.sector LIKE ?)
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      ORDER BY 
        CASE 
          WHEN s.symbol LIKE ? THEN 1
          WHEN s.name LIKE ? THEN 2
          ELSE 3
        END,
        s.symbol
      LIMIT ?
    `, [`%${q}%`, `%${q}%`, `%${q}%`, `${q}%`, `${q}%`, parseInt(limit)]);

    res.json({ stocks });
  } catch (error) {
    console.error('Search stocks error:', error);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Get stock by symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const db = getDatabase();

    const stock = await db.get(`
      SELECT 
        s.id,
        s.symbol,
        s.name,
        s.sector,
        s.industry,
        s.market_cap,
        s.pe_ratio,
        s.dividend_yield,
        sp.price,
        sp.change_amount,
        sp.change_percent,
        sp.volume,
        sp.high,
        sp.low,
        sp.open_price,
        sp.close_price,
        sp.timestamp,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE s.symbol = ?
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
    `, [symbol.toUpperCase()]);

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Get historical prices (last 30 days)
    const historicalPrices = await db.all(`
      SELECT 
        price,
        change_amount,
        change_percent,
        volume,
        high,
        low,
        open_price,
        close_price,
        timestamp
      FROM stock_prices
      WHERE stock_id = ?
      ORDER BY timestamp DESC
      LIMIT 30
    `, [stock.id]);

    // Get recommendations
    const recommendations = await db.all(`
      SELECT 
        action,
        target_price,
        confidence_percent,
        timeframe,
        reasoning,
        created_at
      FROM stock_recommendations
      WHERE stock_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [stock.id]);

    res.json({
      stock,
      historicalPrices,
      recommendations
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ error: 'Failed to get stock' });
  }
});

// Get stock price history
router.get('/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '30d' } = req.query;
    const db = getDatabase();

    // Get stock ID
    const stock = await db.get('SELECT id FROM stocks WHERE symbol = ?', [symbol.toUpperCase()]);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    let limit;
    switch (period) {
      case '7d':
        limit = 7;
        break;
      case '30d':
        limit = 30;
        break;
      case '90d':
        limit = 90;
        break;
      case '1y':
        limit = 365;
        break;
      default:
        limit = 30;
    }

    const history = await db.all(`
      SELECT 
        price,
        change_amount,
        change_percent,
        volume,
        high,
        low,
        open_price,
        close_price,
        timestamp
      FROM stock_prices
      WHERE stock_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `, [stock.id, limit]);

    res.json({ history: history.reverse() });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ error: 'Failed to get stock history' });
  }
});

// Get top gainers
router.get('/top/gainers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = getDatabase();

    const gainers = await db.all(`
      SELECT 
        s.symbol,
        s.name,
        s.sector,
        sp.price,
        sp.change_amount,
        sp.change_percent,
        sp.volume,
        s.market_cap
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.change_percent > 0
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      ORDER BY sp.change_percent DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({ gainers });
  } catch (error) {
    console.error('Get top gainers error:', error);
    res.status(500).json({ error: 'Failed to get top gainers' });
  }
});

// Get top losers
router.get('/top/losers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = getDatabase();

    const losers = await db.all(`
      SELECT 
        s.symbol,
        s.name,
        s.sector,
        sp.price,
        sp.change_amount,
        sp.change_percent,
        sp.volume,
        s.market_cap
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.change_percent < 0
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      ORDER BY sp.change_percent ASC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({ losers });
  } catch (error) {
    console.error('Get top losers error:', error);
    res.status(500).json({ error: 'Failed to get top losers' });
  }
});

// Get most active stocks
router.get('/most-active', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = getDatabase();

    const mostActive = await db.all(`
      SELECT 
        s.symbol,
        s.name,
        s.sector,
        sp.price,
        sp.change_amount,
        sp.change_percent,
        sp.volume,
        s.market_cap
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
      ORDER BY sp.volume DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({ mostActive });
  } catch (error) {
    console.error('Get most active stocks error:', error);
    res.status(500).json({ error: 'Failed to get most active stocks' });
  }
});

export default router;
