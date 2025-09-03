import { Link, useLocation } from "wouter";
import { Car, BarChart3, Calendar, Settings, Users, Star, LogOut, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/services", label: "Services", icon: Settings },
  { href: "/admin/slots", label: "Time Slots", icon: Clock },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/", label: "View Site", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="glass-dark h-full min-h-screen w-64 fixed left-0 top-0 z-40 p-6 space-y-6">
      {/* Logo */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
          <Car className="text-white" />
        </div>
        <span className="text-xl font-bold text-gradient">Admin Panel</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href ||
            (item.href === "/admin/dashboard" && location.startsWith("/admin") &&
             location !== "/admin/services" && location !== "/admin/bookings" && location !== "/admin/users" && location !== "/admin/slots");
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start space-x-3 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Actions */}
      <div className="mt-auto pt-6 border-t border-border space-y-2">
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/api/logout'}
          className="w-full justify-start space-x-3 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-300"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}
