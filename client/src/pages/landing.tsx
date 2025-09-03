import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Car, Star, Clock, Shield, Play, ArrowRight } from "lucide-react";

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "GENTLE ON YOUR CAR",
      subtitle: "POWERFUL ON CLEAN",
      description: "Experience premium car wash services with eco-friendly products and cutting-edge technology",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080"
    },
    {
      title: "PROFESSIONAL DETAILING",
      subtitle: "EXPERT CARE",
      description: "Our certified technicians provide meticulous attention to every detail of your vehicle",
      image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080"
    },
    {
      title: "CONVENIENT BOOKING",
      subtitle: "INSTANT SCHEDULING",
      description: "Book your preferred time slot with our easy-to-use online booking system",
      image: "https://images.unsplash.com/photo-1486839230200-c87b5ac82def?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(30, 58, 138, 0.6)), url('${slide.image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10 animate-fade-in">
          <div className="glass-effect p-12 rounded-3xl max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              <span className="text-gradient">{heroSlides[currentSlide].title.split(' ')[0]}</span> {heroSlides[currentSlide].title.split(' ').slice(1).join(' ')}<br/>
              <span className="text-gradient">{heroSlides[currentSlide].subtitle.split(' ')[0]}</span> {heroSlides[currentSlide].subtitle.split(' ').slice(1).join(' ')}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {heroSlides[currentSlide].description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/services">
                <Button
                  className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 min-w-[200px]"
                  data-testid="button-explore-services"
                >
                  Explore Services
                </Button>
              </Link>
              <Button
                variant="outline"
                className="glass-effect text-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 min-w-[200px]"
                data-testid="button-watch-demo"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
            
            {/* Live Service Availability Indicator */}
            <div className="mt-8 flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce-subtle"></div>
                <span className="text-sm font-medium" data-testid="text-available-slots">12 Slots Available Today</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-glow"></div>
                <span className="text-sm font-medium" data-testid="text-fast-service">Fast 30-min Service</span>
              </div>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-primary' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  data-testid={`slide-indicator-${index}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Floating animated elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-float blur-sm"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full animate-float blur-sm" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-secondary/20 rounded-full animate-float blur-sm" style={{ animationDelay: '-4s' }}></div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Why Choose AquaShine?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional car care with premium quality and exceptional service
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-effect p-8 rounded-3xl floating-card text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Shield className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium Quality</h3>
              <p className="text-muted-foreground">
                We use only the finest eco-friendly products and state-of-the-art equipment for superior results.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-3xl floating-card text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-secondary to-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Clock className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Fast & Efficient</h3>
              <p className="text-muted-foreground">
                Quick turnaround times without compromising on quality. Most services completed in under an hour.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-3xl floating-card text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-secondary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Star className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Expert Service</h3>
              <p className="text-muted-foreground">
                Our certified technicians are trained to handle all vehicle types with meticulous attention to detail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="glass-effect p-12 rounded-3xl">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-6xl font-bold text-gradient mb-2" data-testid="stat-customers">5,000+</div>
                <div className="text-muted-foreground">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl md:text-6xl font-bold text-gradient mb-2" data-testid="stat-services">15,000+</div>
                <div className="text-muted-foreground">Services Completed</div>
              </div>
              <div>
                <div className="text-4xl md:text-6xl font-bold text-gradient mb-2" data-testid="stat-rating">4.9</div>
                <div className="text-muted-foreground">Average Rating</div>
              </div>
              <div>
                <div className="text-4xl md:text-6xl font-bold text-gradient mb-2" data-testid="stat-experience">10+</div>
                <div className="text-muted-foreground">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="glass-effect p-12 rounded-3xl max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Give Your Car the <span className="text-gradient">Premium Treatment</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust AquaShine for their car care needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button
                  className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300"
                  data-testid="button-get-started"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button
                  variant="outline"
                  className="glass-effect text-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300"
                  data-testid="button-view-services"
                >
                  View Services
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
