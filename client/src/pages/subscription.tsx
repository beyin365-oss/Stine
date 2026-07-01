import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Check, Crown, Zap, Music, Star, Shield, Radio, BarChart3,
  Headphones, Download, Loader2, AlertCircle
} from "lucide-react";

const TIERS = [
  {
    id: "tier-free",
    name: "FREE",
    subtitle: "Normal Account",
    price: 0,
    currency: "NGN",
    color: "from-gray-600 to-gray-700",
    badge: null,
    audioQuality: "Good standard quality",
    mixerLimit: 4,
    downloadLimit: 5,
    features: [
      "Good standard audio quality",
      "Live stream listening",
      "4 mixer channels maximum",
      "5 song downloads total",
      "Community chat",
      "Basic track upload",
    ],
  },
  {
    id: "tier-basic",
    name: "PREMIUM LITE",
    subtitle: "₦1,400 / month",
    price: 1400,
    currency: "NGN",
    color: "from-cyan-600 to-blue-600",
    badge: "Popular",
    audioQuality: "Higher-fidelity audio",
    mixerLimit: 6,
    downloadLimit: 30,
    features: [
      "Higher-fidelity audio streaming",
      "Live stream broadcasting",
      "6 mixer channels",
      "30 song downloads / month",
      "Priority stream quality",
      "Enhanced creator profile",
    ],
  },
  {
    id: "tier-pro",
    name: "CREATOR PRO",
    subtitle: "₦5,000 / month",
    price: 5000,
    currency: "NGN",
    color: "from-purple-600 to-pink-600",
    badge: "Best Value",
    audioQuality: "Master / lossless audio",
    mixerLimit: 10,
    downloadLimit: 100,
    features: [
      "Absolute best / master audio",
      "Full DJ broadcast suite",
      "10 mixer channels",
      "100 song downloads / month",
      "Advanced AI mixing tools",
      "Stream recording & archive",
      "Creator analytics dashboard",
      "Priority support",
    ],
  },
  {
    id: "tier-premium",
    name: "STUDIO MASTER",
    subtitle: "₦15,000 / month",
    price: 15000,
    currency: "NGN",
    color: "from-amber-500 to-orange-600",
    badge: "Pro",
    audioQuality: "Master / lossless audio",
    mixerLimit: 20,
    downloadLimit: 1000,
    features: [
      "Absolute best / master audio",
      "Unlimited broadcast streams",
      "20 mixer channels",
      "1,000 downloads / month",
      "Real-time AI mixing",
      "NFT marketplace access",
      "Dedicated account manager",
      "Revenue sharing enabled",
      "White-label options",
    ],
  },
  {
    id: "tier-elite",
    name: "ELITE AGENCY",
    subtitle: "₦50,000 / month",
    price: 50000,
    currency: "NGN",
    color: "from-rose-600 to-purple-700",
    badge: "Elite",
    audioQuality: "Master / lossless audio",
    mixerLimit: 999,
    downloadLimit: -1,
    features: [
      "Absolute best / master audio",
      "Unlimited everything",
      "Unlimited mixer channels",
      "UNLIMITED downloads",
      "Full API access",
      "Merchandise store",
      "Dedicated account manager",
      "DMCA priority handling",
      "Revenue sharing & payouts",
      "Custom branding & white-label",
    ],
  },
];

function getFeatureIcon(feature: string) {
  if (feature.toLowerCase().includes("audio")) return <Headphones className="w-4 h-4 text-cyan-400" />;
  if (feature.toLowerCase().includes("download")) return <Download className="w-4 h-4 text-green-400" />;
  if (feature.toLowerCase().includes("mixer") || feature.toLowerCase().includes("stream")) return <Radio className="w-4 h-4 text-purple-400" />;
  if (feature.toLowerCase().includes("ai") || feature.toLowerCase().includes("analytics")) return <BarChart3 className="w-4 h-4 text-yellow-400" />;
  if (feature.toLowerCase().includes("unlimited")) return <Zap className="w-4 h-4 text-amber-400" />;
  return <Check className="w-4 h-4 text-primary" />;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const currentTier = (user as any)?.subscriptionTier || "tier-free";
  const downloadCount = (user as any)?.downloadCount || 0;
  const currentTierData = TIERS.find(t => t.id === currentTier) || TIERS[0];
  const downloadLimit = currentTierData.downloadLimit;
  const isDownloadLimitReached = downloadLimit > 0 && downloadCount >= downloadLimit;

  const handleSubscribe = async (tier: typeof TIERS[0]) => {
    if (tier.price === 0) {
      toast({ title: "You're on the Free plan", description: "Upgrade to unlock more features!" });
      return;
    }
    if (tier.id === currentTier) {
      toast({ title: "Already subscribed", description: "This is your current plan." });
      return;
    }
    setIsPaying(true);
    setSelectedTier(tier.id);
    try {
      const pkRes = await apiRequest("GET", "/api/paystack/public-key");
      const pkData = await pkRes.json();
      if (!pkData.publicKey) throw new Error("Paystack not configured.");
      const reference = `stine-sub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const initRes = await apiRequest("POST", "/api/paystack/initialize", {
        amount: tier.price,
        reference,
        email: (user as any)?.email || "user@stine.app",
        metadata: { tierId: tier.id, tierName: tier.name },
      });
      const initData = await initRes.json();
      if (initData.status !== true || !initData.data?.authorization_url) throw new Error(initData.message || "Failed to initialize payment");
      sessionStorage.setItem("pendingTierId", tier.id);
      sessionStorage.setItem("pendingReference", reference);
      window.location.href = initData.data.authorization_url;
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPaying(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">Unlock the full STINE experience — from casual listening to professional DJ broadcasting</p>
        </div>

        {/* Current Plan Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentTierData.color} flex items-center justify-center flex-shrink-0`}>
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">{currentTierData.name} Plan</p>
              <p className="text-xs text-muted-foreground">
                {downloadLimit === -1 ? "Unlimited downloads" : `${downloadCount} / ${downloadLimit} downloads used`}
                {" · "}
                {currentTierData.mixerLimit === 999 ? "Unlimited mixers" : `${currentTierData.mixerLimit} mixer channels`}
              </p>
            </div>
          </div>
          {isDownloadLimitReached && (
            <div className="flex items-center gap-2 text-amber-500 text-sm bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Download limit reached — Upgrade for more downloads</span>
            </div>
          )}
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier;
            const isPending = selectedTier === tier.id && isPaying;
            return (
              <Card
                key={tier.id}
                className={`relative overflow-hidden transition-all duration-200 ${isCurrent ? "ring-2 ring-primary" : "hover:scale-[1.02] hover:shadow-xl"}`}
              >
                {tier.badge && (
                  <div className="absolute top-3 right-3">
                    <Badge className={`text-[10px] bg-gradient-to-r ${tier.color} text-white border-0`}>{tier.badge}</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-3 left-3">
                    <Badge className="text-[10px] bg-primary text-primary-foreground">Current</Badge>
                  </div>
                )}
                <CardHeader className={`pb-3 bg-gradient-to-br ${tier.color} text-white`}>
                  <CardTitle className="text-base font-bold">{tier.name}</CardTitle>
                  <p className="text-xs opacity-80 font-medium">{tier.subtitle}</p>
                  <div className="mt-2">
                    {tier.price === 0 ? (
                      <p className="text-2xl font-bold">Free</p>
                    ) : (
                      <p className="text-xl font-bold">₦{tier.price.toLocaleString()}<span className="text-xs font-normal opacity-70">/mo</span></p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <Headphones className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      <span>{tier.audioQuality}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Radio className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      <span>{tier.mixerLimit === 999 ? "Unlimited mixers" : `${tier.mixerLimit} mixer channels`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Download className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>{tier.downloadLimit === -1 ? "Unlimited downloads" : `${tier.downloadLimit} downloads/mo`}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-2 space-y-1.5">
                    {tier.features.slice(3).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        {getFeatureIcon(f)}
                        <span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full text-sm mt-2 ${isCurrent ? "bg-muted text-muted-foreground cursor-default" : `bg-gradient-to-r ${tier.color} text-white hover:opacity-90`}`}
                    disabled={isCurrent || isPaying}
                    onClick={() => handleSubscribe(tier)}
                  >
                    {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing</> :
                     isCurrent ? "Current Plan" :
                     tier.price === 0 ? "Downgrade to Free" : "Subscribe Now"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features comparison */}
        <Card className="geometric-clip">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> All Plans Include</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Access to all public tracks", "Community chat", "Mobile & Desktop apps", "Secure payments (Paystack)", "Real-time audio streaming", "Creator profile page", "Song request system", "STINE DJ community"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
