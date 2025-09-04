import { Car, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);

    try {
      // Simulate API call - replace with actual endpoint when ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Successfully Subscribed!",
        description: "You'll receive our latest offers and booking reminders",
      });

      setEmail("");
    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="glass-effect p-12 rounded-3xl">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
                  <Car className="text-white text-lg" />
                </div>
                <span className="text-2xl font-bold text-gradient">AquaShine</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="text-primary w-5 h-5" />
                  <span data-testid="contact-phone">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="text-primary w-5 h-5" />
                  <span data-testid="contact-email">hello@aquashine.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="text-primary w-5 h-5" />
                  <span data-testid="contact-address">123 Clean Street, Wash City</span>
                </div>
              </div>
            </div>

            {/* Hours of Operation */}
            <div>
              <h3 className="text-xl font-bold mb-6">Hours of Operation</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="text-primary font-semibold" data-testid="hours-weekday">8:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="text-primary font-semibold" data-testid="hours-saturday">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="text-primary font-semibold" data-testid="hours-sunday">10:00 AM - 5:00 PM</span>
                </div>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="text-xl font-bold mb-6">Stay Updated</h3>
              <p className="text-muted-foreground mb-4">Get exclusive offers and booking reminders</p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-effect border border-border rounded-xl text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="input-newsletter-email"
                  disabled={isSubscribing}
                />
                <Button
                  type="submit"
                  className="w-full ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg transition-all duration-300"
                  data-testid="button-subscribe"
                  disabled={isSubscribing}
                >
                  {isSubscribing ? "Subscribing..." : "Subscribe Now"}
                </Button>
              </form>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="text-muted-foreground text-sm" data-testid="copyright">
              © 2024 AquaShine Car Wash. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="social-facebook"
              >
                <Facebook className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="social-twitter"
              >
                <Twitter className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="social-instagram"
              >
                <Instagram className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors duration-300"
                data-testid="social-linkedin"
              >
                <Linkedin className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
