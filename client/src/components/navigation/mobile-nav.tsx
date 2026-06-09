import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { StineLogo } from "@/components/ui/geometric-logo";
import { Badge } from "@/components/ui/badge";
import {
  SlidersHorizontal,
  Mic2,
  Radio,
  BarChart3,
  Crown,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

const navItems: NavItem[] = [
  { path: "/mixer", label: "Mixer", icon: SlidersHorizontal, color: "text-cyan-400" },
  { path: "/studio", label: "Studio", icon: Mic2, color: "text-purple-400" },
  { path: "/feed", label: "Feed", icon: Radio, color: "text-pink-400" },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3, color: "text-yellow-400" },
  { path: "/subscription", label: "Upgrade", icon: Crown, color: "text-amber-400" },
];

export function MobileNav() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Desktop Top Nav */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-card/80 backdrop-blur border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <StineLogo className="scale-75" />
          <span className="font-bold text-lg tracking-tight">STINE</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                className={`gap-2 ${isActive(item.path) ? "geometric-gradient text-primary-foreground" : ""}`}
                onClick={() => setLocation(item.path)}
              >
                <Icon className={`w-4 h-4 ${!isActive(item.path) ? item.color : ""}`} />
                {item.label}
              </Button>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
            Live
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = "/api/logout"}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <StineLogo className="scale-60" />
          <span className="font-bold text-sm">STINE</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-card/95 backdrop-blur border-b border-border z-50 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${isActive(item.path) ? "geometric-gradient text-primary-foreground" : ""}`}
                onClick={() => { setLocation(item.path); setMobileMenuOpen(false); }}
              >
                <Icon className={`w-5 h-5 ${!isActive(item.path) ? item.color : ""}`} />
                {item.label}
              </Button>
            );
          })}
          <div className="border-t border-border pt-2">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => window.location.href = "/api/logout"}>
              <LogOut className="w-5 h-5 text-muted-foreground" />
              Log Out
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur border-t border-border z-50 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all min-w-[64px] ${
                  active ? "bg-primary/10" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? item.color : "text-muted-foreground"}`} />
                <span className={`text-[10px] font-medium ${active ? item.color : "text-muted-foreground"}`}>
                  {item.label}
                </span>
                {active && (
                  <span className={`w-5 h-0.5 rounded-full mt-0.5 ${item.color.replace("text-", "bg-")}`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
