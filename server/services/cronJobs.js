import cron from 'node-cron';
import { getDatabase } from '../database/init.js';

// Clean up old stock prices (keep last 30 days)
async function cleanupOldPrices() {
  try {
    const db = getDatabase();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.run(`
      DELETE FROM stock_prices 
      WHERE timestamp < ?
    `, [thirtyDaysAgo.toISOString()]);

    console.log(`Cleaned up ${result.changes} old price records`);
  } catch (error) {
    console.error('Error cleaning up old prices:', error);
  }
}

// Generate new stock recommendations
async function generateRecommendations() {
  try {
    const db = getDatabase();
    
    // Get stocks that don't have recent recommendations
    const stocks = await db.all(`
      SELECT s.id, s.symbol, s.name, sp.price, sp.change_percent
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      LEFT JOIN stock_recommendations sr ON s.id = sr.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
      AND (sr.created_at IS NULL OR sr.created_at < datetime('now', '-7 days'))
      LIMIT 10
    `);

    for (const stock of stocks) {
      // Simple recommendation algorithm (in reality, this would be much more sophisticated)
      const recommendation = generateStockRecommendation(stock);
      
      if (recommendation) {
        await db.run(`
          INSERT INTO stock_recommendations 
          (stock_id, action, target_price, confidence_percent, timeframe, reasoning)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          stock.id,
          recommendation.action,
          recommendation.targetPrice,
          recommendation.confidence,
          recommendation.timeframe,
          recommendation.reasoning
        ]);
      }
    }

    console.log(`Generated ${stocks.length} new recommendations`);
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}

function generateStockRecommendation(stock) {
  const changePercent = stock.change_percent || 0;
  const price = stock.price || 1000;
  
  // Simple algorithm based on price movement and volatility
  let action, confidence, targetPrice, timeframe, reasoning;
  
  if (changePercent > 5) {
    // Strong upward movement - consider HOLD or SELL
    if (changePercent > 15) {
      action = 'SELL';
      confidence = 75;
      targetPrice = price * 0.9;
      timeframe = '1M';
      reasoning = 'Strong upward movement suggests potential overvaluation';
    } else {
      action = 'HOLD';
      confidence = 65;
      targetPrice = price * 1.05;
      timeframe = '3M';
      reasoning = 'Good momentum, maintain position';
    }
  } else if (changePercent < -5) {
    // Strong downward movement - consider BUY
    action = 'BUY';
    confidence = 70;
    targetPrice = price * 1.15;
    timeframe = '6M';
    reasoning = 'Oversold condition, potential recovery';
  } else {
    // Moderate movement - analyze further
    const random = Math.random();
    if (random > 0.6) {
      action = 'BUY';
      confidence = 60;
      targetPrice = price * 1.1;
      timeframe = '3M';
      reasoning = 'Stable fundamentals, growth potential';
    } else if (random > 0.3) {
      action = 'HOLD';
      confidence = 55;
      targetPrice = price * 1.02;
      timeframe = '1M';
      reasoning = 'Neutral outlook, monitor closely';
    } else {
      action = 'SELL';
      confidence = 50;
      targetPrice = price * 0.95;
      timeframe = '1M';
      reasoning = 'Weak momentum, consider reducing position';
    }
  }

  return {
    action,
    targetPrice: Math.round(targetPrice * 100) / 100,
    confidence,
    timeframe,
    reasoning
  };
}

// Update market statistics
async function updateMarketStats() {
  try {
    const db = getDatabase();
    
    // Calculate and store market statistics
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_stocks,
        AVG(sp.change_percent) as avg_change,
        SUM(CASE WHEN sp.change_percent > 0 THEN 1 ELSE 0 END) as gainers,
        SUM(CASE WHEN sp.change_percent < 0 THEN 1 ELSE 0 END) as losers,
        SUM(sp.volume) as total_volume
      FROM stocks s
      LEFT JOIN stock_prices sp ON s.id = sp.stock_id
      WHERE sp.timestamp = (
        SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
      )
    `);

    console.log('Market stats updated:', {
      totalStocks: stats.total_stocks,
      avgChange: stats.avg_change?.toFixed(2) + '%',
      gainers: stats.gainers,
      losers: stats.losers,
      totalVolume: stats.total_volume?.toLocaleString()
    });
  } catch (error) {
    console.error('Error updating market stats:', error);
  }
}

// Clean up expired user sessions
async function cleanupExpiredSessions() {
  try {
    const db = getDatabase();
    
    const result = await db.run(`
      DELETE FROM user_sessions 
      WHERE expires_at < CURRENT_TIMESTAMP
    `);

    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} expired sessions`);
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

// Database maintenance
async function performDatabaseMaintenance() {
  try {
    const db = getDatabase();
    
    // Optimize database
    await db.run('VACUUM');
    await db.run('ANALYZE');
    
    console.log('Database maintenance completed');
  } catch (error) {
    console.error('Error performing database maintenance:', error);
  }
}

// Start all cron jobs
export function startCronJobs() {
  console.log('Starting cron jobs...');

  // Clean up old prices every day at 2 AM
  cron.schedule('0 2 * * *', cleanupOldPrices, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Generate recommendations every day at 6 AM
  cron.schedule('0 6 * * *', generateRecommendations, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Update market stats every hour during market hours
  cron.schedule('0 9-16 * * 1-5', updateMarketStats, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Clean up expired sessions every 6 hours
  cron.schedule('0 */6 * * *', cleanupExpiredSessions, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Database maintenance every Sunday at 3 AM
  cron.schedule('0 3 * * 0', performDatabaseMaintenance, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('Cron jobs scheduled successfully');
}

// Stop all cron jobs
export function stopCronJobs() {
  cron.getTasks().forEach(task => task.stop());
  console.log('All cron jobs stopped');
}
