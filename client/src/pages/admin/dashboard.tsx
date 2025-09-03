import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/admin/Sidebar";
import { GlassCard } from "@/components/ui/glass-card";
import { FloatingCard } from "@/components/ui/floating-card";
import { Calendar, DollarSign, Star, TrendingUp, Users, Car, Clock, Award } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  }, [isAuthenticated, user, isLoading, toast]);

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: reviews } = useQuery({
    queryKey: ["/api/reviews"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-semibold">Loading...</div>
        </GlassCard>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-12 max-w-md mx-auto text-center">
          <div className="text-xl font-semibold mb-4">Unauthorized Access</div>
          <div className="text-muted-foreground">Admin privileges required</div>
        </GlassCard>
      </div>
    );
  }

  // Calculate statistics
  const totalBookings = bookings?.length || 0;
  const totalRevenue = bookings?.reduce((sum: number, booking: any) => 
    sum + parseFloat(booking.totalAmount || '0'), 0) || 0;
  const averageRating = reviews?.length 
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
  
  const recentBookings = bookings?.slice(0, 5) || [];
  const pendingBookings = bookings?.filter((booking: any) => booking.status === 'pending').length || 0;
  const completedBookings = bookings?.filter((booking: any) => booking.status === 'completed').length || 0;
  const activeServices = services?.filter((service: any) => service.isActive).length || 0;

  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.email?.split('@')[0]}! Here's what's happening today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <FloatingCard className="p-6" data-testid="stat-total-bookings">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gradient">{totalBookings}</div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
                <Calendar className="text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="progress-bar bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full w-3/4 transition-all duration-1000"></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">+12% from last month</div>
            </div>
          </FloatingCard>

          <FloatingCard className="p-6" data-testid="stat-monthly-revenue">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gradient">R{totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-primary rounded-xl flex items-center justify-center">
                <DollarSign className="text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="progress-bar bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-secondary to-primary h-2 rounded-full w-5/6 transition-all duration-1000"></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">+18% from last month</div>
            </div>
          </FloatingCard>

          <FloatingCard className="p-6" data-testid="stat-avg-rating">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gradient">{averageRating}</div>
                <div className="text-sm text-muted-foreground">Avg. Rating</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-accent to-secondary rounded-xl flex items-center justify-center">
                <Star className="text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="progress-bar bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-accent to-secondary h-2 rounded-full w-full transition-all duration-1000"></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">+0.2 from last month</div>
            </div>
          </FloatingCard>

          <FloatingCard className="p-6" data-testid="stat-pending-bookings">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gradient">{pendingBookings}</div>
                <div className="text-sm text-muted-foreground">Pending Bookings</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="progress-bar bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full w-2/3 transition-all duration-1000"></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Needs attention</div>
            </div>
          </FloatingCard>
        </div>

        {/* Quick Stats Row */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-gradient" data-testid="pending-bookings">{pendingBookings}</div>
            <div className="text-sm text-muted-foreground">Pending Bookings</div>
          </GlassCard>
          
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-gradient" data-testid="completed-bookings">{completedBookings}</div>
            <div className="text-sm text-muted-foreground">Completed Today</div>
          </GlassCard>
          
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-gradient">{reviews?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </GlassCard>
          
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-gradient">98%</div>
            <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
          </GlassCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recent Bookings</h3>
              <a href="/admin/bookings" className="text-primary hover:text-accent transition-colors duration-300 font-medium">
                View All
              </a>
            </div>

            <div className="space-y-4">
              {bookingsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 glass-effect rounded-xl animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                ))
              ) : recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No recent bookings</p>
                </div>
              ) : (
                recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 glass-effect rounded-xl hover:bg-white/10 transition-all duration-300" data-testid={`recent-booking-${booking.id}`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                        <Car className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{booking.service?.name || 'Service'}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.vehicleBrand} {booking.vehicleModel}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gradient">${booking.totalAmount}</div>
                      <div className="text-xs text-muted-foreground">{booking.slot?.date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Analytics Chart Placeholder */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold mb-6">Booking Analytics</h3>
            <div className="h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4" />
                <div className="text-lg font-semibold">Interactive Analytics Chart</div>
                <div className="text-sm text-muted-foreground">Real-time booking data visualization</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8">
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold mb-6">Performance Metrics</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-white text-xl" />
                </div>
                <div className="text-2xl font-bold text-gradient">32 min</div>
                <div className="text-sm text-muted-foreground">Avg Service Time</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-white text-xl" />
                </div>
                <div className="text-2xl font-bold text-gradient">850+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-accent to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="text-white text-xl" />
                </div>
                <div className="text-2xl font-bold text-gradient">98%</div>
                <div className="text-sm text-muted-foreground">Customer Retention</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
