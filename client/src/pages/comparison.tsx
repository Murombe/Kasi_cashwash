import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Check, X, Clock, DollarSign } from "lucide-react";

export default function Comparison() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const servicesByCategory = services?.reduce((acc: any, service: any) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});

  const getServiceByCategory = (category: string) => {
    return servicesByCategory?.[category]?.[0] || null;
  };

  const expressService = getServiceByCategory('basic');
  const premiumService = getServiceByCategory('premium'); 
  const detailingService = getServiceByCategory('detailing');

  const comparisonServices = [
    {
      name: "Express Wash",
      price: expressService?.price || "15",
      duration: expressService?.duration || 15,
      service: expressService,
      gradient: "from-green-500 to-primary",
      popular: false
    },
    {
      name: "Premium Wash", 
      price: premiumService?.price || "29",
      duration: premiumService?.duration || 45,
      service: premiumService,
      gradient: "from-primary to-accent",
      popular: true
    },
    {
      name: "Complete Detailing",
      price: detailingService?.price || "99", 
      duration: detailingService?.duration || 180,
      service: detailingService,
      gradient: "from-accent to-secondary",
      popular: false
    }
  ];

  const features = [
    { name: "Exterior Wash", express: true, premium: true, detailing: true },
    { name: "Interior Cleaning", express: false, premium: false, detailing: true },
    { name: "Wax Protection", express: false, premium: true, detailing: true },
    { name: "Tire Shine", express: true, premium: true, detailing: true },
    { name: "Dashboard Cleaning", express: false, premium: false, detailing: true },
    { name: "Leather Conditioning", express: false, premium: false, detailing: true },
    { name: "Ceramic Coating", express: false, premium: false, detailing: true },
    { name: "Engine Bay Cleaning", express: false, premium: false, detailing: true },
    { name: "Fabric Protection", express: false, premium: false, detailing: true },
    { name: "Window Treatment", express: true, premium: true, detailing: true },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="h-12 bg-muted rounded w-64 mx-auto mb-6 animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
            </div>
            <GlassCard className="p-8 animate-pulse">
              <div className="h-96 bg-muted rounded"></div>
            </GlassCard>
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
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Service Comparison</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Compare our services to find the perfect car wash package for your needs
            </p>
          </div>

          {/* Mobile Comparison Cards */}
          <div className="md:hidden space-y-6 mb-12">
            {comparisonServices.map((service, index) => (
              <GlassCard key={index} className="p-6 relative">
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-6 h-6 text-primary" />
                      <span className="text-3xl font-bold text-gradient">${service.price}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground">{service.duration} min</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {features.map((feature) => {
                    const hasFeature = feature[service.name.toLowerCase().split(' ')[0] as keyof typeof feature];
                    return (
                      <div key={feature.name} className="flex items-center justify-between">
                        <span className="text-sm">{feature.name}</span>
                        {hasFeature ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <X className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button 
                  className={`w-full ripple-effect bg-gradient-to-r ${service.gradient} text-primary-foreground`}
                  data-testid={`mobile-select-${service.name.toLowerCase().replace(' ', '-')}`}
                >
                  Select {service.name}
                </Button>
              </GlassCard>
            ))}
          </div>

          {/* Desktop Comparison Table */}
          <div className="hidden md:block">
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary/20 to-accent/20">
                      <th className="text-left p-6 font-bold text-lg">Service Features</th>
                      {comparisonServices.map((service, index) => (
                        <th key={index} className="text-center p-6 font-bold text-lg relative">
                          {service.popular && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                              <div className="bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-xs font-semibold">
                                Most Popular
                              </div>
                            </div>
                          )}
                          <div className="mt-2">
                            {service.name}
                            <br />
                            <span className="text-sm font-normal text-muted-foreground">
                              ${service.price}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border hover:bg-white/5 transition-colors duration-300">
                      <td className="p-6 font-medium">Duration</td>
                      {comparisonServices.map((service, index) => (
                        <td key={index} className="text-center p-6 font-semibold" data-testid={`duration-${service.name.toLowerCase().replace(' ', '-')}`}>
                          {service.duration} min
                        </td>
                      ))}
                    </tr>
                    {features.map((feature) => (
                      <tr key={feature.name} className="border-b border-border hover:bg-white/5 transition-colors duration-300">
                        <td className="p-6 font-medium">{feature.name}</td>
                        <td className="text-center p-6">
                          {feature.express ? (
                            <Check className="w-6 h-6 text-green-400 mx-auto" data-testid={`express-${feature.name.toLowerCase().replace(' ', '-')}`} />
                          ) : (
                            <X className="w-6 h-6 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="text-center p-6">
                          {feature.premium ? (
                            <Check className="w-6 h-6 text-green-400 mx-auto" data-testid={`premium-${feature.name.toLowerCase().replace(' ', '-')}`} />
                          ) : (
                            <X className="w-6 h-6 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="text-center p-6">
                          {feature.detailing ? (
                            <Check className="w-6 h-6 text-green-400 mx-auto" data-testid={`detailing-${feature.name.toLowerCase().replace(' ', '-')}`} />
                          ) : (
                            <X className="w-6 h-6 text-red-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="p-6"></td>
                      {comparisonServices.map((service, index) => (
                        <td key={index} className="text-center p-6">
                          <Button 
                            className={`ripple-effect bg-gradient-to-r ${service.gradient} text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300`}
                            data-testid={`select-${service.name.toLowerCase().replace(' ', '-')}`}
                          >
                            Select
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-gradient">Why Choose Our Services?</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional care with premium quality and exceptional results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Clock className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Time Efficient</h3>
              <p className="text-muted-foreground">
                Quick turnaround times without compromising on quality. Express wash in just 15 minutes.
              </p>
            </GlassCard>

            <GlassCard className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <DollarSign className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Great Value</h3>
              <p className="text-muted-foreground">
                Competitive pricing with transparent costs. No hidden fees, just quality service.
              </p>
            </GlassCard>

            <GlassCard className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-secondary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Check className="text-2xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Quality Guarantee</h3>
              <p className="text-muted-foreground">
                100% satisfaction guarantee. If you're not happy, we'll make it right.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
