import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowLeft, 
  Star,
  Loader2,
  BarChart3,
  Calendar,
  Target,
  DollarSign
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stockData, isLoading, error } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => apiClient.getStock(symbol!),
    enabled: !!symbol,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['stock-history', symbol],
    queryFn: () => apiClient.getStockHistory(symbol!, '30d'),
    enabled: !!symbol,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="md:ml-64 p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !stockData?.stock) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="md:ml-64 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Stock not found</h1>
            <Button onClick={() => navigate('/')}>Go back</Button>
          </div>
        </main>
      </div>
    );
  }

  const { stock, recommendations } = stockData;
  const TrendIcon = stock.trend === "up" ? TrendingUp : stock.trend === "down" ? TrendingDown : Minus;

  const formatPrice = (price: number) => `₹${price.toFixed(2)}`;
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="md:ml-64 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{stock.symbol}</h1>
            <p className="text-muted-foreground">{stock.name}</p>
          </div>
        </div>

        {/* Stock Overview Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold">{formatPrice(stock.price)}</div>
                <div className={cn(
                  "flex items-center gap-2 text-lg",
                  stock.trend === "up" && "text-success",
                  stock.trend === "down" && "text-danger",
                  stock.trend === "neutral" && "text-muted-foreground"
                )}>
                  <TrendIcon className="w-5 h-5" />
                  <span>
                    {stock.change_amount > 0 ? '+' : ''}{stock.change_amount.toFixed(2)} ({stock.change_percent > 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{formatVolume(stock.volume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-medium">₹{(stock.market_cap / 100000).toFixed(1)}L Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sector</span>
                  <span className="font-medium">{stock.sector}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/E Ratio</span>
                  <span className="font-medium">{stock.pe_ratio?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dividend Yield</span>
                  <span className="font-medium">{stock.dividend_yield?.toFixed(2) || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium">{stock.industry}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Price Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Open</div>
                      <div className="font-medium">{formatPrice(stock.open_price)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">High</div>
                      <div className="font-medium">{formatPrice(stock.high)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Low</div>
                      <div className="font-medium">{formatPrice(stock.low)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Close</div>
                      <div className="font-medium">{formatPrice(stock.close_price)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Company Name</div>
                    <div className="font-medium">{stock.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sector</div>
                    <div className="font-medium">{stock.sector}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Industry</div>
                    <div className="font-medium">{stock.industry}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Price History (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyData?.history?.slice(0, 10).map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <div className="font-medium">{formatPrice(day.price)}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(day.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-sm",
                            day.change_percent > 0 && "text-success",
                            day.change_percent < 0 && "text-danger"
                          )}>
                            {day.change_percent > 0 ? '+' : ''}{day.change_percent.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Vol: {formatVolume(day.volume)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations && recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline"
                              className={cn(
                                rec.action === "BUY" && "border-success text-success",
                                rec.action === "SELL" && "border-danger text-danger",
                                rec.action === "HOLD" && "border-warning text-warning"
                              )}
                            >
                              {rec.action}
                            </Badge>
                            <span className="font-medium">Target: ₹{rec.target_price}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{rec.confidence_percent}% Confidence</div>
                            <div className="text-sm text-muted-foreground">{rec.timeframe}</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rec.reasoning}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Generated on {new Date(rec.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No recommendations available for this stock
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Technical analysis charts and indicators will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StockDetail;
