import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, User } from "lucide-react";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export default function RatingModal({ isOpen, onClose, booking }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available staff for rating
  const { data: staffList = [] } = useQuery({
    queryKey: ["/api/staff/public"],
    enabled: isOpen
  });

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reviews", {
        bookingId: booking.id,
        serviceId: booking.serviceId,
        staffId: selectedStaffId || undefined,
        rating,
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      onClose();
      setRating(0);
      setComment("");
      setSelectedStaffId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Your rating helps us improve our service",
        variant: "destructive",
      });
      return;
    }
    submitRatingMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gradient">
            Rate Your Service
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-2">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{booking?.service?.name}</h3>
          </div>

          {/* Staff Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Rate a Staff Member (Optional)</label>
            </div>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select a staff member to rate" />
              </SelectTrigger>
              <SelectContent className="glass-effect border-border">
                {staffList.map((staff: any) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{staff.name} - {staff.role}</span>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">{staff.rating}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              How was your experience with this service?
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-all duration-200 hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-8 h-8 transition-colors duration-200 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Text */}
          <div className="text-center">
            <span className="text-lg font-medium">
              {rating === 0 ? "" :
               rating === 1 ? "Poor" :
               rating === 2 ? "Fair" :
               rating === 3 ? "Good" :
               rating === 4 ? "Very Good" :
               "Excellent"}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Share your experience (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              className="glass-effect border-border resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 glass-effect border-border"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitRatingMutation.isPending}
              className="flex-1 ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}