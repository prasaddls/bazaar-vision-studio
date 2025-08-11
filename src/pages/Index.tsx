import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import MarketCard from "@/components/MarketCard";
import SearchBar from "@/components/SearchBar";
import StockTable from "@/components/StockTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight, Clock, Target, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import { apiClient } from "@/lib/api";

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch market overview data
  const { data: marketData, isLoading: marketLoading, error: marketError } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => apiClient.getMarketOverview(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => apiClient.getRecommendations({ limit: 3 }),
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch top stocks
  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['top-stocks'],
    queryFn: () => apiClient.getStocks({ limit: 4, sort: 'change_percent', order: 'DESC' }),
    refetchInterval: 30000,
  });

  if (marketError) {
    console.error('Market data error:', marketError);
  }

  const marketIndices = marketData?.indices || [];
  const topStocks = stocksData?.stocks || [];
  const recommendations = recommendationsData?.recommendations || [];
  const marketStats = marketData?.stats || {};

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main Content */}
      <main className="md:ml-64 p-6 space-y-8">
        {/* Hero Section */}
        <section 
          className="relative rounded-2xl overflow-hidden glass-card"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50"></div>
          <div className="relative p-8 md:p-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {currentTime.toLocaleString()}
                </span>
                <Badge variant="outline" className="border-success text-success">
                  Live
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Track Markets with
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  BazaarLens
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Real-time stock analysis, mutual fund insights, and AI-powered recommendations 
                to make smarter investment decisions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gradient-primary shadow-glow">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Start Analyzing
                </Button>
                <Button variant="outline" size="lg">
                  View Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Market Overview */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-bold mb-6">Market Overview</h2>
          {marketLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {marketIndices.map((index) => (
                <MarketCard 
                  key={index.symbol}
                  title={index.name}
                  value={index.value?.toFixed(2) || "0.00"}
                  change={index.change_amount?.toFixed(2) || "0.00"}
                  changePercent={index.change_percent?.toFixed(2) + "%" || "0.00%"}
                  trend={index.change_percent > 0 ? "up" : index.change_percent < 0 ? "down" : "neutral"}
                />
              ))}
            </div>
          )}
        </section>

        {/* Search */}
        <section className="animate-slide-up">
          <SearchBar 
            placeholder="Search stocks, mutual funds, or sectors..."
            onSearch={(query) => console.log('Searching:', query)}
          />
        </section>

        {/* Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Stock Table */}
          <div className="lg:col-span-2">
            {stocksLoading ? (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Top Stocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <StockTable stocks={topStocks} />
            )}
          </div>

          {/* Recommendations */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  AI Recommendations
                  {recommendationsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendationsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
                  ))
                ) : recommendations.length > 0 ? (
                  recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-lg bg-background/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{rec.symbol}</span>
                        <Badge 
                          variant="outline"
                          className={
                            rec.action === "BUY" ? "border-success text-success" :
                            rec.action === "SELL" ? "border-danger text-danger" :
                            "border-warning text-warning"
                          }
                        >
                          {rec.action}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Target: <span className="text-foreground font-medium">₹{rec.target_price}</span></div>
                        <div>Confidence: <span className="text-foreground font-medium">{rec.confidence_percent}%</span></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Timeframe: {rec.timeframe}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No recommendations available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Today's Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gainers</span>
                    <span className="font-bold text-success">
                      {marketStats.gainers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Losers</span>
                    <span className="font-bold text-danger">
                      {marketStats.losers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unchanged</span>
                    <span className="font-bold text-muted-foreground">
                      {marketStats.unchanged || 0}
                    </span>
                  </div>
                  <hr className="border-border/50" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Volume</span>
                    <span className="font-bold">
                      ₹{(marketStats.totalVolume / 10000000)?.toFixed(0) || 0} Cr
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;