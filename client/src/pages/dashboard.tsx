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
  Upload, Radio, Headphones, Download, Mic2, BookOpen,
  Bookmark, PlayCircle, Volume2, Globe, Award
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

/* ── Listener Dashboard ────────────────────────────────────────────── */
function ListenerDashboard({ user }: { user: any }) {
  const [, setLocation] = useLocation();
  const { data: downloadCount } = useQuery<any>({ queryKey: ["/api/user/download-count"] });

  const tier = user?.subscriptionTier || "tier-free";
  const tierLabels: Record<string, string> = { "tier-free": "Free", "tier-basic": "Basic", "tier-pro": "Pro", "tier-premium": "Premium" };
  const tierLimits: Record<string, number | string> = { "tier-free": 5, "tier-basic": 30, "tier-pro": 100, "tier-premium": "∞" };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <Headphones className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-sm">Listener Plan: {tierLabels[tier] || tier}</p>
            <p className="text-xs text-muted-foreground">Downloads used: {downloadCount?.count || 0} / {tierLimits[tier] || 5}</p>
          </div>
          <Button size="sm" variant="outline" className="ml-auto text-xs" onClick={() => setLocation("/subscription")}>Upgrade</Button>
        </div>
        {typeof tierLimits[tier] === "number" && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, ((downloadCount?.count || 0) / Number(tierLimits[tier])) * 100)}%` }} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="geometric-clip cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setLocation("/search")}>
          <CardContent className="p-4 text-center space-y-2">
            <Globe className="w-6 h-6 mx-auto text-primary" />
            <p className="font-medium text-sm">Discover Music</p>
            <p className="text-xs text-muted-foreground">Browse tracks & artists</p>
          </CardContent>
        </Card>
        <Card className="geometric-clip cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setLocation("/library")}>
          <CardContent className="p-4 text-center space-y-2">
            <BookOpen className="w-6 h-6 mx-auto text-purple-400" />
            <p className="font-medium text-sm">My Library</p>
            <p className="text-xs text-muted-foreground">Saved & downloaded</p>
          </CardContent>
        </Card>
        <Card className="geometric-clip cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setLocation("/home")}>
          <CardContent className="p-4 text-center space-y-2">
            <Radio className="w-6 h-6 mx-auto text-red-400" />
            <p className="font-medium text-sm">Live Streams</p>
            <p className="text-xs text-muted-foreground">Tune in to DJs</p>
          </CardContent>
        </Card>
        <Card className="geometric-clip cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setLocation("/subscription")}>
          <CardContent className="p-4 text-center space-y-2">
            <Award className="w-6 h-6 mx-auto text-amber-400" />
            <p className="font-medium text-sm">Premium</p>
            <p className="text-xs text-muted-foreground">Unlock more downloads</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── DJ Dashboard ─────────────────────────────────────────────────── */
function DJDashboard({ user, myTracks, analytics, wallet, verificationStatus }: any) {
  const [, setLocation] = useLocation();
  const totalPlays = myTracks.reduce((s: number, t: any) => s + (t.playCount || 0), 0);
  const totalDownloads = myTracks.reduce((s: number, t: any) => s + (t.downloadCount || 0), 0);

  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4">
        <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1" /> Overview</TabsTrigger>
        <TabsTrigger value="tracks"><Music className="w-4 h-4 mr-1" /> Tracks</TabsTrigger>
        <TabsTrigger value="wallet"><DollarSign className="w-4 h-4 mr-1" /> Wallet</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        {verificationStatus?.status !== "approved" && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-500">
                {verificationStatus?.status === "pending" ? "Verification Under Review" : "Get Verified to Go Live"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {verificationStatus?.status === "pending"
                  ? "Your DJ profile is under admin review. Hang tight!"
                  : "Submit your DJ profile for admin review to unlock live streaming."}
              </p>
            </div>
            {!verificationStatus?.status && (
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0" onClick={() => setLocation("/settings")}>Apply</Button>
            )}
          </div>
        )}

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
            <StatCard title="Monthly Earnings" value={`₦${parseFloat(analytics.monthlyEarnings || "0").toLocaleString()}`} icon={TrendingUp} color="text-green-400" />
          </div>
        )}

        <div className="flex gap-2">
          <Button className="geometric-gradient text-primary-foreground flex-1" onClick={() => setLocation("/mixer")}>
            <Radio className="w-4 h-4 mr-2" /> Go Live
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setLocation("/studio")}>
            <Upload className="w-4 h-4 mr-2" /> Upload Track
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="tracks" className="space-y-3">
        {myTracks.length === 0 ? (
          <Card className="geometric-clip"><CardContent className="p-12 text-center">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No tracks uploaded yet</p>
            <Button className="mt-4 geometric-gradient text-primary-foreground" onClick={() => setLocation("/studio")}>Upload Your First Track</Button>
          </CardContent></Card>
        ) : myTracks.map((t: any) => (
          <Card key={t.id} className="geometric-clip">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={t.albumArt || "https://images.unsplash.com/photo-1514525253440-b39345208668?w=60&h=60&fit=crop"} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.genre || "Unknown"}{t.bpm ? ` · ${t.bpm} BPM` : ""}</p>
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
            <p className="text-xs text-muted-foreground">Withdrawn</p>
            <p className="text-xl font-bold">₦{parseFloat(wallet?.totalWithdrawn || "0").toLocaleString()}</p>
          </CardContent></Card>
          <Card className="geometric-clip"><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-xl font-bold">₦{parseFloat(wallet?.pendingAmount || "0").toLocaleString()}</p>
          </CardContent></Card>
        </div>
        {parseFloat(wallet?.balance || "0") > 0 && (
          <Card className="geometric-clip border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm">Withdraw Funds</p>
                <p className="text-xs text-muted-foreground">Minimum: ₦1,000 via Paystack</p>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setLocation("/settings")}>Request Payout</Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

/* ── Broadcaster Dashboard ────────────────────────────────────────── */
function BroadcasterDashboard({ user, analytics, wallet }: any) {
  const [, setLocation] = useLocation();
  const { data: liveStreams } = useQuery<any[]>({ queryKey: ["/api/streams/live"] });
  const myLive = (liveStreams || []).find((s: any) => s.userId === user?.id);

  return (
    <Tabs defaultValue="broadcast">
      <TabsList className="mb-4">
        <TabsTrigger value="broadcast"><Radio className="w-4 h-4 mr-1" /> Broadcast</TabsTrigger>
        <TabsTrigger value="audience"><Users className="w-4 h-4 mr-1" /> Audience</TabsTrigger>
        <TabsTrigger value="revenue"><DollarSign className="w-4 h-4 mr-1" /> Revenue</TabsTrigger>
      </TabsList>

      <TabsContent value="broadcast" className="space-y-4">
        <Card className="geometric-clip border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${myLive ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
              <p className="font-semibold text-sm">{myLive ? "LIVE NOW" : "Offline"}</p>
              {myLive && <Badge className="bg-red-500/20 text-red-400 text-xs">{myLive.listenerCount || 0} listeners</Badge>}
            </div>
            {myLive ? (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong className="text-foreground">{myLive.title}</strong></p>
                <p>Peak: {myLive.peakListeners || 0} · Duration: {Math.floor(((Date.now() - new Date(myLive.startedAt).getTime()) / 60000))}m</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Start a broadcast to reach your audience</p>
            )}
            <Button className={myLive ? "bg-red-600 hover:bg-red-700 text-white w-full" : "geometric-gradient text-primary-foreground w-full"} onClick={() => setLocation("/mixer")}>
              <Radio className="w-4 h-4 mr-2" /> {myLive ? "Manage Stream" : "Start Broadcasting"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard title="Total Broadcasts" value={analytics?.totalBroadcasts || 0} icon={Radio} color="text-red-400" />
          <StatCard title="Stream Hours" value={analytics?.streamHours || 0} sub="All time" icon={Clock} color="text-purple-400" />
          <StatCard title="Peak Listeners" value={analytics?.peakListeners || 0} sub="Best session" icon={Users} color="text-cyan-400" />
        </div>

        {(liveStreams || []).filter((s: any) => s.userId !== user?.id).slice(0, 5).length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Live Now on Platform</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {(liveStreams || []).filter((s: any) => s.userId !== user?.id).slice(0, 5).map((s: any) => (
                  <div key={s.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    <p className="flex-1 truncate font-medium">{s.title}</p>
                    <span className="text-xs text-muted-foreground">{s.listenerCount || 0} 👥</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="audience" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Followers" value={(analytics?.followers || 0).toLocaleString()} icon={Users} color="text-pink-400" />
          <StatCard title="Avg Listeners" value={analytics?.avgListeners || 0} sub="Per session" icon={Headphones} color="text-cyan-400" />
          <StatCard title="Total Listens" value={(analytics?.totalListens || 0).toLocaleString()} icon={PlayCircle} color="text-green-400" />
          <StatCard title="Tip Count" value={analytics?.tipCount || 0} sub="Tips received" icon={Heart} color="text-red-400" />
        </div>
        <Card className="geometric-clip"><CardContent className="p-6 text-center opacity-50">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Detailed audience analytics will appear after your first live session</p>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="revenue" className="space-y-4">
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
              <Zap className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-xs text-muted-foreground">Tips Received</p>
              <p className="text-3xl font-bold">₦{parseFloat(wallet?.tipsReceived || "0").toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Sub Revenue" value={`₦${parseFloat(wallet?.subscriptionRevenue || "0").toLocaleString()}`} icon={TrendingUp} color="text-purple-400" />
          <StatCard title="Monthly Earnings" value={`₦${parseFloat(analytics?.monthlyEarnings || "0").toLocaleString()}`} icon={Calendar} color="text-green-400" />
        </div>
        {parseFloat(wallet?.balance || "0") > 0 && (
          <Card className="geometric-clip border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm">Withdraw Earnings</p>
                <p className="text-xs text-muted-foreground">Minimum: ₦1,000 via Paystack</p>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setLocation("/settings")}>Request Payout</Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

/* ── Hybrid Creator Dashboard (DJ + Broadcaster) ─────────────────── */
function HybridDashboard({ user, myTracks, analytics, wallet, verificationStatus }: any) {
  const [, setLocation] = useLocation();
  const totalPlays = myTracks.reduce((s: number, t: any) => s + (t.playCount || 0), 0);

  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4 flex-wrap h-auto gap-1">
        <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1" /> Overview</TabsTrigger>
        <TabsTrigger value="dj"><Mic2 className="w-4 h-4 mr-1" /> DJ</TabsTrigger>
        <TabsTrigger value="broadcast"><Radio className="w-4 h-4 mr-1" /> Broadcast</TabsTrigger>
        <TabsTrigger value="wallet"><DollarSign className="w-4 h-4 mr-1" /> Wallet</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 text-sm">
          <p className="font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Hybrid Creator Mode</p>
          <p className="text-xs text-muted-foreground mt-1">You're unlocking both DJ Track Distribution and Live Broadcasting features.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="My Tracks" value={myTracks.length} icon={Music} color="text-purple-400" />
          <StatCard title="Total Plays" value={totalPlays.toLocaleString()} icon={Headphones} color="text-cyan-400" />
          <StatCard title="Followers" value={(analytics?.followers || 0).toLocaleString()} icon={Users} color="text-pink-400" />
          <StatCard title="Balance" value={`₦${parseFloat(wallet?.balance || "0").toLocaleString()}`} icon={DollarSign} color="text-amber-400" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button className="geometric-gradient text-primary-foreground" onClick={() => setLocation("/mixer")}><Radio className="w-4 h-4 mr-1" /> Go Live</Button>
          <Button variant="outline" onClick={() => setLocation("/studio")}><Upload className="w-4 h-4 mr-1" /> Upload</Button>
        </div>
      </TabsContent>

      <TabsContent value="dj">
        <DJDashboard user={user} myTracks={myTracks} analytics={analytics} wallet={wallet} verificationStatus={verificationStatus} />
      </TabsContent>

      <TabsContent value="broadcast">
        <BroadcasterDashboard user={user} analytics={analytics} wallet={wallet} />
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
              <TrendingUp className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-xs text-muted-foreground">Total Earned</p>
              <p className="text-3xl font-bold">₦{parseFloat(wallet?.totalEarned || "0").toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
        {parseFloat(wallet?.balance || "0") > 0 && (
          <Card className="geometric-clip border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm">Withdraw Funds</p>
                <p className="text-xs text-muted-foreground">Minimum: ₦1,000 via Paystack</p>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setLocation("/settings")}>Request Payout</Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

/* ── Main Dashboard ────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: myTracks = [] } = useQuery<any[]>({ queryKey: ["/api/tracks/my"] });
  const { data: analytics } = useQuery<any>({ queryKey: ["/api/creator/analytics"] });
  const { data: wallet } = useQuery<any>({ queryKey: ["/api/wallet"] });
  const { data: verificationStatus } = useQuery<any>({ queryKey: ["/api/verification/status"] });

  const role = (user as any)?.role || "listener";
  const tier = (user as any)?.subscriptionTier || "tier-free";

  // Determine which dashboard to show
  const isHybrid = role === "songcreator" || (role === "dj" && (user as any)?.isBroadcaster);
  const isBroadcaster = role === "broadcaster";
  const isDJ = role === "dj";
  const isListener = role === "listener" || !role;

  const roleLabel = role === "songcreator" ? "Hybrid Creator" : role;
  const displayName = (user as any)?.djName || (user as any)?.firstName || "Creator";

  const roleBadgeColor: Record<string, string> = {
    listener: "bg-blue-500/20 text-blue-400",
    dj: "bg-purple-500/20 text-purple-400",
    broadcaster: "bg-red-500/20 text-red-400",
    songcreator: "bg-gradient-to-r from-purple-500/20 to-red-500/20 text-amber-400",
    admin: "bg-amber-500/20 text-amber-400",
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {isListener ? "My Dashboard" : isDJ ? "DJ Dashboard" : isBroadcaster ? "Broadcaster Dashboard" : "Creator Dashboard"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground">{displayName}</span>
              <Badge className={`text-xs capitalize ${roleBadgeColor[role] || "bg-muted text-muted-foreground"}`}>{roleLabel}</Badge>
              <Badge variant="outline" className="text-xs">{tier}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {!isListener && (
              <Button variant="outline" size="sm" onClick={() => setLocation("/studio")}>
                <Upload className="w-4 h-4 mr-1" /> Upload
              </Button>
            )}
            {(isDJ || isBroadcaster || isHybrid) && (
              <Button size="sm" className="geometric-gradient text-primary-foreground" onClick={() => setLocation("/mixer")}>
                <Radio className="w-4 h-4 mr-1" /> Go Live
              </Button>
            )}
          </div>
        </div>

        {/* Role-specific dashboard */}
        {isListener && <ListenerDashboard user={user} />}
        {isDJ && !isHybrid && (
          <DJDashboard user={user} myTracks={myTracks} analytics={analytics} wallet={wallet} verificationStatus={verificationStatus} />
        )}
        {isBroadcaster && !isHybrid && (
          <BroadcasterDashboard user={user} analytics={analytics} wallet={wallet} />
        )}
        {isHybrid && (
          <HybridDashboard user={user} myTracks={myTracks} analytics={analytics} wallet={wallet} verificationStatus={verificationStatus} />
        )}
      </div>
    </div>
  );
}
