import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Settings, 
  Bell, 
  User,
  Menu,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: BarChart3, label: "Dashboard", active: true },
    { icon: TrendingUp, label: "Stocks", active: false },
    { icon: PieChart, label: "Mutual Funds", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Navigation Sidebar */}
      <nav className={cn(
        "fixed left-0 top-0 h-full w-64 bg-card/95 backdrop-blur-md border-r border-border/50 z-40 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BazaarLens
            </span>
          </div>

          {/* Navigation Items */}
          <div className="space-y-2 mb-8">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  item.active && "gradient-primary shadow-glow"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* User Section */}
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12">
              <Bell className="w-5 h-5" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12">
              <User className="w-5 h-5" />
              Profile
            </Button>
          </div>
        </div>

        {/* Market Status */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Market Status</span>
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            </div>
            <span className="text-xs font-medium text-success">Market Open</span>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;