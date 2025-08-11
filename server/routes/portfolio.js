import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get user portfolios
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const portfolios = await db.all(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        COUNT(ph.id) as holdings_count,
        SUM(ph.quantity * sp.price) as total_value,
        SUM(ph.quantity * (sp.price - ph.average_price)) as total_pnl
      FROM portfolios p
      LEFT JOIN portfolio_holdings ph ON p.id = ph.portfolio_id
      LEFT JOIN stock_prices sp ON ph.stock_id = sp.stock_id
      WHERE p.user_id = ?
        AND (sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = ph.stock_id
        ) OR sp.timestamp IS NULL)
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [userId]);

    res.json({ portfolios });
  } catch (error) {
    console.error('Get portfolios error:', error);
    res.status(500).json({ error: 'Failed to get portfolios' });
  }
});

// Create new portfolio
router.post('/', [
  body('name').notEmpty().withMessage('Portfolio name is required'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    const result = await db.run(`
      INSERT INTO portfolios (user_id, name, description)
      VALUES (?, ?, ?)
    `, [userId, name, description]);

    const portfolio = await db.get(`
      SELECT id, name, description, created_at, updated_at
      FROM portfolios
      WHERE id = ?
    `, [result.lastID]);

    res.status(201).json({
      message: 'Portfolio created successfully',
      portfolio
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});

// Get portfolio details with holdings
router.get('/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const db = getDatabase();
    const userId = req.user.id;

    // Get portfolio info
    const portfolio = await db.get(`
      SELECT id, name, description, created_at, updated_at
      FROM portfolios
      WHERE id = ? AND user_id = ?
    `, [portfolioId, userId]);

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Get holdings with current prices
    const holdings = await db.all(`
      SELECT 
        ph.id,
        ph.quantity,
        ph.average_price,
        ph.purchase_date,
        s.id as stock_id,
        s.symbol,
        s.name,
        s.sector,
        sp.price as current_price,
        sp.change_percent,
        (ph.quantity * sp.price) as current_value,
        (ph.quantity * (sp.price - ph.average_price)) as pnl,
        ((sp.price - ph.average_price) / ph.average_price * 100) as pnl_percent,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM portfolio_holdings ph
      JOIN stocks s ON ph.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE ph.portfolio_id = ?
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      ORDER BY s.symbol
    `, [portfolioId]);

    // Calculate portfolio summary
    const summary = holdings.reduce((acc, holding) => {
      acc.totalInvested += holding.quantity * holding.average_price;
      acc.currentValue += holding.current_value;
      acc.totalPnl += holding.pnl;
      return acc;
    }, { totalInvested: 0, currentValue: 0, totalPnl: 0 });

    summary.totalPnlPercent = summary.totalInvested > 0 
      ? (summary.totalPnl / summary.totalInvested) * 100 
      : 0;

    res.json({
      portfolio,
      holdings,
      summary
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
});

// Add stock to portfolio
router.post('/:portfolioId/holdings', [
  body('stockSymbol').notEmpty().withMessage('Stock symbol is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('averagePrice').isFloat({ min: 0 }).withMessage('Average price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { portfolioId } = req.params;
    const { stockSymbol, quantity, averagePrice } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    // Verify portfolio ownership
    const portfolio = await db.get(`
      SELECT id FROM portfolios WHERE id = ? AND user_id = ?
    `, [portfolioId, userId]);

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Get stock ID
    const stock = await db.get('SELECT id FROM stocks WHERE symbol = ?', [stockSymbol.toUpperCase()]);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Check if holding already exists
    const existingHolding = await db.get(`
      SELECT id, quantity, average_price FROM portfolio_holdings
      WHERE portfolio_id = ? AND stock_id = ?
    `, [portfolioId, stock.id]);

    if (existingHolding) {
      // Update existing holding
      const newQuantity = existingHolding.quantity + quantity;
      const newAveragePrice = (
        (existingHolding.quantity * existingHolding.average_price + quantity * averagePrice) / newQuantity
      );

      await db.run(`
        UPDATE portfolio_holdings
        SET quantity = ?, average_price = ?
        WHERE id = ?
      `, [newQuantity, newAveragePrice, existingHolding.id]);

      res.json({
        message: 'Holding updated successfully',
        holding: { quantity: newQuantity, averagePrice: newAveragePrice }
      });
    } else {
      // Create new holding
      await db.run(`
        INSERT INTO portfolio_holdings (portfolio_id, stock_id, quantity, average_price)
        VALUES (?, ?, ?, ?)
      `, [portfolioId, stock.id, quantity, averagePrice]);

      res.status(201).json({
        message: 'Holding added successfully'
      });
    }
  } catch (error) {
    console.error('Add holding error:', error);
    res.status(500).json({ error: 'Failed to add holding' });
  }
});

// Update holding
router.put('/:portfolioId/holdings/:holdingId', [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('averagePrice').isFloat({ min: 0 }).withMessage('Average price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { portfolioId, holdingId } = req.params;
    const { quantity, averagePrice } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    // Verify portfolio ownership
    const portfolio = await db.get(`
      SELECT id FROM portfolios WHERE id = ? AND user_id = ?
    `, [portfolioId, userId]);

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    if (quantity === 0) {
      // Remove holding
      await db.run(`
        DELETE FROM portfolio_holdings WHERE id = ? AND portfolio_id = ?
      `, [holdingId, portfolioId]);

      res.json({ message: 'Holding removed successfully' });
    } else {
      // Update holding
      await db.run(`
        UPDATE portfolio_holdings
        SET quantity = ?, average_price = ?
        WHERE id = ? AND portfolio_id = ?
      `, [quantity, averagePrice, holdingId, portfolioId]);

      res.json({ message: 'Holding updated successfully' });
    }
  } catch (error) {
    console.error('Update holding error:', error);
    res.status(500).json({ error: 'Failed to update holding' });
  }
});

// Get user watchlist
router.get('/watchlist', async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;

    const watchlist = await db.all(`
      SELECT 
        w.id,
        s.symbol,
        s.name,
        s.sector,
        sp.price,
        sp.change_amount,
        sp.change_percent,
        sp.volume,
        s.market_cap,
        w.created_at,
        CASE 
          WHEN sp.change_percent > 0 THEN 'up'
          WHEN sp.change_percent < 0 THEN 'down'
          ELSE 'neutral'
        END as trend
      FROM watchlist w
      JOIN stocks s ON w.stock_id = s.id
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE w.user_id = ?
        AND sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
      ORDER BY w.created_at DESC
    `, [userId]);

    res.json({ watchlist });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
});

// Add stock to watchlist
router.post('/watchlist', [
  body('stockSymbol').notEmpty().withMessage('Stock symbol is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { stockSymbol } = req.body;
    const db = getDatabase();
    const userId = req.user.id;

    // Get stock ID
    const stock = await db.get('SELECT id FROM stocks WHERE symbol = ?', [stockSymbol.toUpperCase()]);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Add to watchlist (ignore if already exists due to UNIQUE constraint)
    try {
      await db.run(`
        INSERT INTO watchlist (user_id, stock_id)
        VALUES (?, ?)
      `, [userId, stock.id]);

      res.status(201).json({ message: 'Stock added to watchlist' });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: 'Stock already in watchlist' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// Remove stock from watchlist
router.delete('/watchlist/:stockSymbol', async (req, res) => {
  try {
    const { stockSymbol } = req.params;
    const db = getDatabase();
    const userId = req.user.id;

    // Get stock ID
    const stock = await db.get('SELECT id FROM stocks WHERE symbol = ?', [stockSymbol.toUpperCase()]);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Remove from watchlist
    const result = await db.run(`
      DELETE FROM watchlist
      WHERE user_id = ? AND stock_id = ?
    `, [userId, stock.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stock not in watchlist' });
    }

    res.json({ message: 'Stock removed from watchlist' });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

export default router;
