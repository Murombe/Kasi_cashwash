import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BookingModal from "./BookingModal";
import { Car, Clock, Star, Sparkles } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  category: string;
  features?: string[];
}

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'premium':
        return <Sparkles className="text-white" />;
      case 'detailing':
        return <Star className="text-white" />;
      default:
        return <Car className="text-white" />;
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'premium':
        return 'from-primary to-accent';
      case 'detailing':
        return 'from-accent to-secondary';
      default:
        return 'from-green-500 to-primary';
    }
  };

  return (
    <>
      <div className="service-card group">
        <div className="service-card-inner glass-effect p-8 rounded-3xl floating-card relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(service.category)}/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-16 h-16 bg-gradient-to-r ${getCategoryGradient(service.category)} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                {getCategoryIcon(service.category)}
              </div>
              <Badge 
                variant="secondary" 
                className="bg-muted/50 text-muted-foreground capitalize"
                data-testid={`service-category-${service.id}`}
              >
                {service.category}
              </Badge>
            </div>

            <h3 className="text-2xl font-bold mb-4" data-testid={`service-name-${service.id}`}>
              {service.name}
            </h3>
            <p className="text-muted-foreground mb-6" data-testid={`service-description-${service.id}`}>
              {service.description}
            </p>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-gradient" data-testid={`service-price-${service.id}`}>
                  R{service.price}
                </span>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span data-testid={`service-duration-${service.id}`}>{service.duration} min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {service.features.slice(0, 3).map((feature, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-xs border-primary/30 text-primary"
                      data-testid={`service-feature-${service.id}-${index}`}
                    >
                      {feature}
                    </Badge>
                  ))}
                  {service.features.length > 3 && (
                    <Badge variant="outline" className="text-xs border-muted text-muted-foreground">
                      +{service.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <div className="flex text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-sm text-muted-foreground">4.9 (124)</span>
              </div>
              <Button
                onClick={() => setIsBookingModalOpen(true)}
                className={`ripple-effect bg-gradient-to-r ${getCategoryGradient(service.category)} text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300`}
                data-testid={`button-quick-book-${service.id}`}
              >
                Quick Book
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedService={service}
      />
    </>
  );
}
