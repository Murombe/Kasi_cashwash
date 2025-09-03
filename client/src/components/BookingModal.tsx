import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Calendar, Clock, Car } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
}

interface Slot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService?: Service;
}

export default function BookingModal({ isOpen, onClose, selectedService }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingData, setBookingData] = useState({
    vehicleType: "",
    vehicleBrand: "",
    vehicleModel: "",
    manufacturingYear: "",
    registrationPlate: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availableSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["/api/slots/availability", selectedService?.id],
    queryFn: async () => {
      if (!selectedService?.id) return [];
      const response = await fetch(`/api/slots/availability/${selectedService.id}`);
      if (!response.ok) throw new Error('Failed to fetch available slots');
      return response.json();
    },
    enabled: !!selectedService?.id,
  });

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
      onClose();
      resetForm();

      // Redirect to checkout page with booking ID
      window.location.href = `/checkout?booking_id=${result.id}`;
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setStep(1);
    setSelectedSlot(null);
    setBookingData({
      vehicleType: "",
      vehicleBrand: "",
      vehicleModel: "",
      manufacturingYear: "",
      registrationPlate: "",
    });
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
    };

    bookingMutation.mutate(bookingPayload);
  };

  const canProceedToStep2 = selectedSlot !== null;
  const canSubmit = Object.values(bookingData).every(value => value !== "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Book Your Service
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
              step >= 1 ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Select Slot</span>
          </div>
          <div className="flex-1 h-1 bg-muted mx-4 rounded-full">
            <div className={`h-1 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ${
              step >= 2 ? 'w-full' : 'w-0'
            }`}></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
              step >= 2 ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Vehicle Details</span>
          </div>
        </div>

        {/* Step 1: Slot Selection */}
        {step === 1 && (
          <div className="space-y-6">
            {selectedService && (
              <div className="glass-effect p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg" data-testid="selected-service-name">
                      {selectedService.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">{selectedService.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gradient" data-testid="selected-service-price">
                      R{selectedService.price}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedService.duration} min
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className="text-base font-semibold mb-4 block">Select Available Time Slot</Label>
              {slotsLoading ? (
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
                  No available slots for this service. Please try again later.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableSlots?.map((slot: Slot) => (
                    <div
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      className={`glass-effect p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedSlot?.id === slot.id
                          ? 'ring-2 ring-primary bg-primary/10'
                          : 'hover:bg-white/10'
                      }`}
                      data-testid={`slot-${slot.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce-subtle"></div>
                          <div>
                            <div className="font-semibold flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{slot.date}</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{slot.startTime} - {slot.endTime}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400">Available</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="glass-effect border-border hover:bg-white/20"
                data-testid="button-cancel-step1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                data-testid="button-continue-step2"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="glass-effect p-4 rounded-xl">
              <h3 className="font-semibold text-lg mb-2">Selected Slot</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{selectedSlot?.date}</span>
                  <Clock className="w-5 h-5 text-primary" />
                  <span>{selectedSlot?.startTime} - {selectedSlot?.endTime}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  data-testid="button-change-slot"
                >
                  Change
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex justify-between space-x-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="glass-effect border-border hover:bg-white/20"
                data-testid="button-back-step1"
              >
                Back
              </Button>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="glass-effect border-border hover:bg-white/20"
                  data-testid="button-cancel-step2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || bookingMutation.isPending}
                  className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  data-testid="button-confirm-booking"
                >
                  {bookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
