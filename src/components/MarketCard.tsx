import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  title: string;
  value: string;
  change: string;
  changePercent: string;
  trend: "up" | "down" | "neutral";
  sparklineData?: number[];
}

const MarketCard = ({ 
  title, 
  value, 
  change, 
  changePercent, 
  trend,
  sparklineData 
}: MarketCardProps) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  
  const sparkline = sparklineData || Array.from({ length: 20 }, () => Math.random() * 100);
  
  return (
    <Card className="glass-card hover:shadow-glow transition-all duration-300 group">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{value}</span>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            trend === "up" && "bg-success/10 text-success",
            trend === "down" && "bg-danger/10 text-danger",
            trend === "neutral" && "bg-muted/20 text-muted-foreground"
          )}>
            <TrendIcon className="w-3 h-3" />
            <span>{change}</span>
            <span>({changePercent})</span>
          </div>
        </div>
        
        {/* Mini Sparkline */}
        <div className="h-8 relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 200 32">
            <polyline
              fill="none"
              stroke={trend === "up" ? "hsl(var(--market-up))" : trend === "down" ? "hsl(var(--market-down))" : "hsl(var(--market-neutral))"}
              strokeWidth="1.5"
              points={sparkline.map((point, i) => `${(i / (sparkline.length - 1)) * 200},${32 - (point / 100) * 32}`).join(" ")}
              className="opacity-60 group-hover:opacity-100 transition-opacity"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketCard;