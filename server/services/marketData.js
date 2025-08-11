import { getDatabase } from '../database/init.js';

// Simulated market data generator
class MarketDataService {
  constructor() {
    this.db = null;
    this.updateInterval = null;
  }

  async initialize() {
    this.db = getDatabase();
    await this.generateInitialPrices();
    console.log('Market data service initialized');
  }

  async generateInitialPrices() {
    try {
      // Get all stocks
      const stocks = await this.db.all('SELECT id, symbol FROM stocks');
      
      for (const stock of stocks) {
        // Generate realistic initial prices based on stock symbol
        const basePrice = this.generateBasePrice(stock.symbol);
        const price = basePrice + (Math.random() - 0.5) * basePrice * 0.1; // ±5% variation
        const changeAmount = (Math.random() - 0.5) * price * 0.05; // ±2.5% change
        const changePercent = (changeAmount / price) * 100;
        const volume = Math.floor(Math.random() * 10000000) + 100000; // 100k to 10M
        const high = price + Math.random() * price * 0.02;
        const low = price - Math.random() * price * 0.02;
        const openPrice = price - changeAmount;

        await this.db.run(`
          INSERT OR REPLACE INTO stock_prices 
          (stock_id, price, change_amount, change_percent, volume, high, low, open_price, close_price, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [stock.id, price, changeAmount, changePercent, volume, high, low, openPrice, price]);
      }

      console.log('Initial stock prices generated');
    } catch (error) {
      console.error('Error generating initial prices:', error);
    }
  }

  generateBasePrice(symbol) {
    // Generate realistic base prices for different stocks
    const priceMap = {
      'RELIANCE': 2845,
      'TCS': 3567,
      'INFY': 1789,
      'HDFC': 1645,
      'ICICIBANK': 1200,
      'ITC': 450,
      'SBIN': 650,
      'BHARTIARTL': 1200,
      'AXISBANK': 1100,
      'ASIANPAINT': 3200
    };

    return priceMap[symbol] || 1000 + Math.random() * 2000;
  }

  async updatePrices() {
    try {
      const stocks = await this.db.all('SELECT id, symbol FROM stocks');
      
      for (const stock of stocks) {
        // Get current price
        const currentPrice = await this.db.get(`
          SELECT price FROM stock_prices 
          WHERE stock_id = ? 
          ORDER BY timestamp DESC LIMIT 1
        `, [stock.id]);

        if (currentPrice) {
          // Generate new price with realistic movement
          const volatility = 0.02; // 2% daily volatility
          const drift = 0.0001; // Slight upward drift
          const randomChange = (Math.random() - 0.5) * volatility;
          const newPrice = currentPrice.price * (1 + drift + randomChange);
          
          // Ensure price doesn't go negative
          const finalPrice = Math.max(newPrice, 1);
          const changeAmount = finalPrice - currentPrice.price;
          const changePercent = (changeAmount / currentPrice.price) * 100;
          
          // Generate volume with some correlation to price movement
          const baseVolume = 1000000;
          const volumeMultiplier = 1 + Math.abs(changePercent) / 10;
          const volume = Math.floor(baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4));
          
          const high = Math.max(finalPrice, currentPrice.price);
          const low = Math.min(finalPrice, currentPrice.price);
          const openPrice = currentPrice.price;

          await this.db.run(`
            INSERT INTO stock_prices 
            (stock_id, price, change_amount, change_percent, volume, high, low, open_price, close_price, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [stock.id, finalPrice, changeAmount, changePercent, volume, high, low, openPrice, finalPrice]);
        }
      }

      // Update market indices
      await this.updateMarketIndices();
      
      console.log('Stock prices updated at', new Date().toISOString());
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  }

  async updateMarketIndices() {
    try {
      // Calculate NIFTY 50 (simplified - in reality this would be weighted)
      const niftyStocks = await this.db.all(`
        SELECT sp.price, sp.change_percent
        FROM stocks s
        JOIN stock_prices sp ON s.id = sp.stock_id
        WHERE sp.timestamp = (
          SELECT MAX(timestamp) FROM stock_prices WHERE stock_id = s.id
        )
        LIMIT 50
      `);

      if (niftyStocks.length > 0) {
        const avgPrice = niftyStocks.reduce((sum, stock) => sum + stock.price, 0) / niftyStocks.length;
        const avgChange = niftyStocks.reduce((sum, stock) => sum + stock.change_percent, 0) / niftyStocks.length;
        const changeAmount = avgPrice * (avgChange / 100);

        await this.db.run(`
          UPDATE market_indices 
          SET value = ?, change_amount = ?, change_percent = ?, updated_at = CURRENT_TIMESTAMP
          WHERE symbol = 'NIFTY50'
        `, [avgPrice * 100, changeAmount * 100, avgChange]);
      }

      // Update other indices with simulated values
      const indices = [
        { symbol: 'SENSEX', baseValue: 72836, volatility: 0.015 },
        { symbol: 'BANKNIFTY', baseValue: 48789, volatility: 0.02 },
        { symbol: 'USDINR', baseValue: 83.42, volatility: 0.005 }
      ];

      for (const index of indices) {
        const change = (Math.random() - 0.5) * index.volatility;
        const newValue = index.baseValue * (1 + change);
        const changeAmount = index.baseValue * change;
        const changePercent = change * 100;

        await this.db.run(`
          UPDATE market_indices 
          SET value = ?, change_amount = ?, change_percent = ?, updated_at = CURRENT_TIMESTAMP
          WHERE symbol = ?
        `, [newValue, changeAmount, changePercent, index.symbol]);
      }
    } catch (error) {
      console.error('Error updating market indices:', error);
    }
  }

  startRealTimeUpdates() {
    // Update prices every 30 seconds during market hours
    this.updateInterval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Market hours: Monday-Friday, 9:15 AM to 3:30 PM IST
      if (day >= 1 && day <= 5 && hour >= 9 && hour < 16) {
        this.updatePrices();
      }
    }, 30000); // 30 seconds

    console.log('Real-time price updates started');
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('Real-time price updates stopped');
    }
  }
}

// Create singleton instance
const marketDataService = new MarketDataService();

export async function initializeMarketData() {
  await marketDataService.initialize();
  marketDataService.startRealTimeUpdates();
}

export function stopMarketData() {
  marketDataService.stopRealTimeUpdates();
}

export default marketDataService;
