import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ReviewCard from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/ui/glass-card";
import { Star, TrendingUp, Users, Award } from "lucide-react";

export default function Reviews() {
  const [selectedService, setSelectedService] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/reviews", selectedService !== "all" ? selectedService : undefined],
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const sortedReviews = reviews?.sort((a: any, b: any) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "rating-high":
        return b.rating - a.rating;
      case "rating-low":
        return a.rating - b.rating;
      default: // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const averageRating = reviews?.length 
    ? (reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const rating = 5 - i;
    const count = reviews?.filter((review: any) => review.rating === rating).length || 0;
    const percentage = reviews?.length ? (count / reviews.length) * 100 : 0;
    return { rating, count, percentage };
  });

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Customer Reviews</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our satisfied customers have to say about our premium car wash services
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Star className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gradient mb-2" data-testid="average-rating">
                {averageRating}
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gradient mb-2" data-testid="total-reviews">
                {reviews?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-accent to-secondary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gradient mb-2" data-testid="satisfaction-rate">
                98%
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Award className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gradient mb-2" data-testid="five-star-reviews">
                {ratingDistribution[0]?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">5-Star Reviews</div>
            </GlassCard>
          </div>

          {/* Rating Distribution */}
          <GlassCard className="p-8 mb-12">
            <h3 className="text-2xl font-bold mb-6">Rating Distribution</h3>
            <div className="space-y-4">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 w-20">
                    <span className="font-medium">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-muted-foreground" data-testid={`rating-${rating}-count`}>
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Filters */}
          <GlassCard className="p-6 mb-12">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Filter by Service:</span>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="glass-effect border-border w-48" data-testid="select-service-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {services?.map((service: any) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-medium">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="glass-effect border-border w-40" data-testid="select-sort-reviews">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="rating-high">Highest Rating</SelectItem>
                    <SelectItem value="rating-low">Lowest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground" data-testid="filtered-reviews-count">
              Showing {sortedReviews?.length || 0} reviews
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          {reviewsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <GlassCard key={i} className="p-8 animate-pulse">
                  <div className="space-y-4">
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="w-4 h-4 bg-muted rounded"></div>
                      ))}
                    </div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : sortedReviews?.length === 0 ? (
            <div className="text-center py-16">
              <GlassCard className="p-12 max-w-md mx-auto">
                <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No reviews found</h3>
                <p className="text-muted-foreground mb-6">
                  {selectedService !== "all" 
                    ? "No reviews available for the selected service"
                    : "Be the first to leave a review"
                  }
                </p>
                {selectedService !== "all" && (
                  <Button
                    onClick={() => setSelectedService("all")}
                    className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                    data-testid="button-show-all-reviews"
                  >
                    Show All Reviews
                  </Button>
                )}
              </GlassCard>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedReviews?.map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
