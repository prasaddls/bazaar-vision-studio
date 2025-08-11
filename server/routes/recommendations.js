import express from 'express';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all recommendations
router.get('/', async (req, res) => {
  try {
    const { limit = 20, action } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        r.id,
        r.action,
        r.target_price,
        r.confidence_percent,
        r.timeframe,
        r.reasoning,
        r.created_at,
        s.symbol,
        s.name,
        s.sector,
        sp.price as current_price,
        sp.change_percent,
        ((r.target_price - sp.price) / sp.price * 100) as potential_return,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM stock_recommendations r
      JOIN stocks s ON r.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
    `;

    const params = [];

    if (action && ['BUY', 'SELL', 'HOLD'].includes(action.toUpperCase())) {
      query += ' AND r.action = ?';
      params.push(action.toUpperCase());
    }

    query += ' ORDER BY r.confidence_percent DESC, r.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const recommendations = await db.all(query, params);

    res.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get recommendations by action type
router.get('/action/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const { limit = 10 } = req.query;
    const db = getDatabase();

    if (!['BUY', 'SELL', 'HOLD'].includes(action.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    const recommendations = await db.all(`
      SELECT 
        r.id,
        r.action,
        r.target_price,
        r.confidence_percent,
        r.timeframe,
        r.reasoning,
        r.created_at,
        s.symbol,
        s.name,
        s.sector,
        sp.price as current_price,
        sp.change_percent,
        ((r.target_price - sp.price) / sp.price * 100) as potential_return,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM stock_recommendations r
      JOIN stocks s ON r.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE r.action = ?
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      ORDER BY r.confidence_percent DESC, r.created_at DESC
      LIMIT ?
    `, [action.toUpperCase(), parseInt(limit)]);

    res.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations by action error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get recommendations by sector
router.get('/sector/:sector', async (req, res) => {
  try {
    const { sector } = req.params;
    const { limit = 10 } = req.query;
    const db = getDatabase();

    const recommendations = await db.all(`
      SELECT 
        r.id,
        r.action,
        r.target_price,
        r.confidence_percent,
        r.timeframe,
        r.reasoning,
        r.created_at,
        s.symbol,
        s.name,
        s.sector,
        sp.price as current_price,
        sp.change_percent,
        ((r.target_price - sp.price) / sp.price * 100) as potential_return,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM stock_recommendations r
      JOIN stocks s ON r.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE s.sector LIKE ?
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      ORDER BY r.confidence_percent DESC, r.created_at DESC
      LIMIT ?
    `, [`%${sector}%`, parseInt(limit)]);

    res.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations by sector error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get high confidence recommendations
router.get('/high-confidence', async (req, res) => {
  try {
    const { limit = 10, minConfidence = 80 } = req.query;
    const db = getDatabase();

    const recommendations = await db.all(`
      SELECT 
        r.id,
        r.action,
        r.target_price,
        r.confidence_percent,
        r.timeframe,
        r.reasoning,
        r.created_at,
        s.symbol,
        s.name,
        s.sector,
        sp.price as current_price,
        sp.change_percent,
        ((r.target_price - sp.price) / sp.price * 100) as potential_return,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM stock_recommendations r
      JOIN stocks s ON r.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE r.confidence_percent >= ?
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      ORDER BY r.confidence_percent DESC, r.created_at DESC
      LIMIT ?
    `, [parseInt(minConfidence), parseInt(limit)]);

    res.json({ recommendations });
  } catch (error) {
    console.error('Get high confidence recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get recommendations summary
router.get('/summary', async (req, res) => {
  try {
    const db = getDatabase();

    // Get recommendations by action
    const byAction = await db.all(`
      SELECT 
        r.action,
        COUNT(*) as count,
        AVG(r.confidence_percent) as avg_confidence,
        AVG(((r.target_price - sp.price) / sp.price * 100)) as avg_potential_return
      FROM stock_recommendations r
      JOIN stocks s ON r.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
      GROUP BY r.action
    `);

    // Get recommendations by sector
    const bySector = await db.all(`
      SELECT 
        s.sector,
        COUNT(*) as count,
        AVG(r.confidence_percent) as avg_confidence,
        AVG(((r.target_price - sp.price) / sp.price * 100)) as avg_potential_return
      FROM stock_recommendations r
      JOIN stocks s ON r.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE s.sector IS NOT NULL
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      GROUP BY s.sector
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get confidence distribution
    const confidenceDistribution = await db.all(`
      SELECT 
        CASE 
          WHEN r.confidence_percent >= 90 THEN '90-100%'
          WHEN r.confidence_percent >= 80 THEN '80-89%'
          WHEN r.confidence_percent >= 70 THEN '70-79%'
          WHEN r.confidence_percent >= 60 THEN '60-69%'
          ELSE 'Below 60%'
        END as confidence_range,
        COUNT(*) as count
      FROM stock_recommendations r
      GROUP BY confidence_range
      ORDER BY confidence_range DESC
    `);

    res.json({
      byAction,
      bySector,
      confidenceDistribution
    });
  } catch (error) {
    console.error('Get recommendations summary error:', error);
    res.status(500).json({ error: 'Failed to get recommendations summary' });
  }
});

// Get personalized recommendations (for authenticated users)
router.get('/personalized', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's portfolio holdings to generate personalized recommendations
    const userHoldings = await db.all(`
      SELECT DISTINCT s.sector
      FROM portfolio_holdings ph
      JOIN portfolios p ON ph.portfolio_id = p.id
      JOIN stocks s ON ph.stock_id = s.id
      WHERE p.user_id = ?
    `, [userId]);

    const userSectors = userHoldings.map(h => h.sector);

    let query = `
      SELECT 
        r.id,
        r.action,
        r.target_price,
        r.confidence_percent,
        r.timeframe,
        r.reasoning,
        r.created_at,
        s.symbol,
        s.name,
        s.sector,
        sp.price as current_price,
        sp.change_percent,
        ((r.target_price - sp.price) / sp.price * 100) as potential_return,
        CASE 
          WHEN s.sector IN (${userSectors.map(() => '?').join(',')}) THEN 'portfolio_sector'
          ELSE 'diversification'
        END as recommendation_type,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM stock_recommendations r
      JOIN stocks s ON r.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
      ORDER BY r.confidence_percent DESC, r.created_at DESC
      LIMIT 10
    `;

    const recommendations = await db.all(query, userSectors);

    res.json({ recommendations });
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    res.status(500).json({ error: 'Failed to get personalized recommendations' });
  }
});

export default router;
