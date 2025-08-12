import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

const Stocks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, gainers, losers, active

  const { data: stocks, isLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => apiClient.getStocks(),
  });

  const { data: topGainers } = useQuery({
    queryKey: ['top-gainers'],
    queryFn: () => apiClient.getTopGainers(),
  });

  const { data: topLosers } = useQuery({
    queryKey: ['top-losers'],
    queryFn: () => apiClient.getTopLosers(),
  });

  const { data: mostActive } = useQuery({
    queryKey: ['most-active'],
    queryFn: () => apiClient.getMostActive(),
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

  const getFilteredStocks = () => {
    if (!stocks?.stocks) return [];
    
    let filtered = stocks.stocks;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    switch (filter) {
      case "gainers":
        return topGainers?.stocks || [];
      case "losers":
        return topLosers?.stocks || [];
      case "active":
        return mostActive?.stocks || [];
      default:
        return filtered;
    }
  };

  const filteredStocks = getFilteredStocks();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="md:ml-64 p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Stocks</h1>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "gainers" ? "default" : "outline"}
              onClick={() => setFilter("gainers")}
            >
              Top Gainers
            </Button>
            <Button
              variant={filter === "losers" ? "default" : "outline"}
              onClick={() => setFilter("losers")}
            >
              Top Losers
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              onClick={() => setFilter("active")}
            >
              Most Active
            </Button>
          </div>
        </div>
      </div>

      {/* Stock Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock) => (
            <Card key={stock.symbol} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <Badge variant="secondary">{stock.sector}</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-semibold">{formatPrice(stock.price)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Change</span>
                    {formatChange(stock.change_percent || stock.change || 0)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Volume</span>
                    <span className="text-sm">{stock.volume.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredStocks.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No stocks found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
      </main>
    </div>
  );
};

export default Stocks;
