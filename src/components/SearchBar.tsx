import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

interface SearchResult {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change_percent: number;
  trend: "up" | "down" | "neutral";
}

const SearchBar = ({ placeholder = "Search stocks...", onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['stock-search', debouncedQuery],
    queryFn: () => apiClient.searchStocks(debouncedQuery, 10),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.length >= 2);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    }
    setIsOpen(false);
  };

  const handleResultClick = (symbol: string) => {
    navigate(`/stock/${symbol}`);
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const TrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return TrendingUp;
      case "down": return TrendingDown;
      default: return Minus;
    }
  };

  const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-20"
        />
        <Button
          onClick={handleSearch}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
          size="sm"
        >
          Search
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Searching...
              </div>
            ) : searchResults?.stocks && searchResults.stocks.length > 0 ? (
              <div className="divide-y">
                {searchResults.stocks.map((stock: SearchResult) => {
                  const IconComponent = TrendIcon(stock.trend);
                  return (
                    <div
                      key={stock.symbol}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleResultClick(stock.symbol)}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">{formatPrice(stock.price)}</div>
                          <div className={cn(
                            "flex items-center gap-1 text-sm",
                            stock.trend === "up" && "text-success",
                            stock.trend === "down" && "text-danger",
                            stock.trend === "neutral" && "text-muted-foreground"
                          )}>
                            <IconComponent className="w-3 h-3" />
                            <span>{stock.change_percent > 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {stock.sector}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : debouncedQuery.length >= 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                No stocks found for "{debouncedQuery}"
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchBar;