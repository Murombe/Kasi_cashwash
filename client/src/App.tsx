import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Booking from "@/pages/booking";
import Reviews from "@/pages/reviews";
import Comparison from "@/pages/comparison";
import AdminDashboard from "@/pages/admin/dashboard";
import Analytics from "@/pages/admin/analytics";
import AdminServices from "@/pages/admin/services";
import AdminBookings from "@/pages/admin/bookings";
import AdminUsers from "./pages/admin/users";
import AdminSlots from "./pages/admin/slots";
import Staff from "@/pages/admin/staff";
import Inventory from "@/pages/admin/inventory";
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout-success";
import Loyalty from "@/pages/loyalty";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import AdminSetup from "@/pages/admin-setup";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800 flex items-center justify-center">
        <div className="glass-effect p-8 rounded-3xl">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-foreground text-lg font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth routes - always available */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/admin-setup" component={AdminSetup} />

      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/services" component={Services} />
          <Route path="/reviews" component={Reviews} />
          <Route path="/comparison" component={Comparison} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/services" component={Services} />
          <Route path="/booking" component={Booking} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkout/success" component={CheckoutSuccess} />
          <Route path="/reviews" component={Reviews} />
          <Route path="/comparison" component={Comparison} />
          <Route path="/loyalty" component={Loyalty} />
          {user?.role === 'admin' && (
            <>
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/analytics" component={Analytics} />
              <Route path="/admin/services" component={AdminServices} />
              <Route path="/admin/bookings" component={AdminBookings} />
              <Route path="/admin/slots" component={AdminSlots} />
              <Route path="/admin/staff" component={Staff} />
              <Route path="/admin/inventory" component={Inventory} />
              <Route path="/admin/users" component={AdminUsers} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;