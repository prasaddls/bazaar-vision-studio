import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Stock {
  id?: number;
  symbol: string;
  name: string;
  price: number;
  change_amount: number;
  change_percent: number;
  volume: number;
  market_cap: number;
  trend: "up" | "down" | "neutral";
  recommendation?: "BUY" | "SELL" | "HOLD";
}

interface StockTableProps {
  stocks?: Stock[];
  title?: string;
  showViewAll?: boolean;
}

const StockTable = ({ stocks = [], title = "Top Stocks", showViewAll = true }: StockTableProps) => {
  const navigate = useNavigate();
  
  const TrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return TrendingUp;
      case "down": return TrendingDown;
      default: return Minus;
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 100000) {
      return `₹${(marketCap / 100000).toFixed(1)}L Cr`;
    } else if (marketCap >= 1000) {
      return `₹${(marketCap / 1000).toFixed(1)}K Cr`;
    }
    return `₹${marketCap} Cr`;
  };

  const handleStockClick = (symbol: string) => {
    navigate(`/stock/${symbol}`);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {showViewAll && (
            <Button variant="outline" size="sm">
              View All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stocks.length > 0 ? (
            stocks.map((stock) => {
              const IconComponent = TrendIcon(stock.trend);
              return (
                <div 
                  key={stock.symbol} 
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
                  onClick={() => handleStockClick(stock.symbol)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{stock.symbol}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Add to watchlist functionality
                          }}
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground">{stock.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatPrice(stock.price)}</div>
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        stock.trend === "up" && "text-success",
                        stock.trend === "down" && "text-danger",
                        stock.trend === "neutral" && "text-muted-foreground"
                      )}>
                        <IconComponent className="w-3 h-3" />
                        <span>
                          {stock.change_amount > 0 ? '+' : ''}{stock.change_amount.toFixed(2)} ({stock.change_percent > 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Volume</div>
                      <div className="font-medium">{formatVolume(stock.volume)}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Market Cap</div>
                      <div className="font-medium">{formatMarketCap(stock.market_cap)}</div>
                    </div>
                    
                    {stock.recommendation && (
                      <Badge 
                        variant="outline"
                        className={cn(
                          "font-medium",
                          stock.recommendation === "BUY" && "border-success text-success",
                          stock.recommendation === "SELL" && "border-danger text-danger",
                          stock.recommendation === "HOLD" && "border-warning text-warning"
                        )}
                      >
                        {stock.recommendation}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No stocks available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockTable;