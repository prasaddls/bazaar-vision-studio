import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initDatabase() {
  try {
    // Open database connection
    db = await open({
      filename: path.join(__dirname, '../../data/bazaar_lens.db'),
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    // Create tables
    await createTables();
    
    // Insert initial data
    await insertInitialData();

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  // Stocks table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      sector VARCHAR(50),
      industry VARCHAR(50),
      market_cap DECIMAL(20,2),
      pe_ratio DECIMAL(10,2),
      dividend_yield DECIMAL(5,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stock prices table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stock_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_id INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      change_amount DECIMAL(10,2),
      change_percent DECIMAL(5,2),
      volume BIGINT,
      high DECIMAL(10,2),
      low DECIMAL(10,2),
      open_price DECIMAL(10,2),
      close_price DECIMAL(10,2),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stock_id) REFERENCES stocks(id)
    )
  `);

  // Portfolios table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Portfolio holdings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portfolio_id INTEGER NOT NULL,
      stock_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      average_price DECIMAL(10,2) NOT NULL,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
      FOREIGN KEY (stock_id) REFERENCES stocks(id)
    )
  `);

  // Watchlist table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stock_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (stock_id) REFERENCES stocks(id),
      UNIQUE(user_id, stock_id)
    )
  `);

  // Market indices table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS market_indices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) UNIQUE NOT NULL,
      symbol VARCHAR(20) UNIQUE NOT NULL,
      value DECIMAL(15,2) NOT NULL,
      change_amount DECIMAL(15,2),
      change_percent DECIMAL(5,2),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stock recommendations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stock_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_id INTEGER NOT NULL,
      action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
      target_price DECIMAL(10,2),
      confidence_percent INTEGER CHECK (confidence_percent >= 0 AND confidence_percent <= 100),
      timeframe VARCHAR(20),
      reasoning TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stock_id) REFERENCES stocks(id)
    )
  `);

  // User sessions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('All tables created successfully');
}

async function insertInitialData() {
  try {
    // Insert default user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name)
      VALUES ('demo', 'demo@bazaarvision.com', ?, 'Demo', 'User')
    `, [hashedPassword]);

    // Insert popular stocks
    const stocks = [
      ['RELIANCE', 'Reliance Industries Ltd', 'Oil & Gas', 'Integrated Oil & Gas', 1920000.00, 25.5, 0.8],
      ['TCS', 'Tata Consultancy Services', 'Technology', 'IT Services', 1300000.00, 28.2, 1.2],
      ['INFY', 'Infosys Limited', 'Technology', 'IT Services', 740000.00, 22.1, 1.5],
      ['HDFC', 'HDFC Bank Limited', 'Financial', 'Banking', 1250000.00, 18.5, 1.8],
      ['ICICIBANK', 'ICICI Bank Limited', 'Financial', 'Banking', 980000.00, 16.8, 1.6],
      ['ITC', 'ITC Limited', 'Consumer Goods', 'Tobacco', 850000.00, 20.3, 2.1],
      ['SBIN', 'State Bank of India', 'Financial', 'Banking', 720000.00, 12.5, 1.9],
      ['BHARTIARTL', 'Bharti Airtel Limited', 'Telecommunications', 'Wireless', 680000.00, 45.2, 0.5],
      ['AXISBANK', 'Axis Bank Limited', 'Financial', 'Banking', 420000.00, 15.7, 1.3],
      ['ASIANPAINT', 'Asian Paints Limited', 'Consumer Goods', 'Paints', 380000.00, 65.8, 0.9]
    ];

    for (const stock of stocks) {
      await db.run(`
        INSERT OR IGNORE INTO stocks (symbol, name, sector, industry, market_cap, pe_ratio, dividend_yield)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, stock);
    }

    // Insert market indices
    const indices = [
      ['NIFTY 50', 'NIFTY50', 22147.10, 156.20, 0.71],
      ['SENSEX', 'SENSEX', 72836.34, 445.87, 0.62],
      ['BANK NIFTY', 'BANKNIFTY', 48789.55, -23.45, -0.05],
      ['USD/INR', 'USDINR', 83.42, 0.12, 0.14]
    ];

    for (const index of indices) {
      await db.run(`
        INSERT OR IGNORE INTO market_indices (name, symbol, value, change_amount, change_percent)
        VALUES (?, ?, ?, ?, ?)
      `, index);
    }

    // Insert sample stock recommendations
    const recommendations = [
      [1, 'BUY', 3200.00, 85, '3M', 'Strong fundamentals and growth potential'],
      [2, 'HOLD', 3800.00, 72, '6M', 'Stable performance, wait for better entry'],
      [3, 'BUY', 1950.00, 78, '3M', 'Undervalued with good growth prospects'],
      [4, 'HOLD', 1650.00, 65, '1M', 'Market volatility, maintain position'],
      [5, 'BUY', 1200.00, 82, '6M', 'Strong banking sector growth']
    ];

    for (const rec of recommendations) {
      await db.run(`
        INSERT OR IGNORE INTO stock_recommendations (stock_id, action, target_price, confidence_percent, timeframe, reasoning)
        VALUES (?, ?, ?, ?, ?, ?)
      `, rec);
    }

    // Insert sample stock prices for the stocks
    const stockPrices = [
      // RELIANCE
      [1, 2850.50, 45.20, 1.61, 12500000, 2900.00, 2800.00, 2855.00, 2850.50],
      // TCS
      [2, 3850.75, 125.30, 3.36, 8500000, 3900.00, 3820.00, 3875.00, 3850.75],
      // INFY
      [3, 1950.25, -45.80, -2.29, 12000000, 2000.00, 1940.00, 1996.05, 1950.25],
      // HDFC
      [4, 1650.80, 25.40, 1.56, 9500000, 1670.00, 1630.00, 1625.40, 1650.80],
      // ICICIBANK
      [5, 1200.45, -35.20, -2.85, 15000000, 1230.00, 1190.00, 1235.65, 1200.45],
      // ITC
      [6, 450.90, 12.30, 2.80, 8000000, 455.00, 448.00, 438.60, 450.90],
      // SBIN
      [7, 750.25, -15.80, -2.06, 18000000, 765.00, 745.00, 766.05, 750.25],
      // BHARTIARTL
      [8, 1250.60, 85.40, 7.32, 6500000, 1280.00, 1240.00, 1165.20, 1250.60],
      // AXISBANK
      [9, 980.75, -22.50, -2.24, 11000000, 1000.00, 975.00, 1003.25, 980.75],
      // ASIANPAINT
      [10, 3200.40, 45.60, 1.45, 4500000, 3220.00, 3180.00, 3154.80, 3200.40]
    ];

    // Clear existing stock prices first
    await db.run('DELETE FROM stock_prices');
    
    for (const price of stockPrices) {
      await db.run(`
        INSERT INTO stock_prices (stock_id, price, change_amount, change_percent, volume, high, low, open_price, close_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, price);
    }

    console.log('Initial data inserted successfully');
  } catch (error) {
    console.error('Error inserting initial data:', error);
  }
}

export function getDatabase() {
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
  }
}
