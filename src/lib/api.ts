const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await this.request<{
      message: string;
      user: any;
      token: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.setToken(response.token);
    return response;
  }

  async login(credentials: { username: string; password: string }) {
    const response = await this.request<{
      message: string;
      user: any;
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(response.token);
    return response;
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  }

  async updateProfile(profileData: {
    firstName: string;
    lastName: string;
    email: string;
  }) {
    return this.request<{ message: string; user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string; note?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<{ message: string; note?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Market Data
  async getMarketOverview() {
    return this.request<{
      indices: any[];
      topStocks: any[];
      stats: any;
      timestamp: string;
    }>('/market/overview');
  }

  async getMarketIndices() {
    return this.request<{ indices: any[] }>('/market/indices');
  }

  async getSectorPerformance() {
    return this.request<{ sectors: any[] }>('/market/sectors');
  }

  async getMarketHeatmap() {
    return this.request<{ heatmapData: any[] }>('/market/heatmap');
  }

  async getMarketNews() {
    return this.request<{ news: any[] }>('/market/news');
  }

  async getMarketCalendar(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    return this.request<{ calendar: any[] }>(`/market/calendar?${params}`);
  }

  // Stocks
  async getStocks(params?: {
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    return this.request<{
      stocks: any[];
      pagination: any;
    }>(`/stocks?${queryParams}`);
  }

  async searchStocks(query: string, limit: number = 10) {
    return this.request<{ stocks: any[] }>(
      `/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  async getStock(symbol: string) {
    return this.request<{
      stock: any;
      historicalPrices: any[];
      recommendations: any[];
    }>(`/stocks/${symbol}`);
  }

  async getStockHistory(symbol: string, period: string = '30d') {
    return this.request<{ history: any[] }>(
      `/stocks/${symbol}/history?period=${period}`
    );
  }

  async getTopGainers(limit: number = 10) {
    return this.request<{ gainers: any[] }>(`/stocks/top/gainers?limit=${limit}`);
  }

  async getTopLosers(limit: number = 10) {
    return this.request<{ losers: any[] }>(`/stocks/top/losers?limit=${limit}`);
  }

  async getMostActive(limit: number = 10) {
    return this.request<{ mostActive: any[] }>(`/stocks/most-active?limit=${limit}`);
  }

  // Portfolio (requires authentication)
  async getPortfolios() {
    return this.request<{ portfolios: any[] }>('/portfolio');
  }

  async createPortfolio(portfolioData: { name: string; description?: string }) {
    return this.request<{ message: string; portfolio: any }>('/portfolio', {
      method: 'POST',
      body: JSON.stringify(portfolioData),
    });
  }

  async getPortfolio(portfolioId: number) {
    return this.request<{
      portfolio: any;
      holdings: any[];
      summary: any;
    }>(`/portfolio/${portfolioId}`);
  }

  async addHolding(
    portfolioId: number,
    holdingData: {
      stockSymbol: string;
      quantity: number;
      averagePrice: number;
    }
  ) {
    return this.request<{ message: string; holding?: any }>(
      `/portfolio/${portfolioId}/holdings`,
      {
        method: 'POST',
        body: JSON.stringify(holdingData),
      }
    );
  }

  async updateHolding(
    portfolioId: number,
    holdingId: number,
    holdingData: { quantity: number; averagePrice: number }
  ) {
    return this.request<{ message: string }>(
      `/portfolio/${portfolioId}/holdings/${holdingId}`,
      {
        method: 'PUT',
        body: JSON.stringify(holdingData),
      }
    );
  }

  async getWatchlist() {
    return this.request<{ watchlist: any[] }>('/portfolio/watchlist');
  }

  async addToWatchlist(stockSymbol: string) {
    return this.request<{ message: string }>('/portfolio/watchlist', {
      method: 'POST',
      body: JSON.stringify({ stockSymbol }),
    });
  }

  async removeFromWatchlist(stockSymbol: string) {
    return this.request<{ message: string }>(
      `/portfolio/watchlist/${stockSymbol}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Recommendations
  async getRecommendations(params?: {
    limit?: number;
    action?: 'BUY' | 'SELL' | 'HOLD';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }

    return this.request<{ recommendations: any[] }>(`/recommendations?${queryParams}`);
  }

  async getRecommendationsByAction(action: 'BUY' | 'SELL' | 'HOLD', limit: number = 10) {
    return this.request<{ recommendations: any[] }>(
      `/recommendations/action/${action}?limit=${limit}`
    );
  }

  async getRecommendationsBySector(sector: string, limit: number = 10) {
    return this.request<{ recommendations: any[] }>(
      `/recommendations/sector/${encodeURIComponent(sector)}?limit=${limit}`
    );
  }

  async getHighConfidenceRecommendations(limit: number = 10, minConfidence: number = 80) {
    return this.request<{ recommendations: any[] }>(
      `/recommendations/high-confidence?limit=${limit}&minConfidence=${minConfidence}`
    );
  }

  async getRecommendationsSummary() {
    return this.request<{
      byAction: any[];
      bySector: any[];
      confidenceDistribution: any[];
    }>('/recommendations/summary');
  }

  async getPersonalizedRecommendations() {
    return this.request<{ recommendations: any[] }>('/recommendations/personalized');
  }

  // Utility methods
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  isAuthenticated() {
    return !!this.token;
  }

  logout() {
    this.clearToken();
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export default ApiClient;
