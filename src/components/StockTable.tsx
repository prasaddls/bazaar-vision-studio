import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Stock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  marketCap: string;
  trend: "up" | "down" | "neutral";
  recommendation?: "BUY" | "SELL" | "HOLD";
}

const mockStocks: Stock[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    price: "₹2,845.50",
    change: "+24.30",
    changePercent: "0.86%",
    volume: "2.4M",
    marketCap: "₹19.2L Cr",
    trend: "up",
    recommendation: "BUY"
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: "₹3,567.80",
    change: "-12.45",
    changePercent: "-0.35%",
    volume: "1.8M",
    marketCap: "₹13.0L Cr",
    trend: "down",
    recommendation: "HOLD"
  },
  {
    symbol: "INFY",
    name: "Infosys Limited",
    price: "₹1,789.25",
    change: "+5.60",
    changePercent: "0.31%",
    volume: "3.2M",
    marketCap: "₹7.4L Cr",
    trend: "up",
    recommendation: "BUY"
  },
  {
    symbol: "HDFC",
    name: "HDFC Bank Limited",
    price: "₹1,645.90",
    change: "0.00",
    changePercent: "0.00%",
    volume: "1.5M",
    marketCap: "₹12.5L Cr",
    trend: "neutral",
    recommendation: "HOLD"
  }
];

const StockTable = () => {
  const TrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return TrendingUp;
      case "down": return TrendingDown;
      default: return Minus;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Top Stocks</span>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockStocks.map((stock) => {
            const IconComponent = TrendIcon(stock.trend);
            return (
              <div 
                key={stock.symbol} 
                className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{stock.symbol}</span>
                      <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Star className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">{stock.name}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-lg">{stock.price}</div>
                    <div className={cn(
                      "flex items-center gap-1 text-sm",
                      stock.trend === "up" && "text-success",
                      stock.trend === "down" && "text-danger",
                      stock.trend === "neutral" && "text-muted-foreground"
                    )}>
                      <IconComponent className="w-3 h-3" />
                      <span>{stock.change} ({stock.changePercent})</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Volume</div>
                    <div className="font-medium">{stock.volume}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Market Cap</div>
                    <div className="font-medium">{stock.marketCap}</div>
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
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockTable;