import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AddToWatchlistModalProps {
  trigger?: React.ReactNode;
}

const AddToWatchlistModal = ({ trigger }: AddToWatchlistModalProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Search stocks query
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['stockSearch', searchQuery],
    queryFn: () => apiClient.searchStocks(searchQuery, 10),
    enabled: searchQuery.length >= 2 && isSearching,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: (stockSymbol: string) => apiClient.addToWatchlist(stockSymbol),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock added to watchlist successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to watchlist",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
  };

  const handleStockSelect = (stock: any) => {
    setSelectedStock(stock);
    setSearchQuery(stock.symbol);
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStock) {
      toast({
        title: "Error",
        description: "Please select a stock",
        variant: "destructive",
      });
      return;
    }

    addToWatchlistMutation.mutate(selectedStock.symbol);
  };

  const handleClose = () => {
    setOpen(false);
    setSearchQuery("");
    setSelectedStock(null);
    setIsSearching(false);
  };

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
        "flex items-center gap-1 text-sm",
        isPositive ? "text-success" : "text-destructive"
      )}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(2)}%
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add to Watchlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stock Search */}
          <div className="space-y-2">
            <Label htmlFor="stock-search">Search Stock</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="stock-search"
                placeholder="Search by symbol or company name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Search Results */}
            {isSearching && searchQuery.length >= 2 && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {searching ? (
                  <div className="text-sm text-muted-foreground">Searching...</div>
                ) : searchResults?.stocks?.length > 0 ? (
                  searchResults.stocks.map((stock: any) => (
                    <Card
                      key={stock.symbol}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatPrice(stock.price)}</div>
                            {formatChange(stock.change)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No stocks found</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Stock Display */}
          {selectedStock && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{selectedStock.symbol}</div>
                    <div className="text-sm text-muted-foreground">{selectedStock.name}</div>
                    <Badge variant="secondary" className="mt-1">
                      {selectedStock.sector || 'N/A'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">{formatPrice(selectedStock.price)}</div>
                    {formatChange(selectedStock.change)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedStock || addToWatchlistMutation.isPending}
            >
              {addToWatchlistMutation.isPending ? "Adding..." : "Add to Watchlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddToWatchlistModal;
