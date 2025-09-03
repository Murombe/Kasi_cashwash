import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/admin/Sidebar";
import { GlassCard } from "@/components/ui/glass-card";
import { FloatingCard } from "@/components/ui/floating-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, Filter, Calendar, Clock, Car, User, DollarSign, CheckCircle, XCircle, AlertCircle, PlayCircle, CreditCard, Banknote } from "lucide-react";

interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  slotId: string;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  manufacturingYear: number;
  registrationPlate: string;
  status: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  service?: {
    name: string;
    duration: number;
  };
  slot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export default function AdminBookings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && user?.role === 'admin',
  }) as { data: Booking[]; isLoading: boolean };

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully.",
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
        description: error.message || "Failed to update booking status.",
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiRequest("PUT", `/api/bookings/${id}/payment-status`, { paymentStatus: 'completed' });
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed",
        description: "Payment has been marked as completed.",
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
        description: error.message || "Failed to confirm payment.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (bookingId: string, newStatus: string) => {
    updateBookingStatusMutation.mutate({ id: bookingId, status: newStatus });
  };

  const handlePaymentConfirmation = (bookingId: string) => {
    confirmPaymentMutation.mutate({ id: bookingId });
  };

  const getPaymentMethodIcon = (method: string) => {
    return method === 'card' ? <CreditCard className="w-4 h-4" /> : <Banknote className="w-4 h-4" />;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'confirmed':
        return <PlayCircle className="w-5 h-5 text-blue-400" />;
      case 'in-progress':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400';
      case 'in-progress':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getUserDisplayName = (booking: Booking) => {
    if (booking.user?.firstName && booking.user?.lastName) {
      return `${booking.user.firstName} ${booking.user.lastName}`;
    }
    if (booking.user?.firstName) {
      return booking.user.firstName;
    }
    return booking.user?.email?.split('@')[0] || 'Unknown User';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and sort bookings
  const allBookings = (bookings as Booking[]) || [];
  const filteredBookings = allBookings.filter((booking: Booking) => {
    const matchesSearch =
      booking.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicleBrand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicleModel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.registrationPlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getUserDisplayName(booking).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedBookings = filteredBookings.sort((a: Booking, b: Booking) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "amount-high":
        return parseFloat(b.totalAmount) - parseFloat(a.totalAmount);
      case "amount-low":
        return parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
      case "service":
        return (a.service?.name || '').localeCompare(b.service?.name || '');
      default: // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Calculate statistics
  const totalBookings = (bookings as Booking[])?.length || 0;
  const pendingBookings = (bookings as Booking[])?.filter((b: Booking) => b.status === 'pending').length || 0;
  const confirmedBookings = (bookings as Booking[])?.filter((b: Booking) => b.status === 'confirmed').length || 0;
  const completedBookings = (bookings as Booking[])?.filter((b: Booking) => b.status === 'completed').length || 0;
  const totalRevenue = (bookings as Booking[])?.reduce((sum: number, booking: Booking) =>
    sum + parseFloat(booking.totalAmount || '0'), 0) || 0;

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

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Booking Management</span>
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage all customer bookings and appointments
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Calendar className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient" data-testid="total-bookings-stat">
              {totalBookings}
            </div>
            <div className="text-sm text-muted-foreground">Total Bookings</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Clock className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient" data-testid="pending-bookings-stat">
              {pendingBookings}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <PlayCircle className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient" data-testid="confirmed-bookings-stat">
              {confirmedBookings}
            </div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <CheckCircle className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient" data-testid="completed-bookings-stat">
              {completedBookings}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <DollarSign className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient" data-testid="total-revenue-stat">
              R{totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-effect border-border"
                data-testid="input-search-bookings"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="glass-effect border-border w-48" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="glass-effect border-border w-48" data-testid="select-sort-bookings">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="amount-high">Highest Amount</SelectItem>
                <SelectItem value="amount-low">Lowest Amount</SelectItem>
                <SelectItem value="service">By Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 text-sm text-muted-foreground" data-testid="filtered-bookings-count">
            Showing {sortedBookings?.length || 0} of {totalBookings} bookings
          </div>
        </GlassCard>

        {/* Bookings List */}
        <div className="space-y-4">
          {bookingsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <GlassCard key={i} className="p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </GlassCard>
            ))
          ) : sortedBookings?.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search criteria or filters"
                  : "No bookings have been made yet"
                }
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </GlassCard>
          ) : (
            sortedBookings?.map((booking: Booking) => (
              <FloatingCard key={booking.id} className="p-6" data-testid={`booking-card-${booking.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                      <Car className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-lg" data-testid={`booking-service-${booking.id}`}>
                          {booking.service?.name || 'Service'}
                        </h3>
                        <Badge className={getStatusColor(booking.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(booking.status)}
                            <span className="capitalize">{booking.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span data-testid={`booking-customer-${booking.id}`}>
                              {getUserDisplayName(booking)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Car className="w-4 h-4" />
                            <span data-testid={`booking-vehicle-${booking.id}`}>
                              {booking.vehicleBrand} {booking.vehicleModel} ({booking.registrationPlate})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`booking-date-${booking.id}`}>
                              {booking.slot?.date} at {booking.slot?.startTime} - {booking.slot?.endTime}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{booking.service?.duration || 0} min</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            {getPaymentMethodIcon(booking.paymentMethod || 'cash')}
                            <span className="capitalize">{booking.paymentMethod || 'cash'} Payment</span>
                          </div>
                          <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                            <span className="capitalize">{booking.paymentStatus}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gradient mb-2" data-testid={`booking-amount-${booking.id}`}>
                      R{booking.totalAmount}
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">
                      {formatDate(booking.createdAt)}
                    </div>

                    {/* Status Update Buttons */}
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        {booking.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            disabled={updateBookingStatusMutation.isPending}
                            className="ripple-effect bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            data-testid={`button-confirm-${booking.id}`}
                          >
                            Confirm
                          </Button>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'in-progress')}
                            disabled={updateBookingStatusMutation.isPending}
                            className="ripple-effect bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                            data-testid={`button-start-${booking.id}`}
                          >
                            Start
                          </Button>
                        )}
                        {booking.status === 'in-progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            disabled={updateBookingStatusMutation.isPending}
                            className="ripple-effect bg-gradient-to-r from-green-500 to-green-600 text-white"
                            data-testid={`button-complete-${booking.id}`}
                          >
                            Complete
                          </Button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            disabled={updateBookingStatusMutation.isPending}
                            className="glass-effect border-destructive text-destructive hover:bg-destructive/20"
                            data-testid={`button-cancel-${booking.id}`}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Payment Confirmation Button */}
                      {booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handlePaymentConfirmation(booking.id)}
                          disabled={confirmPaymentMutation.isPending}
                          className="ripple-effect bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          data-testid={`button-confirm-payment-${booking.id}`}
                        >
                          <Banknote className="w-4 h-4 mr-1" />
                          Confirm Cash Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </FloatingCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
