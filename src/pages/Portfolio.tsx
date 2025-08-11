import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Star,
  PieChart,
  BarChart3,
  DollarSign
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const Portfolio = () => {
  const { data: portfolios, isLoading: portfoliosLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => apiClient.getPortfolios(),
  });

  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiClient.getWatchlist(),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={cn(
        "flex items-center gap-1",
        isPositive ? "text-success" : "text-destructive"
      )}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(change).toFixed(2)}%
      </span>
    );
  };

  const calculateTotalValue = (holdings: any[]) => {
    return holdings?.reduce((total, holding) => total + (holding.current_price * holding.quantity), 0) || 0;
  };

  const calculateTotalGain = (holdings: any[]) => {
    return holdings?.reduce((total, holding) => {
      const currentValue = holding.current_price * holding.quantity;
      const costBasis = holding.purchase_price * holding.quantity;
      return total + (currentValue - costBasis);
    }, 0) || 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Holding
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(calculateTotalValue(portfolios?.portfolios?.[0]?.holdings || []))}
                </div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  calculateTotalGain(portfolios?.portfolios?.[0]?.holdings || []) >= 0 
                    ? "text-success" 
                    : "text-destructive"
                )}>
                  {formatPrice(calculateTotalGain(portfolios?.portfolios?.[0]?.holdings || []))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {calculateTotalGain(portfolios?.portfolios?.[0]?.holdings || []) >= 0 ? "+" : ""}
                  {((calculateTotalGain(portfolios?.portfolios?.[0]?.holdings || []) / 
                     calculateTotalValue(portfolios?.portfolios?.[0]?.holdings || [])) * 100).toFixed(2)}% return
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Watchlist Items</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {watchlist?.watchlist?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {watchlist?.watchlist?.filter((item: any) => item.change > 0).length || 0} positive today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <PieChart className="w-12 h-12 mr-4" />
                Chart component will be added here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {portfoliosLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="h-12 w-12 bg-muted rounded"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : portfolios?.portfolios?.[0]?.holdings?.length > 0 ? (
                <div className="space-y-4">
                  {portfolios.portfolios[0].holdings.map((holding: any) => (
                    <div key={holding.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-primary">{holding.symbol}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{holding.symbol}</h3>
                          <p className="text-sm text-muted-foreground">
                            {holding.quantity} shares @ {formatPrice(holding.purchase_price)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(holding.current_price)}</div>
                        {formatChange(holding.change)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No holdings yet</h3>
                  <p className="text-muted-foreground mb-4">Start building your portfolio by adding some stocks</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Holding
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              {watchlistLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="h-12 w-12 bg-muted rounded"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : watchlist?.watchlist?.length > 0 ? (
                <div className="space-y-4">
                  {watchlist.watchlist.map((item: any) => (
                    <div key={item.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-primary">{item.symbol}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.symbol}</h3>
                          <p className="text-sm text-muted-foreground">{item.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(item.price)}</div>
                        {formatChange(item.change)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Watchlist is empty</h3>
                  <p className="text-muted-foreground mb-4">Add stocks to your watchlist to track them</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Watchlist
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Portfolio;
