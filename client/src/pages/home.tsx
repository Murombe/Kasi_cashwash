import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ServiceCard from "@/components/ServiceCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, Star, TrendingUp, Clock, X } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: userBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("PUT", `/api/bookings/${bookingId}/cancel`, {});
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking.",
        variant: "destructive",
      });
    },
  });

  const handleCancelBooking = (bookingId: string) => {
    cancelBookingMutation.mutate(bookingId);
  };

  const recentBookings = userBookings?.slice(0, 3) || [];

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Welcome Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="glass-effect p-8 rounded-3xl mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  Welcome back, <span className="text-gradient">{user?.firstName || user?.email?.split('@')[0] || 'Car Enthusiast'}</span>!
                </h1>
                <p className="text-xl text-muted-foreground">
                  Ready to give your car the premium treatment it deserves?
                </p>
              </div>
              <div className="hidden md:block">
                <Link href="/booking">
                  <Button
                    className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300"
                    data-testid="button-book-now"
                  >
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <div className="glass-effect p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Calendar className="text-white" />
              </div>
              <div className="text-2xl font-bold text-gradient" data-testid="stat-user-bookings">
                {userBookings?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </div>

            <div className="glass-effect p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Star className="text-white" />
              </div>
              <div className="text-2xl font-bold text-gradient">4.9</div>
              <div className="text-sm text-muted-foreground">Your Avg Rating</div>
            </div>

            <div className="glass-effect p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-accent to-secondary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="text-white" />
              </div>
              <div className="text-2xl font-bold text-gradient">12</div>
              <div className="text-sm text-muted-foreground">Available Slots</div>
            </div>

            <div className="glass-effect p-6 rounded-2xl text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Clock className="text-white" />
              </div>
              <div className="text-2xl font-bold text-gradient">30min</div>
              <div className="text-sm text-muted-foreground">Avg Service Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-gradient">Recent Bookings</span>
              </h2>
              <Link href="/booking">
                <Button
                  variant="outline"
                  className="glass-effect border-border hover:bg-white/20"
                  data-testid="button-view-all-bookings"
                >
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {bookingsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-effect p-6 rounded-2xl animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                ))
              ) : (
                recentBookings.map((booking: any) => (
                  <div key={booking.id} className="glass-effect p-6 rounded-2xl hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg" data-testid={`booking-service-${booking.id}`}>
                          {booking.service?.name || 'Service'}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {booking.vehicleBrand} {booking.vehicleModel} • {booking.slot?.date}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                            booking.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {booking.status}
                          </span>
                          {booking.paymentMethod && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.paymentMethod === 'card' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {booking.paymentMethod} payment
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end space-y-2">
                        <div className="text-2xl font-bold text-gradient" data-testid={`booking-amount-${booking.id}`}>
                          R{booking.totalAmount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.slot?.startTime} - {booking.slot?.endTime}
                        </div>
                        {/* Cancel Button - Only show for pending or confirmed bookings */}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelBookingMutation.isPending}
                            className="glass-effect border-destructive text-destructive hover:bg-destructive/20 mt-2"
                            data-testid={`button-cancel-booking-${booking.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Popular Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="text-gradient">Popular Services</span>
            </h2>
            <Link href="/services">
              <Button
                variant="outline"
                className="glass-effect border-border hover:bg-white/20"
                data-testid="button-view-all-services"
              >
                View All Services
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-effect p-8 rounded-3xl animate-pulse">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-2xl"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : (
              services?.slice(0, 6).map((service: any) => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="glass-effect p-12 rounded-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              What would you like to do today?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/booking">
                <Button
                  className="w-full ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300"
                  data-testid="button-quick-book"
                >
                  Quick Book
                </Button>
              </Link>
              <Link href="/services">
                <Button
                  variant="outline"
                  className="w-full glass-effect border-border hover:bg-white/20 py-4 rounded-xl font-semibold text-lg"
                  data-testid="button-browse-services"
                >
                  Browse Services
                </Button>
              </Link>
              <Link href="/comparison">
                <Button
                  variant="outline"
                  className="w-full glass-effect border-border hover:bg-white/20 py-4 rounded-xl font-semibold text-lg"
                  data-testid="button-compare-packages"
                >
                  Compare Packages
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
