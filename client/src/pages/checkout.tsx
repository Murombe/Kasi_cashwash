import { useEffect, useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation } from 'wouter';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Banknote, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface BookingDetails {
  id: string;
  service: {
    name: string;
    price: string;
    duration: number;
  };
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  vehicleModel: string;
  vehicleBrand: string;
}

const CheckoutForm = ({
  bookingDetails,
  paymentMethod,
  onSuccess
}: {
  bookingDetails: BookingDetails;
  paymentMethod: string;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'cash') {
      // Handle cash payment
      setIsProcessing(true);
      try {
        await apiRequest('POST', '/api/create-payment-intent', {
          amount: bookingDetails.service.price,
          paymentMethod: 'cash',
          bookingId: bookingDetails.id,
        });

        toast({
          title: "Booking Confirmed!",
          description: "Your cash payment booking has been confirmed. Please bring exact change on the day of service.",
        });
        onSuccess();
      } catch (error) {
        toast({
          title: "Booking Failed",
          description: "Failed to confirm cash booking. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Handle card payment
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?booking_id=${bookingDetails.id}`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again with a different payment method.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <PaymentElement />
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isProcessing || (paymentMethod === 'card' && (!stripe || !elements))}
        data-testid="button-confirm-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {paymentMethod === 'cash' ? (
              <>
                <Banknote className="w-4 h-4 mr-2" />
                Confirm Cash Booking
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay R{bookingDetails.service.price}
              </>
            )}
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get booking ID from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const bookingId = urlParams.get('booking_id');

  useEffect(() => {
    if (!bookingId) {
      // Silently redirect to booking page without showing error toast
      // This prevents the error from showing on page load
      setLocation('/booking');
      return;
    }

    // Load booking details
    const loadBookingDetails = async () => {
      try {
        const response = await apiRequest('GET', `/api/bookings/${bookingId}`);
        const bookingData = await response.json();

        // Transform the booking data to match our interface
        const transformedBooking: BookingDetails = {
          id: bookingData.id,
          service: bookingData.service || {
            name: "Car Wash Service",
            price: bookingData.totalAmount,
            duration: 60
          },
          slot: bookingData.slot || {
            date: new Date().toISOString().split('T')[0],
            startTime: "10:00",
            endTime: "11:00"
          },
          vehicleModel: bookingData.vehicleModel,
          vehicleBrand: bookingData.vehicleBrand
        };

        setBookingDetails(transformedBooking);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading booking:', error);
        toast({
          title: "Error",
          description: "Failed to load booking details. Please try again.",
          variant: "destructive",
        });
        setLocation('/booking');
      }
    };

    loadBookingDetails();
  }, [bookingId, setLocation, toast]);

  useEffect(() => {
    if (bookingDetails && paymentMethod === 'card') {
      // Create payment intent for card payments
      const createPaymentIntent = async () => {
        try {
          const response = await apiRequest('POST', '/api/create-payment-intent', {
            amount: bookingDetails.service.price,
            paymentMethod: 'card',
            bookingId: bookingDetails.id,
          });
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (error) {
          toast({
            title: "Payment Setup Failed",
            description: "Unable to initialize payment. Please try again.",
            variant: "destructive",
          });
        }
      };

      createPaymentIntent();
    }
  }, [bookingDetails, paymentMethod, toast]);

  const handleSuccess = () => {
    setLocation('/checkout/success?booking_id=' + bookingId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <GlassCard className="p-12 max-w-md mx-auto">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-lg font-semibold">Loading booking details...</div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <GlassCard className="p-12 max-w-md mx-auto">
                <div className="text-lg font-semibold text-red-400 mb-4">Booking Not Found</div>
                <Button onClick={() => setLocation('/booking')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Booking
                </Button>
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

      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">Complete Your Booking</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Choose your payment method and confirm your car wash service
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">

              {/* Booking Summary */}
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">Booking Summary</h2>

                <div className="space-y-6">
                  {/* Service Details */}
                  <div className="border-b border-border pb-4">
                    <h3 className="font-semibold text-lg mb-2">{bookingDetails.service.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration: {bookingDetails.service.duration} minutes</span>
                      <span className="text-2xl font-bold text-gradient">R{bookingDetails.service.price}</span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="border-b border-border pb-4">
                    <h4 className="font-semibold mb-2">Appointment</h4>
                    <div className="text-muted-foreground">
                      <div>{new Date(bookingDetails.slot.date).toLocaleDateString('en-ZA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</div>
                      <div>{bookingDetails.slot.startTime} - {bookingDetails.slot.endTime}</div>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div>
                    <h4 className="font-semibold mb-2">Vehicle</h4>
                    <div className="text-muted-foreground">
                      {bookingDetails.vehicleBrand} {bookingDetails.vehicleModel}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-gradient">R{bookingDetails.service.price}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Payment Section */}
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

                {/* Payment Method Selection */}
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: 'cash' | 'card') => setPaymentMethod(value)}
                  className="mb-8"
                >
                  <div className="space-y-4">
                    {/* Cash Payment Option */}
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-white/5 transition-colors">
                      <RadioGroupItem value="cash" id="cash" data-testid="radio-payment-cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Banknote className="w-5 h-5" />
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
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-white/5 transition-colors">
                      <RadioGroupItem value="card" id="card" data-testid="radio-payment-card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-5 h-5" />
                            <div>
                              <div className="font-semibold">Card Payment</div>
                              <div className="text-sm text-muted-foreground">Visa, MasterCard - Secure online payment</div>
                            </div>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400">Secure</Badge>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* Payment Form */}
                {paymentMethod === 'card' && clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#00d4ff',
                          colorBackground: 'rgba(255, 255, 255, 0.1)',
                          colorText: '#ffffff',
                          colorDanger: '#ff6b6b',
                          borderRadius: '12px',
                        },
                      },
                    }}
                  >
                    <CheckoutForm
                      bookingDetails={bookingDetails}
                      paymentMethod={paymentMethod}
                      onSuccess={handleSuccess}
                    />
                  </Elements>
                ) : paymentMethod === 'cash' ? (
                  <CheckoutForm
                    bookingDetails={bookingDetails}
                    paymentMethod={paymentMethod}
                    onSuccess={handleSuccess}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Setting up secure payment...</p>
                  </div>
                )}

                {/* Back Button */}
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/booking')}
                  className="w-full mt-4"
                  data-testid="button-back-to-booking"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Booking
                </Button>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}