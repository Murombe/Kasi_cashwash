import { Star, Gift, Crown, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface LoyaltyCardProps {
  points: number;
  tier: string;
  totalVisits: number;
  nextTierPoints?: number;
}

const tierConfig = {
  bronze: { color: "bg-orange-500", icon: Award, nextTier: "Silver", pointsNeeded: 500 },
  silver: { color: "bg-gray-400", icon: Star, nextTier: "Gold", pointsNeeded: 1000 },
  gold: { color: "bg-yellow-500", icon: Crown, nextTier: "Platinum", pointsNeeded: 2000 },
  platinum: { color: "bg-purple-500", icon: Gift, nextTier: null, pointsNeeded: null },
};

export function LoyaltyCard({ points, tier, totalVisits, nextTierPoints }: LoyaltyCardProps) {
  const currentTier = tierConfig[tier.toLowerCase() as keyof typeof tierConfig];
  const TierIcon = currentTier.icon;
  const progressToNext = nextTierPoints ? (points / nextTierPoints) * 100 : 100;

  return (
    <Card className="glass-effect border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${currentTier.color} text-white`}>
              <TierIcon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-gradient">
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Member
              </CardTitle>
              <CardDescription>
                {totalVisits} visits • {points} points
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20"
          >
            {points} pts
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {currentTier.nextTier && nextTierPoints && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to {currentTier.nextTier}</span>
              <span>{nextTierPoints - points} points to go</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 glass-effect rounded-lg">
            <div className="text-2xl font-bold text-gradient">{totalVisits}</div>
            <div className="text-sm text-muted-foreground">Total Visits</div>
          </div>
          <div className="text-center p-3 glass-effect rounded-lg">
            <div className="text-2xl font-bold text-gradient">{Math.floor(points / 10)}</div>
            <div className="text-sm text-muted-foreground">Rewards Earned</div>
          </div>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
          data-testid="button-view-rewards"
        >
          <Gift className="w-4 h-4 mr-2" />
          View Available Rewards
        </Button>
      </CardContent>
    </Card>
  );
}