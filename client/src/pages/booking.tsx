import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { FloatingCard } from "@/components/ui/floating-card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Calendar, Clock, Car, ChevronLeft, ChevronRight, Check, X, CreditCard, Banknote, AlertTriangle } from "lucide-react";
import { format, differenceInMinutes, parseISO, addMinutes } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect } from "react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  category: string;
}

interface Slot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export default function Booking() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [cancelledBookingIds, setCancelledBookingIds] = useState<string[]>([]);
  const [bookingData, setBookingData] = useState({
    vehicleType: "",
    vehicleBrand: "",
    vehicleModel: "",
    manufacturingYear: "",
    registrationPlate: "",
    paymentMethod: "cash",
  });

  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
  }) as { data: Service[]; isLoading: boolean };

  const { data: availableSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["/api/slots", selectedService?.id, selectedDate],
    queryFn: async () => {
      if (!selectedService?.id) return [];
      const url = selectedDate
        ? `/api/slots?serviceId=${selectedService.id}&date=${selectedDate}`
        : `/api/slots?serviceId=${selectedService.id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch slots');
      return response.json();
    },
    enabled: !!selectedService?.id,
  });

  const { data: userBookings = [] } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated,
  }) as { data: any[] };

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a service.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 1500);
    }
  }, [isAuthenticated, toast]);

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Booking Created!",
        description: "Redirecting to payment...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slots/availability"] });

      // Redirect to checkout with booking ID
      setLocation(`/checkout?booking_id=${result.id}`);
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
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("PUT", `/api/bookings/${bookingId}/cancel`, {});
    },
    onSuccess: async (data, variables) => {
      // Immediately remove from UI
      setCancelledBookingIds(prev => {
        const updated = [...prev, variables];
        console.log('Adding cancelled booking ID:', variables, 'Updated list:', updated);
        return updated;
      });

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });

      // Force immediate refresh of bookings data
      await queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      await queryClient.refetchQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slots/availability"] });
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

  // Time-based logic for bookings
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const getBookingTimeStatus = (booking: any) => {
    if (!booking.slot?.date || !booking.slot?.startTime) return null;

    const serviceDateTime = new Date(`${booking.slot.date}T${booking.slot.startTime}`);
    const minutesDiff = differenceInMinutes(serviceDateTime, currentTime);

    // 30 minutes before service - show countdown
    if (minutesDiff > 0 && minutesDiff <= 30) {
      return { type: 'countdown', minutes: minutesDiff, message: `Service starts in ${minutesDiff} minutes` };
    }

    // Service has started but within 15 minutes - show late warning
    if (minutesDiff < 0 && minutesDiff >= -15) {
      const minutesLate = Math.abs(minutesDiff);
      return { type: 'late', minutes: minutesLate, message: `You are ${minutesLate} minutes late!` };
    }

    // More than 15 minutes late - should be auto-cancelled
    if (minutesDiff < -15) {
      return { type: 'auto-cancel', minutes: Math.abs(minutesDiff), message: 'Service auto-cancelled due to no-show' };
    }

    return null;
  };

  const resetBooking = () => {
    setSelectedService(null);
    setSelectedDate("");
    setSelectedSlot(null);
    setBookingData({
      vehicleType: "",
      vehicleBrand: "",
      vehicleModel: "",
      manufacturingYear: "",
      registrationPlate: "",
      paymentMethod: "cash",
    });
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const isPast = date < today;
      const isToday = date.toDateString() === today.toDateString();
      const dateString = date.toISOString().split('T')[0];

      days.push({
        day,
        date: dateString,
        isPast,
        isToday,
        isSelected: selectedDate === dateString
      });
    }

    return days;
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleInputChange = (field: string, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!selectedService || !selectedSlot) return;

    const bookingPayload = {
      serviceId: selectedService.id,
      slotId: selectedSlot.id,
      vehicleType: bookingData.vehicleType,
      vehicleBrand: bookingData.vehicleBrand,
      vehicleModel: bookingData.vehicleModel,
      manufacturingYear: parseInt(bookingData.manufacturingYear),
      registrationPlate: bookingData.registrationPlate,
      totalAmount: selectedService.price,
      paymentMethod: bookingData.paymentMethod, // Include the selected payment method
    };

    bookingMutation.mutate(bookingPayload);
  };

  const canSubmit = selectedService && selectedSlot && Object.values(bookingData).every(value => value !== "");

  const calendarDays = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <GlassCard className="p-12 max-w-md mx-auto">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-lg font-semibold">Redirecting to sign in...</div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Header Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Book Your Service</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your preferred service and time slot for the ultimate car care experience
            </p>
          </div>

          {/* Recent Bookings - Hide for admin users */}
          {(() => {
            // Don't show recent bookings for admin users
            if (user?.role === 'admin') return null;

            // Filter out cancelled bookings from both server data and local state
            const filteredBookings = userBookings?.filter((booking: any) => {
              const isNotCancelled = booking.status !== 'cancelled';
              const isNotInCancelledList = !cancelledBookingIds.includes(booking.id);
              console.log('Filtering booking:', booking.id, 'status:', booking.status, 'isNotCancelled:', isNotCancelled, 'isNotInCancelledList:', isNotInCancelledList, 'cancelledIds:', cancelledBookingIds);
              return isNotCancelled && isNotInCancelledList;
            }) || [];

            console.log('Total bookings from API:', userBookings?.length, 'Filtered bookings:', filteredBookings.length);

            if (filteredBookings.length === 0) return null;

            return (
              <GlassCard className="p-6 mb-12">
                <h3 className="text-xl font-bold mb-4">Your Recent Bookings</h3>
                <div className="space-y-3">
                  {filteredBookings.slice(0, 3).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 glass-effect rounded-xl">
                    <div className="flex-1">
                      <div className="font-semibold">{booking.service?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.vehicleBrand} {booking.vehicleModel} • {booking.slot?.date}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={
                          booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                          booking.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                          booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }>
                          {booking.status}
                        </Badge>
                        {booking.paymentMethod && (
                          <Badge className={
                            booking.paymentMethod === 'card' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                          }>
                            {booking.paymentMethod} payment
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-4">
                        <div className="text-lg font-bold text-gradient">R{booking.totalAmount}</div>
                        <div className="text-xs text-muted-foreground">
                          {booking.slot?.startTime} - {booking.slot?.endTime}
                        </div>
                        {/* Time-based status alerts */}
                        {(() => {
                          const timeStatus = getBookingTimeStatus(booking);
                          if (!timeStatus) return null;

                          return (
                            <div className={`flex items-center space-x-1 text-xs font-medium mt-1 px-2 py-1 rounded-full ${
                              timeStatus.type === 'countdown' ? 'bg-blue-500/20 text-blue-400' :
                              timeStatus.type === 'late' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                              'bg-red-600/30 text-red-300'
                            }`}>
                              {timeStatus.type === 'late' && <AlertTriangle className="w-3 h-3" />}
                              {timeStatus.type === 'countdown' && <Clock className="w-3 h-3" />}
                              <span>{timeStatus.message}</span>
                            </div>
                          );
                        })()}
                      </div>
                      {/* Cancel Button - Only show for pending or confirmed bookings */}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancelBookingMutation.isPending}
                          className="glass-effect border-destructive text-destructive hover:bg-destructive/20"
                          data-testid={`button-cancel-booking-${booking.id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              </GlassCard>
            );
          })()}

          {/* Step 1: Service Selection */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">
              <span className="flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold mr-3">1</span>
                Choose Your Service
              </span>
            </h2>

            {servicesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <GlassCard key={i} className="p-6 animate-pulse">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-2xl"></div>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services?.map((service: Service) => (
                  <FloatingCard
                    key={service.id}
                    className={`p-6 cursor-pointer transition-all duration-300 ${
                      selectedService?.id === service.id
                        ? 'ring-2 ring-primary bg-primary/10'
                        : 'hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedService(service)}
                    data-testid={`service-card-${service.id}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
                        <Car className="text-white" />
                      </div>
                      {selectedService?.id === service.id && (
                        <Check className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gradient">R{service.price}</span>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{service.duration} min</span>
                      </div>
                    </div>
                  </FloatingCard>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Date & Time Selection */}
          {selectedService && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">
                <span className="flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold mr-3">2</span>
                  Select Date & Time
                </span>
              </h2>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Select Date</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        data-testid="button-prev-month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold text-lg px-4">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        data-testid="button-next-month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-center p-3 text-muted-foreground font-medium">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day, index) => (
                      <div key={index} className="aspect-square">
                        {day && (
                          <button
                            onClick={() => handleDateSelect(day.date)}
                            disabled={day.isPast}
                            className={`w-full h-full p-2 rounded-xl text-center transition-all duration-300 ${
                              day.isPast
                                ? 'text-muted-foreground cursor-not-allowed opacity-50'
                                : day.isSelected
                                ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold'
                                : day.isToday
                                ? 'bg-muted text-foreground font-semibold'
                                : 'hover:bg-white/10'
                            }`}
                            data-testid={`calendar-day-${day.day}`}
                          >
                            {day.day}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Time Slots */}
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold mb-6">Available Time Slots</h3>
                  {!selectedDate ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Please select a date to view available time slots</p>
                    </div>
                  ) : slotsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="glass-effect p-4 rounded-xl animate-pulse">
                          <div className="flex justify-between">
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-32"></div>
                              <div className="h-3 bg-muted rounded w-24"></div>
                            </div>
                            <div className="h-8 bg-muted rounded w-20"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : availableSlots?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No available slots for this date</p>
                      <p className="text-sm">Please try selecting a different date</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {availableSlots?.map((slot: Slot) => (
                        <div
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          className={`glass-effect p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                            selectedSlot?.id === slot.id
                              ? 'ring-2 ring-primary bg-primary/10'
                              : 'hover:bg-white/10'
                          }`}
                          data-testid={`time-slot-${slot.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce-subtle"></div>
                              <div>
                                <div className="font-semibold flex items-center space-x-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{slot.startTime} - {slot.endTime}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {selectedService.name}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-500/20 text-green-400">Available</Badge>
                              {selectedSlot?.id === slot.id && (
                                <Check className="w-5 h-5 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>
          )}

          {/* Step 3: Vehicle Details */}
          {selectedService && selectedSlot && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">
                <span className="flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold mr-3">3</span>
                  Vehicle Details
                </span>
              </h2>

              <GlassCard className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select
                      value={bookingData.vehicleType}
                      onValueChange={(value) => handleInputChange('vehicleType', value)}
                    >
                      <SelectTrigger className="glass-effect border-border" data-testid="select-vehicle-type">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vehicleBrand">Vehicle Brand</Label>
                    <Select
                      value={bookingData.vehicleBrand}
                      onValueChange={(value) => handleInputChange('vehicleBrand', value)}
                    >
                      <SelectTrigger className="glass-effect border-border" data-testid="select-vehicle-brand">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Toyota">Toyota</SelectItem>
                        <SelectItem value="Honda">Honda</SelectItem>
                        <SelectItem value="Ford">Ford</SelectItem>
                        <SelectItem value="BMW">BMW</SelectItem>
                        <SelectItem value="Mercedes">Mercedes</SelectItem>
                        <SelectItem value="Audi">Audi</SelectItem>
                        <SelectItem value="Nissan">Nissan</SelectItem>
                        <SelectItem value="Hyundai">Hyundai</SelectItem>
                        <SelectItem value="Tata">Tata</SelectItem>
                        <SelectItem value="Runner">Runner</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vehicleModel">Vehicle Model</Label>
                    <Input
                      id="vehicleModel"
                      placeholder="e.g., Camry"
                      value={bookingData.vehicleModel}
                      onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                      className="glass-effect border-border"
                      data-testid="input-vehicle-model"
                    />
                  </div>

                  <div>
                    <Label htmlFor="manufacturingYear">Manufacturing Year</Label>
                    <Input
                      id="manufacturingYear"
                      type="number"
                      placeholder="2020"
                      value={bookingData.manufacturingYear}
                      onChange={(e) => handleInputChange('manufacturingYear', e.target.value)}
                      className="glass-effect border-border"
                      data-testid="input-manufacturing-year"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="registrationPlate">Registration Plate</Label>
                    <Input
                      id="registrationPlate"
                      placeholder="ABC123"
                      value={bookingData.registrationPlate}
                      onChange={(e) => handleInputChange('registrationPlate', e.target.value)}
                      className="glass-effect border-border"
                      data-testid="input-registration-plate"
                    />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mt-8 p-6 glass-effect rounded-xl">
                  <h4 className="text-lg font-semibold mb-4">Payment Method</h4>
                  <RadioGroup
                    value={bookingData.paymentMethod}
                    onValueChange={(value: 'cash' | 'card') => handleInputChange('paymentMethod', value)}
                    className="space-y-4"
                  >
                    {/* Cash Payment Option */}
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-white/5 transition-colors">
                      <RadioGroupItem value="cash" id="cash" data-testid="radio-payment-cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Banknote className="w-5 h-5 text-green-500" />
                            <div>
                              <div className="font-semibold">Cash Payment</div>
                              <div className="text-sm text-muted-foreground">Pay on-site with South African Rand</div>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Popular</Badge>
                        </div>
                      </Label>
                    </div>

                    {/* Card Payment Option */}
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-white/5 transition-colors">
                      <RadioGroupItem value="card" id="card" data-testid="radio-payment-card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                            <div>
                              <div className="font-semibold">Card Payment</div>
                              <div className="text-sm text-muted-foreground">Visa, MasterCard - Secure online payment</div>
                            </div>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400">Secure</Badge>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Booking Summary */}
                <div className="mt-8 pt-8 border-t border-border">
                  <h4 className="text-lg font-semibold mb-4">Booking Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span className="font-medium">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date & Time:</span>
                      <span className="font-medium">
                        {selectedDate} at {selectedSlot.startTime} - {selectedSlot.endTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{selectedService.duration} minutes</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-gradient">R{selectedService.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={resetBooking}
                    className="glass-effect border-border hover:bg-white/20"
                    data-testid="button-reset-booking"
                  >
                    Start Over
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || bookingMutation.isPending}
                    className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground px-8"
                    data-testid="button-confirm-booking"
                  >
                    {bookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
