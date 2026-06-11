import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, LogIn, Users, BarChart3, Settings, Ban, Crown,
  DollarSign, TrendingUp, Activity, CheckCircle2, XCircle,
  AlertTriangle, Clock, FileText, Zap, Heart, Radio,
  Music, Download, Send, Eye, RefreshCw, Server, Wifi,
  Database, CreditCard, UserCheck, Flag, Bell
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useState } from "react";

const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL || "beyin365@gmail.com";

/* ── User Management ─────────────────────────────────────────────── */
function UserManagement() {
  const { toast } = useToast();
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });

  const roleMut = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => (await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role })).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "Role updated" }); },
    onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
  });
  const banMut = useMutation({
    mutationFn: async ({ id, banned }: { id: string; banned: boolean }) => (await apiRequest("PATCH", `/api/admin/users/${id}/ban`, { banned })).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "User status updated" }); },
    onError: () => toast({ title: "Failed to update user", variant: "destructive" }),
  });

  const roleColor: Record<string, string> = { listener: "bg-gray-500", dj: "bg-purple-500", songcreator: "bg-blue-500", admin: "bg-red-500" };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">User Management</h2>
        <Badge className="bg-primary/20 text-primary">{users.length} users</Badge>
      </div>
      {users.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No users yet</CardContent></Card>}
      {users.map((u: any) => (
        <Card key={u.id} className="geometric-clip">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden flex-shrink-0">
                {u.profileImageUrl
                  ? <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary">{(u.firstName || u.email || "?")[0].toUpperCase()}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{u.djName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || u.id}</p>
                  <Badge className={`text-xs ${roleColor[u.role] || "bg-gray-500"}`}>{u.role || "listener"}</Badge>
                  <Badge variant="outline" className="text-xs">{u.subscriptionTier || "tier-free"}</Badge>
                  {u.banned && <Badge className="bg-red-500 text-xs">Banned</Badge>}
                  {u.termsAccepted && <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">ToS ✓</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={u.role || "listener"} onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
                  className="text-xs rounded-md border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="listener">Listener</option>
                  <option value="dj">DJ</option>
                  <option value="songcreator">Song Creator</option>
                  <option value="admin">Admin</option>
                </select>
                <Button variant="outline" size="sm"
                  className={u.banned ? "border-green-500 text-green-500 hover:bg-green-500 hover:text-white text-xs" : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-xs"}
                  onClick={() => banMut.mutate({ id: u.id, banned: !u.banned })}>
                  <Ban className="w-3 h-3 mr-1" /> {u.banned ? "Unban" : "Ban"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Revenue Dashboard ───────────────────────────────────────────── */
function RevenueDashboard() {
  const { data: revenue } = useQuery<any>({ queryKey: ["/api/admin/revenue"] });
  const stats = [
    { label: "Total Revenue", value: `₦${parseFloat(revenue?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
    { label: "Tip Commissions", value: `₦${parseFloat(revenue?.tipCommissions || 0).toLocaleString()}`, icon: Heart, color: "text-pink-400" },
    { label: "Sub Commissions", value: `₦${parseFloat(revenue?.subscriptionCommissions || 0).toLocaleString()}`, icon: CreditCard, color: "text-purple-400" },
    { label: "Total Payouts", value: `₦${parseFloat(revenue?.totalPayouts || 0).toLocaleString()}`, icon: Send, color: "text-cyan-400" },
    { label: "Total Transactions", value: revenue?.totalTransactions || 0, icon: Activity, color: "text-blue-400" },
    { label: "Pending Payouts", value: revenue?.pendingPayouts || 0, icon: Clock, color: "text-amber-400" },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Revenue Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="geometric-clip">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="geometric-clip border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm text-amber-400">
          <strong>Commission Model:</strong> 30% platform fee · 70% to creators · ₦1,000 minimum payout via Paystack
        </CardContent>
      </Card>
    </div>
  );
}

/* ── KYC Verification Center ─────────────────────────────────────── */
function KYCCenter() {
  const { toast } = useToast();
  const { data: applications = [] } = useQuery<any[]>({ queryKey: ["/api/admin/verifications"] });

  const approveMut = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) =>
      (await apiRequest("PATCH", `/api/admin/verification/${id}`, { status: approved ? "approved" : "rejected" })).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] }); toast({ title: "Verification updated" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const statusIcon = (s: string) => s === "approved" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : s === "rejected" ? <XCircle className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-amber-400" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2"><UserCheck className="w-5 h-5 text-cyan-400" /> DJ Verification</h2>
        <Badge className="bg-amber-500/20 text-amber-400">{applications.filter((a: any) => a.status === "pending").length} pending</Badge>
      </div>
      {applications.length === 0 && (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No verification applications yet</p>
        </CardContent></Card>
      )}
      {applications.map((app: any) => (
        <Card key={app.id} className="geometric-clip">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-sm">{app.djName || app.userId}</p>
                  <div className="flex items-center gap-1">{statusIcon(app.status)}<span className="text-xs capitalize">{app.status}</span></div>
                </div>
                {app.bio && <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{app.bio}</p>}
                {app.socialLink && <a href={app.socialLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><Eye className="w-3 h-3" /> {app.socialLink}</a>}
                <p className="text-xs text-muted-foreground mt-1">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ""}</p>
              </div>
              {app.status === "pending" && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => approveMut.mutate({ id: app.id, approved: true })}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-xs" onClick={() => approveMut.mutate({ id: app.id, approved: false })}>
                    <XCircle className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Payout Center ───────────────────────────────────────────────── */
function PayoutCenter() {
  const { toast } = useToast();
  const { data: pendingPayouts = [] } = useQuery<any[]>({ queryKey: ["/api/admin/payouts/pending"] });

  const approveMut = useMutation({
    mutationFn: async (payoutId: string) => (await apiRequest("POST", `/api/admin/payout/${payoutId}/approve`, {})).json(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts/pending"] });
      toast({ title: "Payout approved!", description: data.message || "Transfer initiated via Paystack" });
    },
    onError: (err: any) => toast({ title: "Payout failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-green-400" /> Payout Center</h2>
        <Badge className="bg-amber-500/20 text-amber-400">{pendingPayouts.length} pending</Badge>
      </div>
      <Card className="geometric-clip bg-green-500/5 border-green-500/30">
        <CardContent className="p-4 text-sm">
          <p className="font-semibold text-green-400 mb-1">Paystack Transfers</p>
          <p className="text-muted-foreground text-xs">Approving a payout initiates an automatic Paystack transfer to the creator's registered bank account. Requires PAYSTACK_SECRET_KEY to be configured.</p>
        </CardContent>
      </Card>
      {pendingPayouts.length === 0 && (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No pending payouts</p>
        </CardContent></Card>
      )}
      {pendingPayouts.map((payout: any) => (
        <Card key={payout.id} className="geometric-clip">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{payout.djName || payout.userId}</p>
                  <Badge variant="outline" className="text-xs">{payout.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{payout.email}</p>
                {payout.bankAccount && <p className="text-xs text-muted-foreground mt-1">Bank: {payout.bankAccount}</p>}
                {payout.bankCode && <p className="text-xs text-muted-foreground">Code: {payout.bankCode}</p>}
                <p className="text-xs text-muted-foreground">{payout.requestedAt ? new Date(payout.requestedAt).toLocaleDateString() : ""}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-xl font-bold text-green-400">₦{parseFloat(payout.amount || 0).toLocaleString()}</p>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  onClick={() => approveMut.mutate(payout.id)}
                  disabled={approveMut.isPending}>
                  <Send className="w-3 h-3 mr-1" />
                  {approveMut.isPending ? "Processing..." : "Approve & Transfer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Audit Logs ──────────────────────────────────────────────────── */
function AuditLogs() {
  const { data: logs = [] } = useQuery<any[]>({ queryKey: ["/api/admin/audit-logs"] });
  const getColor = (action: string) => {
    if (action?.includes("ban")) return "text-red-400";
    if (action?.includes("approve") || action?.includes("payout")) return "text-green-400";
    if (action?.includes("reject")) return "text-amber-400";
    return "text-cyan-400";
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /> Audit Logs</h2>
        <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/audit-logs"] })}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      {logs.length === 0 && (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No audit events yet</p>
        </CardContent></Card>
      )}
      <div className="space-y-2">
        {logs.map((log: any, i: number) => (
          <Card key={log.id || i} className="geometric-clip">
            <CardContent className="p-3 flex items-start gap-3">
              <div className="w-1 h-full min-h-8 rounded-full bg-border flex-shrink-0 self-stretch" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${getColor(log.action)}`}>{log.action}</span>
                  <span className="text-xs text-muted-foreground">{log.adminEmail || "admin"}</span>
                </div>
                {log.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{typeof log.details === "string" ? log.details : JSON.stringify(log.details)}</p>}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Platform Health ─────────────────────────────────────────────── */
function PlatformHealth() {
  const { data: health } = useQuery<any>({
    queryKey: ["/api/admin/health"],
    refetchInterval: 30000,
  });

  const checks = [
    { name: "API Server", status: "ok", icon: Server },
    { name: "MongoDB", status: health?.mongodb || "unknown", icon: Database },
    { name: "PostgreSQL", status: health?.postgres || "unknown", icon: Database },
    { name: "Paystack", status: health?.paystack || "unknown", icon: CreditCard },
    { name: "WebSocket", status: health?.websocket || "ok", icon: Wifi },
  ];

  const getStatusColor = (s: string) => s === "ok" ? "text-green-400" : s === "unknown" ? "text-gray-400" : "text-red-400";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" /> Platform Health</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {checks.map((c) => (
          <Card key={c.name} className="geometric-clip">
            <CardContent className="p-4 flex items-center gap-3">
              <c.icon className={`w-8 h-8 ${getStatusColor(c.status)} flex-shrink-0`} />
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className={`text-xs ${getStatusColor(c.status)} capitalize`}>{c.status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {health?.uptime && (
        <Card className="geometric-clip">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Server Uptime</p>
            <p className="text-xl font-bold">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Fraud Detection ─────────────────────────────────────────────── */
function FraudDetection() {
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const { toast } = useToast();

  const suspicious = users.filter((u: any) =>
    u.totalStreams > 10000 || (u.achievementPoints > 5000 && u.totalStreamTime < 10)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><Flag className="w-5 h-5 text-red-400" /> Fraud Detection</h2>
      <Card className="geometric-clip bg-amber-500/5 border-amber-500/30">
        <CardContent className="p-4 text-sm text-amber-400">
          Auto-detects accounts with suspiciously high stream counts relative to actual listening time.
        </CardContent>
      </Card>
      {suspicious.length === 0 ? (
        <Card><CardContent className="p-10 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
          <p className="font-semibold">No suspicious activity detected</p>
        </CardContent></Card>
      ) : suspicious.map((u: any) => (
        <Card key={u.id} className="geometric-clip border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-sm">{u.djName || u.email || u.id}</p>
                <p className="text-xs text-muted-foreground">Streams: {u.totalStreams} · Points: {u.achievementPoints} · Time: {u.totalStreamTime}m</p>
              </div>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" /> Suspicious
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Settings ────────────────────────────────────────────────────── */
function PlatformSettings() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Platform Settings</h2>
      <Card className="geometric-clip">
        <CardContent className="p-6 space-y-4">
          {[
            { label: "Platform Commission (Tips)", value: "30%" },
            { label: "Platform Commission (Subscriptions)", value: "30%" },
            { label: "Creator Share (All Types)", value: "70%" },
            { label: "Minimum Payout Amount", value: "₦1,000" },
            { label: "Payment Provider", value: "Paystack (NGN)" },
            { label: "Free Tier Mixer Limit", value: "4 channels" },
            { label: "Free Tier Download Limit", value: "5 downloads total" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="geometric-clip border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-amber-500 font-medium">
            Settings are configured in <code className="text-xs bg-amber-500/20 px-1 rounded">server/routes.ts</code> and environment variables.
          </p>
        </CardContent>
      </Card>

      <Card className="geometric-clip">
        <CardHeader><CardTitle className="text-base">Subscription Tiers</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { id: "tier-free", name: "Free", price: "₦0", downloads: 5, mixers: 4 },
            { id: "tier-basic", name: "Premium Lite", price: "₦1,400/mo", downloads: 30, mixers: 6 },
            { id: "tier-pro", name: "Creator Pro", price: "₦5,000/mo", downloads: 100, mixers: 10 },
            { id: "tier-premium", name: "Studio Master", price: "₦15,000/mo", downloads: 1000, mixers: 20 },
            { id: "tier-elite", name: "Elite Agency", price: "₦50,000/mo", downloads: -1, mixers: 999 },
          ].map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
              <div>
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{t.price}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t.downloads === -1 ? "∞ downloads" : `${t.downloads} DL`} · {t.mixers === 999 ? "∞ mixers" : `${t.mixers} mix`}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main Admin Page ─────────────────────────────────────────────── */
export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
            <p className="text-muted-foreground mb-6">Please log in to access the owner dashboard</p>
            <Button onClick={() => setLocation("/login")} className="w-full">
              <LogIn className="w-4 h-4 mr-2" /> Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userEmail = (user as any)?.email || "";
  const isOwner = userEmail === OWNER_EMAIL || (user as any)?.role === "admin";

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">This dashboard is restricted to the platform owner.</p>
            <Button variant="outline" onClick={() => setLocation("/home")} className="w-full">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 p-6 border-b border-border bg-card/50">
          <Crown className="w-8 h-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">Founder Dashboard</h1>
            <p className="text-sm text-muted-foreground">Full platform control · STINE Admin</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Zap className="w-3 h-3 mr-1" /> Platform Owner
            </Badge>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <Tabs defaultValue="revenue">
            <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
              <TabsTrigger value="revenue" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Revenue</TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Users</TabsTrigger>
              <TabsTrigger value="kyc" className="gap-1.5 text-xs"><UserCheck className="w-3.5 h-3.5" /> KYC</TabsTrigger>
              <TabsTrigger value="payouts" className="gap-1.5 text-xs"><CreditCard className="w-3.5 h-3.5" /> Payouts</TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Audit</TabsTrigger>
              <TabsTrigger value="health" className="gap-1.5 text-xs"><Activity className="w-3.5 h-3.5" /> Health</TabsTrigger>
              <TabsTrigger value="fraud" className="gap-1.5 text-xs"><Flag className="w-3.5 h-3.5" /> Fraud</TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs"><Settings className="w-3.5 h-3.5" /> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue"><RevenueDashboard /></TabsContent>
            <TabsContent value="users"><UserManagement /></TabsContent>
            <TabsContent value="kyc"><KYCCenter /></TabsContent>
            <TabsContent value="payouts"><PayoutCenter /></TabsContent>
            <TabsContent value="audit"><AuditLogs /></TabsContent>
            <TabsContent value="health"><PlatformHealth /></TabsContent>
            <TabsContent value="fraud"><FraudDetection /></TabsContent>
            <TabsContent value="settings"><PlatformSettings /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
