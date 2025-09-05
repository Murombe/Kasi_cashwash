import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";
import { RewardsGrid } from "@/components/loyalty/RewardsGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { History, Gift, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

export default function Loyalty() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user loyalty data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user/loyalty"],
    retry: false,
  });

  // Fetch available rewards
  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ["/api/loyalty/rewards"],
    retry: false,
  });

  // Fetch loyalty transactions history
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/loyalty/transactions"],
    retry: false,
  });

  // Redeem reward mutation
  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await apiRequest("POST", "/api/loyalty/redeem", { rewardId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reward Redeemed!",
        description: "Your reward has been successfully redeemed.",
      });
      // Refresh user data and transactions
      queryClient.invalidateQueries({ queryKey: ["/api/user/loyalty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Unable to redeem reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (userLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const user = userData || {};
  const rewards = rewardsData || [];
  const transactions = transactionsData || [];

  // Calculate next tier points
  const tierPoints = {
    bronze: 500,
    silver: 1000,
    gold: 2000,
    platinum: null
  };

  const currentTier = user.loyaltyTier?.toLowerCase() || 'bronze';
  const nextTierPoints = tierPoints[currentTier as keyof typeof tierPoints] || undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-100">
      <Navigation />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient">
            Loyalty Program
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Earn points with every visit and unlock amazing rewards
          </p>
        </div>

        {/* Loyalty Card */}
        <div className="max-w-md mx-auto">
          <LoyaltyCard
            points={user.loyaltyPoints || 0}
            tier={user.loyaltyTier || 'Bronze'}
            totalVisits={user.totalVisits || 0}
            nextTierPoints={nextTierPoints}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 glass-effect">
            <TabsTrigger value="rewards" className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="tiers" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Tiers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Available Rewards</h2>
              <p className="text-muted-foreground">
                Redeem your points for discounts and special offers
              </p>
            </div>

            <RewardsGrid
              rewards={rewards}
              userPoints={user.loyaltyPoints || 0}
              userTier={user.loyaltyTier || 'Bronze'}
              onRedeemReward={(rewardId) => redeemMutation.mutate(rewardId)}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Points History</h2>
              <p className="text-muted-foreground">
                Track your points earnings and redemptions
              </p>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction: any) => (
                <Card key={transaction.id} className="glass-effect">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.pointsChange > 0 ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                      }`}>
                        {transaction.pointsChange > 0 ? <TrendingUp className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={transaction.pointsChange > 0 ? "default" : "destructive"}>
                      {transaction.pointsChange > 0 ? '+' : ''}{transaction.pointsChange} pts
                    </Badge>
                  </CardContent>
                </Card>
              ))}

              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-muted-foreground mb-2">No History Yet</h3>
                  <p className="text-muted-foreground">
                    Start booking services to earn your first points!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Loyalty Tiers</h2>
              <p className="text-muted-foreground">
                Unlock better rewards as you climb the tiers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { tier: 'Bronze', points: 0, color: 'bg-orange-500', benefits: ['5% discount on basic wash', '1 point per R10 spent'] },
                { tier: 'Silver', points: 500, color: 'bg-gray-400', benefits: ['10% discount on premium', '1.5 points per R10 spent'] },
                { tier: 'Gold', points: 1000, color: 'bg-yellow-500', benefits: ['15% discount on all services', '2 points per R10 spent'] },
                { tier: 'Platinum', points: 2000, color: 'bg-purple-500', benefits: ['20% discount + priority booking', '3 points per R10 spent'] },
              ].map((tierInfo) => (
                <Card
                  key={tierInfo.tier}
                  className={`glass-effect transition-all duration-200 ${
                    user.loyaltyTier?.toLowerCase() === tierInfo.tier.toLowerCase()
                      ? 'ring-2 ring-primary shadow-lg'
                      : ''
                  }`}
                >
                  <CardHeader className="text-center">
                    <div className={`w-12 h-12 rounded-full ${tierInfo.color} text-white mx-auto flex items-center justify-center mb-2`}>
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg">{tierInfo.tier}</CardTitle>
                    <CardDescription>
                      {tierInfo.points === 0 ? 'Starting tier' : `${tierInfo.points}+ points`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tierInfo.benefits.map((benefit, index) => (
                      <div key={index} className="text-sm flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}