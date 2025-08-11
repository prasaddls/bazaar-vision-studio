import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get market overview
router.get('/overview', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get market indices
    const indices = await db.all(`
      SELECT name, symbol, value, change_amount, change_percent, updated_at
      FROM market_indices
      ORDER BY name
    `);

    // Get top gainers and losers
    const topStocks = await db.all(`
      SELECT 
        s.symbol,
        s.name,
        sp.price,
        sp.change_amount,
        sp.change_percent,
        sp.volume,
        s.market_cap,
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
      ORDER BY ABS(sp.change_percent) DESC
      LIMIT 10
    `);

    // Get market statistics
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_stocks,
        SUM(CASE WHEN sp.change_percent > 0 THEN 1 ELSE 0 END) as gainers,
        SUM(CASE WHEN sp.change_percent < 0 THEN 1 ELSE 0 END) as losers,
        SUM(CASE WHEN sp.change_percent = 0 THEN 1 ELSE 0 END) as unchanged,
        SUM(sp.volume) as total_volume
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
    `);

    res.json({
      indices,
      topStocks,
      stats: {
        totalStocks: stats.total_stocks || 0,
        gainers: stats.gainers || 0,
        losers: stats.losers || 0,
        unchanged: stats.unchanged || 0,
        totalVolume: stats.total_volume || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market overview error:', error);
    res.status(500).json({ error: 'Failed to get market overview' });
  }
});

// Get market indices
router.get('/indices', async (req, res) => {
  try {
    const db = getDatabase();
    
    const indices = await db.all(`
      SELECT name, symbol, value, change_amount, change_percent, updated_at
      FROM market_indices
      ORDER BY name
    `);

    res.json({ indices });
  } catch (error) {
    console.error('Market indices error:', error);
    res.status(500).json({ error: 'Failed to get market indices' });
  }
});

// Get sector performance
router.get('/sectors', async (req, res) => {
  try {
    const db = getDatabase();
    
    const sectors = await db.all(`
      SELECT 
        s.sector,
        COUNT(*) as stock_count,
        AVG(sp.change_percent) as avg_change,
        SUM(sp.volume) as total_volume,
        AVG(s.market_cap) as avg_market_cap
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE s.sector IS NOT NULL 
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      GROUP BY s.sector
      ORDER BY avg_change DESC
    `);

    res.json({ sectors });
  } catch (error) {
    console.error('Sector performance error:', error);
    res.status(500).json({ error: 'Failed to get sector performance' });
  }
});

// Get market heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const db = getDatabase();
    
    const heatmapData = await db.all(`
      SELECT 
        s.symbol,
        s.name,
        s.sector,
        sp.price,
        sp.change_percent,
        sp.volume,
        s.market_cap,
        CASE 
          WHEN sp.change_percent > 5 THEN 'strong-buy'
          WHEN sp.change_percent > 2 THEN 'buy'
          WHEN sp.change_percent > 0 THEN 'hold'
          WHEN sp.change_percent > -2 THEN 'sell'
          ELSE 'strong-sell'
        END as sentiment
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
      ORDER BY sp.change_percent DESC
    `);

    res.json({ heatmapData });
  } catch (error) {
    console.error('Market heatmap error:', error);
    res.status(500).json({ error: 'Failed to get market heatmap' });
  }
});

// Get market news and updates
router.get('/news', async (req, res) => {
  try {
    // Mock news data - in a real app, this would come from a news API
    const news = [
      {
        id: 1,
        title: "NIFTY 50 hits new all-time high",
        summary: "The benchmark index crossed 22,000 points for the first time",
        source: "Economic Times",
        publishedAt: new Date().toISOString(),
        sentiment: "positive"
      },
      {
        id: 2,
        title: "RBI keeps repo rate unchanged",
        summary: "Central bank maintains status quo on interest rates",
        source: "Business Standard",
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        sentiment: "neutral"
      },
      {
        id: 3,
        title: "IT sector shows strong Q3 results",
        summary: "Major IT companies report better-than-expected earnings",
        source: "Money Control",
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        sentiment: "positive"
      }
    ];

    res.json({ news });
  } catch (error) {
    console.error('Market news error:', error);
    res.status(500).json({ error: 'Failed to get market news' });
  }
});

// Get market calendar
router.get('/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    // Mock calendar data - in a real app, this would come from a financial calendar API
    const calendar = [
      {
        id: 1,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`,
        event: "RBI Monetary Policy Committee Meeting",
        type: "policy",
        impact: "high"
      },
      {
        id: 2,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-20`,
        event: "Reliance Industries Q3 Results",
        type: "earnings",
        impact: "high"
      },
      {
        id: 3,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-25`,
        event: "TCS Board Meeting",
        type: "corporate",
        impact: "medium"
      }
    ];

    res.json({ calendar });
  } catch (error) {
    console.error('Market calendar error:', error);
    res.status(500).json({ error: 'Failed to get market calendar' });
  }
});

export default router;
