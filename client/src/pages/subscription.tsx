import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockSubscriptionTiers } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Check, Crown, Zap, Music, Star, Shield, Radio, BarChart3,
  Headphones, Gift, Video, Store, Loader2
} from "lucide-react";

const featureIcons: Record<string, React.ReactNode> = {
  "concurrent": <Radio className="w-4 h-4" />,
  "audio": <Headphones className="w-4 h-4" />,
  "analytics": <BarChart3 className="w-4 h-4" />,
  "support": <Shield className="w-4 h-4" />,
  "branding": <Music className="w-4 h-4" />,
  "scheduling": <Zap className="w-4 h-4" />,
  "recording": <Video className="w-4 h-4" />,
  "NFT": <Gift className="w-4 h-4" />,
  "merchandise": <Store className="w-4 h-4" />,
  "API": <Star className="w-4 h-4" />,
};

function getFeatureIcon(feature: string) {
  for (const key of Object.keys(featureIcons)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) return featureIcons[key];
  }
  return <Check className="w-4 h-4" />;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [currentTier] = useState("tier-free");

  const handleSubscribe = async (tier: typeof mockSubscriptionTiers[0]) => {
    if (tier.price === 0) {
      toast({ title: "You're on the Free plan", description: "Upgrade to unlock more features!" });
      return;
    }

    setIsPaying(true);
    setSelectedTier(tier.id);

    try {
      // 1. Get Paystack public key
      const pkRes = await apiRequest("GET", "/api/paystack/public-key");
      const pkData = await pkRes.json();

      if (!pkData.publicKey) {
        throw new Error("Paystack not configured. Add PAYSTACK_PUBLIC_KEY to your environment variables.");
      }

      // 2. Initialize payment on backend
      const reference = `stine-sub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const initRes = await apiRequest("POST", "/api/paystack/initialize", {
        amount: tier.price,
        reference,
        email: user?.email || "user@stine.app",
      });
      const initData = await initRes.json();

      if (initData.status !== true || !initData.data?.authorization_url) {
        throw new Error(initData.message || "Failed to initialize payment");
      }

      // 3. Redirect to Paystack
      window.location.href = initData.data.authorization_url;
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Could not start payment. Try again.",
        variant: "destructive",
      });
      setIsPaying(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Unlock professional DJ streaming tools. All plans include Paystack secure payments in Naira.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-sm px-4 py-1">
            Current: {mockSubscriptionTiers.find(t => t.id === currentTier)?.name || "Free"}
          </Badge>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockSubscriptionTiers.map((tier) => {
            const isCurrent = currentTier === tier.id;
            const isSelected = selectedTier === tier.id;

            return (
              <Card
                key={tier.id}
                className={`relative overflow-hidden transition-all duration-200 ${
                  isCurrent ? "ring-2 ring-primary" : ""
                } ${tier.id === "tier-pro" ? "md:scale-105 md:-my-2 shadow-lg" : ""}`}
              >
                {/* Badge */}
                {tier.badge && tier.id !== "tier-free" && (
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold text-white rounded-bl-lg bg-gradient-to-r ${tier.color}`}>
                    {tier.badge}
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center mb-2`}>
                    {tier.id === "tier-free" ? <Music className="w-5 h-5 text-white" /> :
                     tier.id === "tier-basic" ? <Zap className="w-5 h-5 text-white" /> :
                     tier.id === "tier-pro" ? <Crown className="w-5 h-5 text-white" /> :
                     <Star className="w-5 h-5 text-white" />}
                  </div>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="text-center">
                    <span className="text-3xl font-bold">
                      {tier.price === 0 ? "Free" : `₦${tier.price.toLocaleString()}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm text-muted-foreground">/month</span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">{getFeatureIcon(feature)}</span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className={`w-full bg-gradient-to-r ${tier.color} text-white hover:opacity-90`}
                    disabled={isCurrent || (isPaying && isSelected)}
                    onClick={() => handleSubscribe(tier)}
                  >
                    {isPaying && isSelected ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : tier.price === 0 ? (
                      "Get Started"
                    ) : (
                      "Subscribe with Paystack"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Security Note */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Payments powered by Paystack — PCI DSS compliant, secure Naira transactions</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You can cancel anytime. Subscription fees are processed in Nigerian Naira (NGN).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
