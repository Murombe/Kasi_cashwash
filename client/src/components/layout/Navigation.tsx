import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Car, Phone, Menu, X } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", public: true },
    { href: "/services", label: "Services", public: true },
    { href: "/reviews", label: "Reviews", public: true },
    { href: "/comparison", label: "Compare", public: true },
    { href: "/booking", label: "Book Now", public: false },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/bookings", label: "Bookings" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
              <Car className="text-white text-lg" />
            </div>
            <span className="text-2xl font-bold text-gradient">AquaShine</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              if (!link.public && !isAuthenticated) return null;
              // Hide "Book Now" for admin users
              if (link.href === "/booking" && user?.role === 'admin') return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium transition-colors duration-300 ${
                    location === link.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  data-testid={`nav-link-${link.label.toLowerCase().replace(" ", "-")}`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Admin Links */}
            {user?.role === 'admin' && (
              <div className="flex items-center space-x-8">
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-medium transition-colors duration-300 ${
                      location === link.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    data-testid={`admin-link-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 glass-effect px-3 py-2 rounded-lg">
              <Phone className="text-primary w-4 h-4" />
              <span className="text-sm font-medium">+1 (555) 123-4567</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.firstName || user?.email}
                </span>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="glass-effect border-border hover:bg-white/20"
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-effect border-border hover:bg-white/20"
                    data-testid="button-login"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg transition-all duration-300"
                    size="sm"
                    data-testid="button-register"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Button
              className="md:hidden"
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            className="md:hidden"
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 glass-effect rounded-2xl p-6 space-y-4">
            {navLinks.map((link) => {
              if (!link.public && !isAuthenticated) return null;
              // Hide "Book Now" for admin users
              if (link.href === "/booking" && user?.role === 'admin') return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block font-medium transition-colors duration-300 ${
                    location === link.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-link-${link.label.toLowerCase().replace(" ", "-")}`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {user?.role === 'admin' && (
              <div className="border-t border-border pt-4 space-y-4">
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block font-medium transition-colors duration-300 ${
                      location === link.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-admin-link-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
            
            <div className="border-t border-border pt-4">
              {isAuthenticated ? (
                <Button
                  onClick={logout}
                  variant="outline"
                  className="w-full glass-effect border-border hover:bg-white/20"
                  data-testid="mobile-button-logout"
                >
                  Logout
                </Button>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      className="w-full glass-effect border-border hover:bg-white/20"
                      data-testid="mobile-button-login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button
                      className="w-full ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      data-testid="mobile-button-register"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
