import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/admin/Sidebar";
import { GlassCard } from "@/components/ui/glass-card";
import { FloatingCard } from "@/components/ui/floating-card";
import { Calendar, DollarSign, Star, TrendingUp, Users, Car, Clock, Award, AlertTriangle } from "lucide-react";
import { differenceInMinutes } from "date-fns";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // Update current time every minute for real-time booking status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Admin-specific booking time status (different messaging than customer view)
  const getAdminBookingTimeStatus = (booking: any) => {
    if (!booking.slot?.date || !booking.slot?.startTime) return null;

    const serviceDateTime = new Date(`${booking.slot.date}T${booking.slot.startTime}`);
    const minutesDiff = differenceInMinutes(serviceDateTime, currentTime);

    // Service starts soon - show countdown
    if (minutesDiff > 0 && minutesDiff <= 30) {
      return { type: 'countdown', minutes: minutesDiff, message: `Starts in ${minutesDiff} min` };
    }

    // Customer is late - show from admin perspective
    if (minutesDiff < 0 && minutesDiff >= -15) {
      const minutesLate = Math.abs(minutesDiff);
      return { type: 'late', minutes: minutesLate, message: `Customer ${minutesLate} min late!` };
    }

    // Auto-cancelled for no-show
    if (minutesDiff < -15) {
      return { type: 'auto-cancel', minutes: Math.abs(minutesDiff), message: 'Auto-cancelled (no-show)' };
    }

    return null;
  };

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

        <div className="grid lg:grid-cols-1 gap-8">
          {/* Booking Analytics */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold mb-6">Booking Analytics</h3>
            <div className="space-y-6">
              {/* Service Popularity */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Most Popular Services</h4>
                <div className="space-y-3">
                  {services?.slice(0, 4).map((service: any, index: number) => {
                    const serviceBookings = bookings?.filter((b: any) => b.serviceId === service.id).length || 0;
                    const percentage = totalBookings > 0 ? (serviceBookings / totalBookings) * 100 : 0;
                    return (
                      <div key={service.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-primary' :
                            index === 1 ? 'bg-accent' :
                            index === 2 ? 'bg-secondary' : 'bg-muted'
                          }`}></div>
                          <span className="text-sm">{service.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium">{serviceBookings}</div>
                          <div className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue by Service */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Revenue Breakdown</h4>
                <div className="space-y-3">
                  {services?.slice(0, 3).map((service: any, index: number) => {
                    const serviceRevenue = bookings?.filter((b: any) => b.serviceId === service.id)
                      .reduce((sum: number, booking: any) => sum + parseFloat(booking.totalAmount || '0'), 0) || 0;
                    const percentage = totalRevenue > 0 ? (serviceRevenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={service.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{service.name}</span>
                          <span className="text-sm font-medium">R{serviceRevenue.toFixed(0)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-gradient-to-r from-primary to-accent' :
                              index === 1 ? 'bg-gradient-to-r from-accent to-secondary' :
                              'bg-gradient-to-r from-secondary to-primary'
                            }`}
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Booking Status Overview */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Booking Status</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{completedBookings}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">{pendingBookings}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {bookings?.filter((b: any) => b.status === 'cancelled').length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Cancelled</div>
                  </div>
                </div>
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
