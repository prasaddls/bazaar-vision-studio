import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const SearchBar = ({ 
  placeholder = "Search stocks, mutual funds...", 
  onSearch,
  className 
}: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <Card className={`glass-card p-4 ${className}`}>
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
        <Button 
          type="submit" 
          className="h-12 px-6 gradient-primary hover:shadow-glow transition-all"
        >
          Search
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="icon"
          className="h-12 w-12 hover:bg-muted/50"
        >
          <Filter className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
};

export default SearchBar;