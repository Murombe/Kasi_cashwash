import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useRouter } from 'wouter';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Check, Calendar, Clock, Car, Home } from 'lucide-react';

export default function CheckoutSuccess() {
  const [location] = useLocation();
  const [, navigate] = useRouter();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Get booking and payment details from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const bookingId = urlParams.get('booking_id');
  const paymentIntentId = urlParams.get('payment_intent');

  useEffect(() => {
    if (!bookingId) {
      toast({
        title: "Invalid Request",
        description: "No booking information found. Redirecting to booking page.",
        variant: "destructive",
      });
      router('/booking');
      return;
    }

    const confirmPayment = async () => {
      try {
        if (paymentIntentId) {
          // Confirm card payment with Stripe
          await apiRequest('POST', '/api/confirm-payment', {
            bookingId,
            paymentIntentId,
          });
        }
        
        setBookingConfirmed(true);
        toast({
          title: "Payment Successful!",
          description: "Your booking has been confirmed. You'll receive a confirmation email shortly.",
        });
      } catch (error) {
        toast({
          title: "Payment Confirmation Failed",
          description: "There was an issue confirming your payment. Please contact support.",
          variant: "destructive",
        });
        navigate('/booking');
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [bookingId, paymentIntentId, router, toast]);

  if (isConfirming) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <GlassCard className="p-12 max-w-md mx-auto">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-lg font-semibold">Confirming your payment...</div>
                <p className="text-muted-foreground mt-2">Please wait while we process your booking</p>
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
          <div className="max-w-2xl mx-auto text-center">
            
            {/* Success Message */}
            <GlassCard className="p-12 mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">Booking Confirmed!</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8">
                Thank you for choosing AquaShine! Your car wash service has been successfully booked.
              </p>

              {/* Booking Reference */}
              <div className="bg-white/5 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-2">Booking Reference</h3>
                <div className="font-mono text-2xl text-primary font-bold">
                  #{bookingId?.slice(-8).toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Please keep this reference number for your records
                </p>
              </div>

              {/* What's Next */}
              <div className="text-left space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-center mb-4">What happens next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-sm font-bold">1</span>
                    </div>
                    <div>
                      <div className="font-semibold">Confirmation Email</div>
                      <div className="text-sm text-muted-foreground">
                        You'll receive a confirmation email with all booking details
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-sm font-bold">2</span>
                    </div>
                    <div>
                      <div className="font-semibold">Reminder Call</div>
                      <div className="text-sm text-muted-foreground">
                        We'll call you 24 hours before your appointment
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-sm font-bold">3</span>
                    </div>
                    <div>
                      <div className="font-semibold">Service Day</div>
                      <div className="text-sm text-muted-foreground">
                        Arrive 10 minutes early with your vehicle keys
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router('/')}
                  className="bg-gradient-to-r from-primary to-accent text-white"
                  data-testid="button-go-home"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router('/booking')}
                  data-testid="button-book-another"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Another Service
                </Button>
              </div>
            </GlassCard>

            {/* Contact Information */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
              <p className="text-muted-foreground mb-4">
                If you have any questions about your booking or need to make changes, 
                don't hesitate to contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Mon-Sat: 8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4" />
                  <span>Phone: +27 11 123 4567</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}