import { Star, User } from "lucide-react";
import { FloatingCard } from "@/components/ui/floating-card";

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  };
  service: {
    name: string;
  };
  createdAt: string;
}

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? "text-yellow-400 fill-current" 
            : "text-muted-foreground"
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserDisplayName = () => {
    if (review.user.firstName && review.user.lastName) {
      return `${review.user.firstName} ${review.user.lastName}`;
    }
    if (review.user.firstName) {
      return review.user.firstName;
    }
    return review.user.email?.split('@')[0] || 'Anonymous User';
  };

  return (
    <FloatingCard className="p-8" data-testid={`review-card-${review.id}`}>
      <div className="flex items-center mb-6">
        <div className="flex text-yellow-400 mr-4" data-testid={`review-rating-${review.id}`}>
          {renderStars(review.rating)}
        </div>
        <span className="text-sm text-muted-foreground">{review.rating}.0</span>
      </div>
      
      <p className="text-lg mb-6 leading-relaxed" data-testid={`review-comment-${review.id}`}>
        {review.comment}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {review.user.profileImageUrl ? (
            <img 
              src={review.user.profileImageUrl} 
              alt="Customer photo" 
              className="w-12 h-12 rounded-full object-cover"
              data-testid={`review-avatar-${review.id}`}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <User className="text-white w-6 h-6" />
            </div>
          )}
          <div>
            <div className="font-semibold" data-testid={`review-user-name-${review.id}`}>
              {getUserDisplayName()}
            </div>
            <div className="text-sm text-muted-foreground" data-testid={`review-service-${review.id}`}>
              {review.service.name}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground" data-testid={`review-date-${review.id}`}>
            {formatDate(review.createdAt)}
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}
