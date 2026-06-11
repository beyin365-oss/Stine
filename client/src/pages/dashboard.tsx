import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  TrendingUp, Users, Heart, DollarSign, Music, Activity,
  Calendar, Clock, Star, BarChart3, Zap, ArrowUpRight,
  Upload, Radio, Headphones, Download
} from "lucide-react";

function StatCard({ title, value, sub, icon: Icon, color = "text-cyan-400" }: any) {
  return (
    <Card className="geometric-clip">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">{title}</p>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className="text-2xl font-bold">{value ?? 0}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: myTracks = [] } = useQuery<any[]>({ queryKey: ["/api/tracks/my"] });
  const { data: analytics } = useQuery<any>({ queryKey: ["/api/creator/analytics"] });
  const { data: wallet } = useQuery<any>({ queryKey: ["/api/wallet"] });
  const { data: verificationStatus } = useQuery<any>({ queryKey: ["/api/verification/status"] });

  const role = (user as any)?.role || "listener";
  const tier = (user as any)?.subscriptionTier || "tier-free";

  const totalPlays = myTracks.reduce((s: number, t: any) => s + (t.playCount || 0), 0);
  const totalDownloads = myTracks.reduce((s: number, t: any) => s + (t.downloadCount || 0), 0);

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Creator Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {(user as any)?.djName || (user as any)?.firstName || "Creator"} ·{" "}
              <Badge variant="outline" className="text-xs capitalize">{role}</Badge>{" "}
              <Badge variant="outline" className="text-xs">{tier}</Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/studio")}>
              <Upload className="w-4 h-4 mr-1" /> Upload
            </Button>
            <Button size="sm" className="geometric-gradient text-primary-foreground" onClick={() => setLocation("/mixer")}>
              <Radio className="w-4 h-4 mr-1" /> Go Live
            </Button>
          </div>
        </div>

        {/* Verification Banner */}
        {role === "dj" && verificationStatus?.status !== "approved" && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-500">Get Verified to Go Live</p>
              <p className="text-xs text-muted-foreground mt-1">
                {verificationStatus?.status === "pending"
                  ? "Your verification is under review. Admin will approve soon."
                  : "Submit your DJ profile for admin review to unlock live streaming."}
              </p>
            </div>
            {!verificationStatus?.status && (
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0" onClick={() => setLocation("/settings")}>
                Apply
              </Button>
            )}
          </div>
        )}

        {/* Stats Overview */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1" /> Overview</TabsTrigger>
            <TabsTrigger value="tracks"><Music className="w-4 h-4 mr-1" /> Tracks</TabsTrigger>
            <TabsTrigger value="wallet"><DollarSign className="w-4 h-4 mr-1" /> Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="My Tracks" value={myTracks.length} icon={Music} color="text-purple-400" />
              <StatCard title="Total Plays" value={totalPlays.toLocaleString()} icon={Headphones} color="text-cyan-400" />
              <StatCard title="Total Downloads" value={totalDownloads.toLocaleString()} icon={Download} color="text-green-400" />
              <StatCard title="Wallet Balance" value={`₦${parseFloat(wallet?.balance || "0").toLocaleString()}`} icon={DollarSign} color="text-amber-400" />
            </div>

            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard title="Followers" value={(analytics.followers || 0).toLocaleString()} icon={Users} color="text-pink-400" />
                <StatCard title="Stream Hours" value={analytics.streamHours || 0} sub="Total hours streamed" icon={Radio} color="text-red-400" />
                <StatCard title="Earnings This Month" value={`₦${parseFloat(analytics.monthlyEarnings || "0").toLocaleString()}`} icon={TrendingUp} color="text-green-400" />
              </div>
            )}

            <Card className="geometric-clip">
              <CardContent className="p-6 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">Stream more to see detailed analytics</p>
                <Button className="mt-3 geometric-gradient text-primary-foreground" onClick={() => setLocation("/mixer")}>
                  <Zap className="w-4 h-4 mr-2" /> Start Streaming
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracks" className="space-y-3">
            {myTracks.length === 0 ? (
              <Card className="geometric-clip"><CardContent className="p-12 text-center">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No tracks uploaded yet</p>
                <Button className="mt-4 geometric-gradient text-primary-foreground" onClick={() => setLocation("/studio")}>
                  Upload Your First Track
                </Button>
              </CardContent></Card>
            ) : myTracks.map((t: any) => (
              <Card key={t.id} className="geometric-clip">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={t.albumArt || "https://images.unsplash.com/photo-1514525253440-b39345208668?w=60&h=60&fit=crop"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.genre || "Unknown"} {t.bpm ? `· ${t.bpm} BPM` : ""}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="flex items-center gap-1"><Headphones className="w-3 h-3" /> {(t.playCount || 0).toLocaleString()}</p>
                    <p className="flex items-center gap-1"><Download className="w-3 h-3" /> {(t.downloadCount || 0).toLocaleString()}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.isPublic ? "bg-green-400" : "bg-gray-500"}`} title={t.isPublic ? "Public" : "Private"} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="geometric-clip bg-gradient-to-br from-green-900/20 to-cyan-900/20 border-green-500/20">
                <CardContent className="p-5">
                  <DollarSign className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-xs text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold text-green-400">₦{parseFloat(wallet?.balance || "0").toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="geometric-clip">
                <CardContent className="p-5">
                  <ArrowUpRight className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold">₦{parseFloat(wallet?.totalEarned || "0").toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="geometric-clip"><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                <p className="text-xl font-bold">₦{parseFloat(wallet?.totalWithdrawn || "0").toLocaleString()}</p>
              </CardContent></Card>
              <Card className="geometric-clip"><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Pending Payouts</p>
                <p className="text-xl font-bold">₦{parseFloat(wallet?.pendingAmount || "0").toLocaleString()}</p>
              </CardContent></Card>
            </div>

            {parseFloat(wallet?.balance || "0") > 0 && (
              <Card className="geometric-clip border-green-500/30 bg-green-500/5">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Withdraw Funds</p>
                    <p className="text-xs text-muted-foreground">Minimum payout: ₦1,000 via Paystack</p>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setLocation("/settings")}>
                    Request Payout
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="geometric-clip">
              <CardContent className="p-6 text-center opacity-50">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Transaction history will appear here once you earn</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
