import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import MarketCard from "@/components/MarketCard";
import SearchBar from "@/components/SearchBar";
import StockTable from "@/components/StockTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight, Clock, Target } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const marketData = [
    {
      title: "NIFTY 50",
      value: "22,147.10",
      change: "+156.20",
      changePercent: "0.71%",
      trend: "up" as const
    },
    {
      title: "SENSEX",
      value: "72,836.34",
      change: "+445.87",
      changePercent: "0.62%",
      trend: "up" as const
    },
    {
      title: "BANK NIFTY",
      value: "48,789.55",
      change: "-23.45",
      changePercent: "-0.05%",
      trend: "down" as const
    },
    {
      title: "USD/INR",
      value: "83.42",
      change: "+0.12",
      changePercent: "0.14%",
      trend: "up" as const
    }
  ];

  const recommendations = [
    {
      symbol: "RELIANCE",
      action: "BUY",
      target: "₹3,200",
      confidence: "85%",
      timeframe: "3M"
    },
    {
      symbol: "TCS",
      action: "HOLD",
      target: "₹3,800",
      confidence: "72%",
      timeframe: "6M"
    },
    {
      symbol: "INFY",
      action: "BUY",
      target: "₹1,950",
      confidence: "78%",
      timeframe: "3M"
    }
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketData.map((market) => (
              <MarketCard key={market.title} {...market} />
            ))}
          </div>
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
            <StockTable />
          </div>

          {/* Recommendations */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.symbol} className="p-4 rounded-lg bg-background/50 space-y-2">
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
                      <div>Target: <span className="text-foreground font-medium">{rec.target}</span></div>
                      <div>Confidence: <span className="text-foreground font-medium">{rec.confidence}</span></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Timeframe: {rec.timeframe}
                    </div>
                  </div>
                ))}
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
                    <span className="font-bold text-success">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Losers</span>
                    <span className="font-bold text-danger">856</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unchanged</span>
                    <span className="font-bold text-muted-foreground">234</span>
                  </div>
                  <hr className="border-border/50" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Volume</span>
                    <span className="font-bold">₹45,678 Cr</span>
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