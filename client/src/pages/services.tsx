import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

export default function Services() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const categories = [
    { id: "all", label: "All Services" },
    { id: "basic", label: "Basic Wash" },
    { id: "premium", label: "Premium" },
    { id: "detailing", label: "Detailing" },
  ];

  const sortOptions = [
    { id: "name", label: "Name" },
    { id: "price", label: "Price" },
    { id: "duration", label: "Duration" },
    { id: "category", label: "Category" },
  ];

  const filteredServices = services?.filter((service: any) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedServices = filteredServices?.sort((a: any, b: any) => {
    switch (sortBy) {
      case "price":
        return parseFloat(a.price) - parseFloat(b.price);
      case "duration":
        return a.duration - b.duration;
      case "category":
        return a.category.localeCompare(b.category);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Premium Services</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience professional car care with our comprehensive range of services
            </p>
          </div>

          {/* Search and Filters */}
          <div className="glass-effect p-6 rounded-3xl mb-12">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-effect border-border"
                  data-testid="input-search-services"
                />
              </div>

              {/* Category Filter */}
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`${
                      selectedCategory === category.id
                        ? "ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                        : "glass-effect border-border hover:bg-white/10"
                    } transition-all duration-300`}
                    data-testid={`filter-category-${category.id}`}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="text-muted-foreground w-5 h-5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="glass-effect border border-border rounded-lg px-3 py-2 text-foreground bg-transparent"
                  data-testid="select-sort-by"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-background">
                      Sort by {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-muted-foreground" data-testid="services-count">
              {filteredServices?.length || 0} services found
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-effect p-8 rounded-3xl animate-pulse">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-2xl"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="flex justify-between">
                      <div className="h-8 bg-muted rounded w-20"></div>
                      <div className="h-8 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedServices?.length === 0 ? (
            <div className="text-center py-16">
              <div className="glass-effect p-12 rounded-3xl max-w-md mx-auto">
                <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No services found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or filters
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedServices?.map((service: any) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Service Categories Info */}
      <section className="py-24 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-gradient">Service Categories</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Choose the perfect service level for your vehicle's needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-effect p-8 rounded-3xl text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl text-white font-bold">B</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Basic Wash</h3>
              <p className="text-muted-foreground mb-6">
                Quick and affordable exterior cleaning perfect for regular maintenance
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Exterior wash & rinse</li>
                <li>• Tire cleaning</li>
                <li>• Basic drying</li>
                <li>• 15-30 minutes</li>
              </ul>
            </div>

            <div className="glass-effect p-8 rounded-3xl text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl text-white font-bold">P</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium</h3>
              <p className="text-muted-foreground mb-6">
                Comprehensive cleaning with protective treatments for enhanced shine
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Everything in Basic</li>
                <li>• Wax protection</li>
                <li>• Interior vacuum</li>
                <li>• 45-90 minutes</li>
              </ul>
            </div>

            <div className="glass-effect p-8 rounded-3xl text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-secondary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl text-white font-bold">D</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Detailing</h3>
              <p className="text-muted-foreground mb-6">
                Professional detailing service for the ultimate car care experience
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Full interior & exterior</li>
                <li>• Ceramic coating</li>
                <li>• Leather conditioning</li>
                <li>• 2-4 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
