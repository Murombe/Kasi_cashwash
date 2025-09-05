import { useState } from "react";
import { Gift, Percent, DollarSign, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountPercentage?: number;
  discountAmount?: number;
  tier: string;
  isActive: boolean;
}

interface RewardsGridProps {
  rewards: Reward[];
  userPoints: number;
  userTier: string;
  onRedeemReward: (rewardId: string) => void;
}

export function RewardsGrid({ rewards, userPoints, userTier, onRedeemReward }: RewardsGridProps) {
  const { toast } = useToast();

  const handleRedeem = (reward: Reward) => {
    if (userPoints < reward.pointsCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.pointsCost - userPoints} more points to redeem this reward.`,
        variant: "destructive",
      });
      return;
    }

    onRedeemReward(reward.id);
  };

  const getRewardIcon = (reward: Reward) => {
    if (reward.discountPercentage) return <Percent className="w-5 h-5" />;
    if (reward.discountAmount) return <DollarSign className="w-5 h-5" />;
    return <Gift className="w-5 h-5" />;
  };

  const availableRewards = rewards.filter(reward =>
    reward.isActive &&
    (reward.tier === 'bronze' ||
     (reward.tier === 'silver' && ['silver', 'gold', 'platinum'].includes(userTier.toLowerCase())) ||
     (reward.tier === 'gold' && ['gold', 'platinum'].includes(userTier.toLowerCase())) ||
     (reward.tier === 'platinum' && userTier.toLowerCase() === 'platinum'))
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {availableRewards.map((reward) => {
        const canAfford = userPoints >= reward.pointsCost;

        return (
          <Card
            key={reward.id}
            className={`glass-effect transition-all duration-200 ${
              canAfford ? 'hover:shadow-lg hover:border-primary/30' : 'opacity-60'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    canAfford ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {getRewardIcon(reward)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        reward.tier === 'bronze' ? 'border-orange-300 text-orange-600' :
                        reward.tier === 'silver' ? 'border-gray-300 text-gray-600' :
                        reward.tier === 'gold' ? 'border-yellow-300 text-yellow-600' :
                        'border-purple-300 text-purple-600'
                      }`}
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      {reward.tier}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {reward.description}
              </CardDescription>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gradient">
                  {reward.pointsCost} pts
                </div>
                {reward.discountPercentage && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-300">
                    {reward.discountPercentage}% OFF
                  </Badge>
                )}
                {reward.discountAmount && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-300">
                    R{reward.discountAmount} OFF
                  </Badge>
                )}
              </div>

              <Button
                onClick={() => handleRedeem(reward)}
                disabled={!canAfford}
                className={`w-full ${
                  canAfford
                    ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                data-testid={`button-redeem-${reward.id}`}
              >
                {canAfford ? 'Redeem Reward' : `Need ${reward.pointsCost - userPoints} more pts`}
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {availableRewards.length === 0 && (
        <div className="col-span-full text-center py-12">
          <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Rewards Available</h3>
          <p className="text-muted-foreground">
            Keep using our services to unlock amazing rewards!
          </p>
        </div>
      )}
    </div>
  );
}