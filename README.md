# BazaarLens

A modern, full-stack stock market analysis and portfolio management application built with React, TypeScript, Node.js, and SQLite.

## 🚀 Features

- **Real-time Market Data**: Live stock prices and market indices
- **Portfolio Management**: Track your investments and performance
- **Stock Search & Analysis**: Comprehensive stock information and recommendations
- **Watchlist**: Monitor your favorite stocks
- **User Authentication**: Secure login, registration, and profile management
- **Responsive Design**: Beautiful UI that works on all devices
- **RESTful API**: Full backend with authentication and data management

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Shadcn/ui components
- React Query for data fetching
- React Router for navigation

### Backend
- Node.js with Express
- SQLite database
- JWT authentication
- Real-time market data simulation
- Cron jobs for data updates
- RESTful API design

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bazaar-lens
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## 🚀 Running the Application

### Option 1: Run Both Servers (Recommended)

**Terminal 1 - Backend:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option 2: Use the Custom Start Script
```bash
npm run start
```

### Option 3: Run with Concurrently
```bash
npm run dev:full
```

## 🔑 Getting Started with Authentication

1. **Start the application** using one of the methods above
2. **Visit the landing page** at `http://localhost:5173/`
3. **Create an account** by clicking "Get Started" or navigate to `/register`
4. **Sign in** with your credentials or use the demo account
5. **Access protected features** like dashboard, portfolio, and profile management

## 🌐 Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **API Health Check**: http://localhost:5001/health
- **API Documentation**: http://localhost:5001/api

## 📱 Available Pages

### Public Pages
- **Landing Page** (`/`): Welcome page with features showcase and sign-up options

### Authentication Pages
- **Login** (`/login`): User authentication with username/email and password
- **Register** (`/register`): New user registration with validation
- **Forgot Password** (`/forgot-password`): Password reset functionality

### Protected Pages (Require Authentication)
- **Dashboard** (`/dashboard`): Market overview, top stocks, and recommendations
- **Stocks** (`/stocks`): Browse all stocks with search and filtering
- **Portfolio** (`/portfolio`): Manage your investments and watchlist
- **Profile** (`/profile`): User profile management and security settings
- **Settings** (`/settings`): User preferences and account settings
- **Stock Details** (`/stock/:symbol`): Detailed stock information and analysis

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change user password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Market Data
- `GET /api/market/overview` - Market overview
- `GET /api/market/indices` - Market indices
- `GET /api/stocks` - All stocks
- `GET /api/stocks/:symbol` - Stock details
- `GET /api/recommendations` - Stock recommendations

### Portfolio
- `GET /api/portfolio` - User portfolios
- `POST /api/portfolio` - Create portfolio
- `GET /api/portfolio/watchlist` - User watchlist

## 🗄️ Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and authentication
- `stocks` - Stock information
- `stock_prices` - Historical price data
- `portfolios` - User portfolios
- `portfolio_holdings` - Portfolio stock holdings
- `watchlist` - User watchlists
- `market_indices` - Market index data
- `stock_recommendations` - AI-generated recommendations

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication system
- **Password Security**: bcrypt hashing with salt rounds
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Form Validation**: Client and server-side input validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: Security headers and protection
- **Input Sanitization**: Validation and sanitization of all user inputs

## 📊 Real-time Features

- Live stock price updates during market hours
- Real-time market data simulation
- Automated cron jobs for data maintenance
- WebSocket-ready architecture

## 🎨 UI Components

Built with Shadcn/ui and Tailwind CSS:
- **Responsive Navigation**: Sidebar with authentication-aware navigation
- **Authentication Forms**: Modern login, registration, and password forms
- **Profile Management**: Tabbed interface for profile and security settings
- **Interactive Data Tables**: Stock data with sorting and filtering
- **Beautiful Cards and Charts**: Market data visualization
- **Modern Form Components**: Validation and error handling
- **Toast Notifications**: Success and error feedback
- **Loading Skeletons**: Smooth loading experiences

## 🔐 Authentication Features

### User Management
- **User Registration**: Create new accounts with validation
- **Secure Login**: Username/email authentication with JWT tokens
- **Profile Management**: Edit personal information and account details
- **Password Security**: Change passwords with current password verification
- **Password Reset**: Forgot password functionality with email simulation

### Demo Account
For testing purposes, a demo account is available:
- **Username**: `demo`
- **Password**: `password123`

### Security Features
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Session Management**: JWT token-based authentication
- **Form Validation**: Real-time validation with helpful error messages
- **Password Requirements**: Minimum 6 characters with confirmation
- **Account Status**: Active/inactive user management

## 🚀 Deployment

### Frontend
```bash
npm run build
```

### Backend
```bash
npm run server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `.env` or kill existing processes
2. **Database errors**: Delete `data/bazaar_lens.db` and restart the server
3. **Frontend not loading**: Check if the backend is running on port 5001
4. **API errors**: Verify the proxy configuration in `vite.config.ts`

### Getting Help

- Check the server logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure Node.js version 18+ is installed
- Check that all dependencies are installed

---

**Happy Trading! 📈**
