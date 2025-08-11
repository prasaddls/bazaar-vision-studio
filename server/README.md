# BazaarLens - Backend API

A comprehensive backend API for the BazaarLens stock market dashboard application.

## Features

- **Authentication System**: JWT-based user authentication with registration, login, and profile management
- **Real-time Market Data**: Simulated real-time stock prices and market indices
- **Portfolio Management**: Create portfolios, add holdings, track performance
- **Stock Recommendations**: AI-powered stock recommendations with confidence scores
- **Watchlist Management**: Add/remove stocks from personal watchlists
- **Market Analysis**: Market overview, sector performance, heatmaps
- **Database Management**: SQLite database with automatic maintenance
- **Scheduled Tasks**: Cron jobs for data cleanup and recommendations generation

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password

### Market Data (`/api/market`)
- `GET /overview` - Get market overview with indices and statistics
- `GET /indices` - Get market indices
- `GET /sectors` - Get sector performance
- `GET /heatmap` - Get market heatmap data
- `GET /news` - Get market news
- `GET /calendar` - Get market calendar events

### Stocks (`/api/stocks`)
- `GET /` - Get all stocks with pagination
- `GET /search` - Search stocks by symbol, name, or sector
- `GET /:symbol` - Get specific stock details
- `GET /:symbol/history` - Get stock price history
- `GET /top/gainers` - Get top gainers
- `GET /top/losers` - Get top losers
- `GET /most-active` - Get most active stocks

### Portfolio (`/api/portfolio`) - Requires Authentication
- `GET /` - Get user portfolios
- `POST /` - Create new portfolio
- `GET /:portfolioId` - Get portfolio details with holdings
- `POST /:portfolioId/holdings` - Add stock to portfolio
- `PUT /:portfolioId/holdings/:holdingId` - Update holding
- `GET /watchlist` - Get user watchlist
- `POST /watchlist` - Add stock to watchlist
- `DELETE /watchlist/:stockSymbol` - Remove stock from watchlist

### Recommendations (`/api/recommendations`)
- `GET /` - Get all recommendations
- `GET /action/:action` - Get recommendations by action (BUY/SELL/HOLD)
- `GET /sector/:sector` - Get recommendations by sector
- `GET /high-confidence` - Get high confidence recommendations
- `GET /summary` - Get recommendations summary
- `GET /personalized` - Get personalized recommendations (requires auth)

## Database Schema

### Tables
- `users` - User accounts and profiles
- `stocks` - Stock information and fundamentals
- `stock_prices` - Historical and current stock prices
- `portfolios` - User portfolios
- `portfolio_holdings` - Portfolio stock holdings
- `watchlist` - User watchlists
- `market_indices` - Market indices data
- `stock_recommendations` - AI-generated recommendations
- `user_sessions` - User session management

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Server**
   ```bash
   # Development mode
   npm run server:dev
   
   # Production mode
   npm run server
   ```

4. **Start Both Frontend and Backend**
   ```bash
   npm run dev:full
   ```

## API Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "email": "demo@example.com",
    "password": "password123",
    "firstName": "Demo",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "password123"
  }'
```

### Get market overview
```bash
curl http://localhost:5000/api/market/overview
```

### Get stock details
```bash
curl http://localhost:5000/api/stocks/RELIANCE
```

### Create portfolio (with authentication)
```bash
curl -X POST http://localhost:5000/api/portfolio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Portfolio",
    "description": "Long-term investment portfolio"
  }'
```

## Real-time Features

The backend includes simulated real-time market data that updates every 30 seconds during market hours (9:15 AM - 3:30 PM IST, Monday-Friday).

## Scheduled Tasks

- **Daily at 2 AM**: Clean up old stock prices (keep last 30 days)
- **Daily at 6 AM**: Generate new stock recommendations
- **Hourly during market hours**: Update market statistics
- **Every 6 hours**: Clean up expired user sessions
- **Weekly on Sunday at 3 AM**: Database maintenance

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Input validation with express-validator
- Helmet.js security headers

## Development

### Project Structure
```
server/
├── index.js              # Main server file
├── database/
│   └── init.js           # Database initialization
├── middleware/
│   └── auth.js           # Authentication middleware
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── market.js         # Market data routes
│   ├── stocks.js         # Stock routes
│   ├── portfolio.js      # Portfolio routes
│   └── recommendations.js # Recommendations routes
├── services/
│   ├── marketData.js     # Market data service
│   └── cronJobs.js       # Scheduled tasks
└── data/                 # SQLite database files
```

### Adding New Features

1. **New Route**: Create a new file in `routes/` directory
2. **New Service**: Create a new file in `services/` directory
3. **Database Changes**: Update `database/init.js` with new tables
4. **Middleware**: Add new middleware in `middleware/` directory

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use a production database (PostgreSQL/MySQL)
3. Set a strong JWT secret
4. Configure proper CORS origins
5. Set up SSL/TLS certificates
6. Use a process manager like PM2

## API Documentation

The API follows RESTful conventions and returns JSON responses. All error responses include an `error` field with a descriptive message.

### Response Format
```json
{
  "data": {...},
  "message": "Success message",
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Format
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Support

For issues and questions, please refer to the main project documentation or create an issue in the repository.
