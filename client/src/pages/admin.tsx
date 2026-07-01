import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Crown, LogOut, Shield, BarChart3, Users, UserCheck, CreditCard,
  FileText, Activity, Flag, Settings, Zap, CheckCircle, XCircle,
  AlertTriangle, Clock, Server, Database, DollarSign, TrendingUp,
  UserPlus, Ban, RefreshCw, Eye, EyeOff, Key, Trash2, Smartphone, Copy, Lock,
  Send, Wallet, Building2, ArrowRight, X
} from "lucide-react";

const OWNER_EMAIL = "beyin365@gmail.com";

/* ── Admin Auth Hook ──────────────────────────────────────────────── */
function useAdminAuth() {
  const { data: admin, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/auth/me"],
    queryFn: async () => {
      const r = await fetch("/api/admin/auth/me", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    retry: false,
    staleTime: 60_000,
  });
  return { admin: admin ?? null, isLoading };
}

/* ── Status Badge ─────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    ok: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
    configured: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
    error: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
    not_configured: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <AlertTriangle className="w-3 h-3" /> },
    unknown: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Clock className="w-3 h-3" /> },
  };
  const s = map[status] ?? map.unknown;
  return (
    <Badge className={`gap-1 text-xs ${s.color}`}>
      {s.icon} {status.replace("_", " ")}
    </Badge>
  );
}

/* ── Platform Health ─────────────────────────────────────────────── */
function PlatformHealth() {
  const { data: health, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ["/api/admin/health"],
    queryFn: async () => {
      const r = await fetch("/api/admin/health", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch health");
      return r.json();
    },
    staleTime: 30_000,
  });

  const uptime = health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Platform Health</h2>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Server className="w-4 h-4 text-primary" /> Server Status
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Uptime</span><span>{uptime}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">WebSocket</span><StatusBadge status={health?.websocket || "unknown"} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Last checked</span><span className="text-xs">{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "—"}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Database className="w-4 h-4 text-purple-400" /> Databases
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">PostgreSQL</span><StatusBadge status={health?.postgres || "unknown"} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MongoDB</span><StatusBadge status={health?.mongodb || "unknown"} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paystack</span><StatusBadge status={health?.paystack || "unknown"} /></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── Revenue Dashboard ────────────────────────────────────────────── */
function RevenueDashboard() {
  const { data: revenue } = useQuery<any>({ queryKey: ["/api/admin/revenue"], queryFn: async () => { const r = await fetch("/api/admin/revenue", { credentials: "include" }); if (!r.ok) return {}; return r.json(); } });
  const { data: transactions } = useQuery<any[]>({ queryKey: ["/api/admin/transactions"], queryFn: async () => { const r = await fetch("/api/admin/transactions", { credentials: "include" }); if (!r.ok) return []; return r.json(); } });

  const txList = transactions || [];
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Revenue & Transactions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", val: `₦${(revenue?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
          { label: "Platform Fees", val: `₦${(revenue?.platformFees || 0).toLocaleString()}`, icon: TrendingUp, color: "text-cyan-400" },
          { label: "Transactions", val: txList.length.toLocaleString(), icon: CreditCard, color: "text-purple-400" },
          { label: "This Month", val: `₦${(revenue?.monthlyRevenue || 0).toLocaleString()}`, icon: BarChart3, color: "text-amber-400" },
        ].map(({ label, val, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <Icon className={`w-4 h-4 mb-1 ${color}`} />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-bold text-lg">{val}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {txList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-border">
              {txList.slice(0, 20).map((tx: any) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium capitalize">{tx.type || "payment"}</p>
                    <p className="text-xs text-muted-foreground">{tx.paymentMethod} · {new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{parseFloat(tx.amount || "0").toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">{tx.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── User Management ─────────────────────────────────────────────── */
function UserManagement() {
  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/users"], queryFn: async () => { const r = await fetch("/api/admin/users", { credentials: "include" }); if (!r.ok) return []; return r.json(); } });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const allUsers = (users || []).filter((u: any) =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.firstName?.toLowerCase().includes(search.toLowerCase()) || u.djName?.toLowerCase().includes(search.toLowerCase())
  );

  async function updateRole(userId: string, role: string) {
    try {
      await fetch(`/api/admin/users/${userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ role }) });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated" });
    } catch { toast({ title: "Failed to update role", variant: "destructive" }); }
  }

  async function banUser(userId: string, banned: boolean) {
    try {
      await fetch(`/api/admin/users/${userId}/ban`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ banned }) });
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: banned ? "User suspended" : "User reactivated" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  }

  const ROLES = ["listener", "dj", "broadcaster", "songcreator", "admin", "super_admin"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold flex-1">User Management</h2>
        <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      <Card>
        <CardContent className="p-0">
          {allUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No users found</div>
          ) : (
            <div className="divide-y divide-border">
              {allUsers.slice(0, 50).map((u: any) => (
                <div key={u.id} className="px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.firstName} {u.lastName} {u.djName ? `· ${u.djName}` : ""}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{u.role || "listener"}</Badge>
                  <div className="flex gap-1.5">
                    <select
                      className="text-xs bg-background border border-border rounded px-1 py-0.5"
                      value={u.role || "listener"}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => banUser(u.id, !u.isBanned)}>
                      {u.isBanned ? "Unban" : <Ban className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── KYC Center ───────────────────────────────────────────────────── */
function KYCCenter() {
  const { data: verifs } = useQuery<any[]>({ queryKey: ["/api/admin/verifications"], queryFn: async () => { const r = await fetch("/api/admin/verifications", { credentials: "include" }); if (!r.ok) return []; return r.json(); } });
  const { toast } = useToast();
  const qc = useQueryClient();

  async function decide(id: string, status: "approved" | "rejected") {
    try {
      await fetch(`/api/admin/verification/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ status }) });
      qc.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      toast({ title: `Verification ${status}` });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">KYC / DJ Verification</h2>
      <Card>
        <CardContent className="p-0">
          {(verifs || []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No pending verifications</div>
          ) : (
            <div className="divide-y divide-border">
              {(verifs || []).map((v: any) => (
                <div key={v.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{v.djName || v.userId}</p>
                      <p className="text-xs text-muted-foreground">{v.bio?.slice(0, 120)}{v.bio?.length > 120 ? "…" : ""}</p>
                      {v.socialLink && <a href={v.socialLink} target="_blank" rel="noreferrer" className="text-xs text-primary">{v.socialLink}</a>}
                    </div>
                    <Badge className={v.status === "pending" ? "bg-amber-500/20 text-amber-400" : v.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{v.status}</Badge>
                  </div>
                  {v.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => decide(v.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="destructive" className="text-xs" onClick={() => decide(v.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Payout Center ────────────────────────────────────────────────── */
function PayoutCenter() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Modal modes: null | "sequential" | "batch"
  const [mode, setMode] = useState<"sequential" | "batch" | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpVerified, setTotpVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Sequential execution state
  const [seqIndex, setSeqIndex] = useState(0);
  const [seqResults, setSeqResults] = useState<{ payoutId: string; name: string; amount: number; status: "success" | "failed" | "processing"; reason?: string }[]>([]);
  const [seqRunning, setSeqRunning] = useState(false);

  // Batch execution state
  const [batchResult, setBatchResult] = useState<any>(null);
  const [batchRunning, setBatchRunning] = useState(false);

  const { data: summary, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/admin/payouts/batch-summary"],
    queryFn: async () => {
      const r = await fetch("/api/admin/payouts/batch-summary", { credentials: "include" });
      if (!r.ok) return { pendingCount: 0, totalAmount: 0, payouts: [], readyCount: 0, notReadyCount: 0 };
      return r.json();
    },
    staleTime: 30_000,
  });

  const payouts: any[] = summary?.payouts || [];
  const readyPayouts = payouts.filter((p: any) => p.hasBankLinked);
  const readyTotal = readyPayouts.reduce((s: number, p: any) => s + parseFloat(p.amount || "0"), 0);

  function closeModal() {
    setMode(null);
    setTotpCode("");
    setTotpVerified(false);
    setSeqIndex(0);
    setSeqResults([]);
    setSeqRunning(false);
    setBatchResult(null);
  }

  function openMode(m: "sequential" | "batch") {
    if (readyPayouts.length === 0) {
      toast({ title: "No payouts ready", description: "Creators need to link their bank account first.", variant: "destructive" });
      return;
    }
    setMode(m);
    setTotpCode("");
    setTotpVerified(false);
    setSeqIndex(0);
    setSeqResults([]);
    setBatchResult(null);
  }

  // Step 1: verify 2FA once, then unlock execution
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.length < 6) return;
    setVerifying(true);
    try {
      // Verify by attempting a dry batch (we pass an empty list — server just checks 2FA)
      const r = await fetch("/api/admin/payouts/verify-totp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: totpCode.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setTotpVerified(true);
    } catch (e: any) {
      toast({ title: "Invalid 2FA code", description: e.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  }

  // Sequential: pay one payout at a time, showing live progress
  async function runSequential() {
    setSeqRunning(true);
    const queue = [...readyPayouts];
    const results: typeof seqResults = [];
    for (let i = 0; i < queue.length; i++) {
      setSeqIndex(i);
      const p = queue[i];
      try {
        const r = await fetch(`/api/admin/payout/${p.id}/approve`, { method: "POST", credentials: "include" });
        const d = await r.json();
        results.push({ payoutId: p.id, name: p.djName || p.userId, amount: parseFloat(p.amount || "0"), status: r.ok ? "success" : "failed", reason: r.ok ? undefined : d.message });
      } catch (err: any) {
        results.push({ payoutId: p.id, name: p.djName || p.userId, amount: parseFloat(p.amount || "0"), status: "failed", reason: err.message });
      }
      setSeqResults([...results]);
    }
    setSeqRunning(false);
    refetch();
    qc.invalidateQueries({ queryKey: ["/api/admin/payouts/pending"] });
    const ok = results.filter(r => r.status === "success").length;
    toast({ title: `Sequential done: ${ok}/${queue.length} paid`, description: `₦${results.filter(r=>r.status==="success").reduce((s,r)=>s+r.amount,0).toLocaleString()} transferred` });
  }

  // Batch: fire all at once via dedicated endpoint
  async function runBatch() {
    setBatchRunning(true);
    try {
      const r = await fetch("/api/admin/payouts/execute-batch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: totpCode.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setBatchResult(d);
      refetch();
      qc.invalidateQueries({ queryKey: ["/api/admin/payouts/pending"] });
      toast({ title: `Batch done: ${d.succeeded} succeeded`, description: `₦${parseFloat(d.totalPaid || 0).toLocaleString()} paid out` });
    } catch (e: any) {
      toast({ title: "Batch failed", description: e.message, variant: "destructive" });
    } finally {
      setBatchRunning(false);
    }
  }

  const seqDone = seqResults.length === readyPayouts.length && !seqRunning;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Payout Center</h2>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <Wallet className="w-4 h-4 mb-1 text-amber-400" />
          <p className="text-xs text-muted-foreground">Total Pending</p>
          <p className="font-bold text-lg">₦{(summary?.totalAmount || 0).toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Users className="w-4 h-4 mb-1 text-purple-400" />
          <p className="text-xs text-muted-foreground">Creators Waiting</p>
          <p className="font-bold text-lg">{summary?.pendingCount || 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Building2 className="w-4 h-4 mb-1 text-green-400" />
          <p className="text-xs text-muted-foreground">Bank Linked</p>
          <p className="font-bold text-lg">{summary?.readyCount || 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <AlertTriangle className="w-4 h-4 mb-1 text-red-400" />
          <p className="text-xs text-muted-foreground">No Bank Yet</p>
          <p className="font-bold text-lg">{summary?.notReadyCount || 0}</p>
        </CardContent></Card>
      </div>

      {/* Revenue split */}
      <div className="flex gap-3 p-3 rounded-lg bg-muted/30 text-sm">
        <div className="flex-1 text-center">
          <p className="text-xs text-muted-foreground">Platform Cut</p>
          <p className="font-bold text-amber-400">30%</p>
          <p className="text-xs text-muted-foreground">already deducted</p>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 text-center">
          <p className="text-xs text-muted-foreground">Creator Share</p>
          <p className="font-bold text-green-400">70%</p>
          <p className="text-xs text-muted-foreground">amounts shown</p>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 text-center">
          <p className="text-xs text-muted-foreground">Ready to Pay</p>
          <p className="font-bold text-primary">₦{readyTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{readyPayouts.length} with bank</p>
        </div>
      </div>

      {/* Two action buttons */}
      {payouts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-600/10 font-semibold gap-2 h-auto py-3 flex-col items-center"
            onClick={() => openMode("sequential")}
            disabled={readyPayouts.length === 0}
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs leading-tight text-center">Pay One by One<br /><span className="font-normal opacity-70">review each transfer</span></span>
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold gap-2 h-auto py-3 flex-col items-center"
            onClick={() => openMode("batch")}
            disabled={readyPayouts.length === 0}
          >
            <Send className="w-5 h-5" />
            <span className="text-xs leading-tight text-center">Pay All at Once<br /><span className="font-normal opacity-80">single batch transfer</span></span>
          </Button>
        </div>
      )}

      {/* Individual payout list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pending Payout Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pending payouts</p>
              <p className="text-sm mt-1 opacity-70">Creator payout requests will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payouts.map((p: any) => (
                <div key={p.id} className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.djName || p.userId}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {p.hasBankLinked ? (
                        <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                          <Building2 className="w-2.5 h-2.5" /> {p.bankAccount}
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30 gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> No bank linked
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₦{parseFloat(p.amount || "0").toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">70% net</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Unified Modal ── */}
      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border shadow-2xl max-h-[90vh] flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  {mode === "sequential" ? <ArrowRight className="w-4 h-4 text-green-400" /> : <Send className="w-4 h-4 text-green-400" />}
                  {mode === "sequential" ? "Pay One by One" : "Pay All at Once"}
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeModal} disabled={seqRunning || batchRunning}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 overflow-y-auto">
              {/* ── Step 1: 2FA verification ── */}
              {!totpVerified && (
                <>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
                    <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Confirm payout details
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Creators to pay</p>
                        <p className="font-bold text-lg">{readyPayouts.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total amount</p>
                        <p className="font-bold text-lg text-green-400">₦{readyTotal.toLocaleString()}</p>
                      </div>
                    </div>
                    {summary?.notReadyCount > 0 && (
                      <p className="text-xs text-amber-400 mt-1">⚠ {summary.notReadyCount} without bank will be skipped.</p>
                    )}
                  </div>

                  <form onSubmit={handleVerify} className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">Enter your 2FA code to unlock</p>
                      <p className="text-xs text-muted-foreground">Paystack transfers are irreversible once sent.</p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="font-mono tracking-widest text-center text-lg"
                        autoFocus
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
                      <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={verifying || totpCode.length < 6}>
                        {verifying ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : "Verify & Unlock"}
                      </Button>
                    </div>
                  </form>
                </>
              )}

              {/* ── Step 2a: Sequential ── */}
              {totpVerified && mode === "sequential" && (
                <div className="space-y-3">
                  {/* Progress list */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {readyPayouts.map((p: any, i: number) => {
                      const result = seqResults.find(r => r.payoutId === p.id);
                      const isCurrent = seqRunning && i === seqIndex;
                      return (
                        <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                          result?.status === "success" ? "border-green-500/30 bg-green-500/5" :
                          result?.status === "failed" ? "border-red-500/30 bg-red-500/5" :
                          isCurrent ? "border-primary/50 bg-primary/5" :
                          "border-border bg-muted/10 opacity-60"
                        }`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{p.djName || p.userId}</p>
                            <p className="text-xs text-muted-foreground">₦{parseFloat(p.amount || "0").toLocaleString()}</p>
                          </div>
                          <div className="shrink-0">
                            {result?.status === "success" && <CheckCircle className="w-4 h-4 text-green-400" />}
                            {result?.status === "failed" && <XCircle className="w-4 h-4 text-red-400" title={result.reason} />}
                            {result?.status === "processing" && <Clock className="w-4 h-4 text-amber-400" />}
                            {isCurrent && !result && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
                            {!result && !isCurrent && <Clock className="w-4 h-4 text-muted-foreground/30" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  {(seqRunning || seqResults.length > 0) && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{seqResults.length} / {readyPayouts.length}</span>
                        <span>₦{seqResults.filter(r=>r.status==="success").reduce((s,r)=>s+r.amount,0).toLocaleString()} paid</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(seqResults.length / readyPayouts.length) * 100}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={closeModal} disabled={seqRunning}>
                      {seqDone ? "Close" : "Cancel"}
                    </Button>
                    {!seqDone && !seqRunning && (
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={runSequential}>
                        <ArrowRight className="w-4 h-4 mr-2" /> Start Paying
                      </Button>
                    )}
                    {seqRunning && (
                      <Button className="flex-1" disabled>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Paying {seqIndex + 1}/{readyPayouts.length}…
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 2b: Batch ── */}
              {totpVerified && mode === "batch" && (
                <div className="space-y-4">
                  {!batchResult ? (
                    <>
                      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-center">
                        <p className="text-sm text-muted-foreground">2FA verified. Ready to fire batch transfer.</p>
                        <p className="font-bold text-xl text-green-400 mt-1">₦{readyTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{readyPayouts.length} creators · single Paystack batch</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={closeModal} disabled={batchRunning}>Cancel</Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={runBatch} disabled={batchRunning}>
                          {batchRunning ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sending…</> : <><Send className="w-4 h-4 mr-2" />Send All Now</>}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 rounded-lg bg-green-500/10">
                          <p className="text-2xl font-bold text-green-400">{batchResult.succeeded}</p>
                          <p className="text-xs text-muted-foreground">Succeeded</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10">
                          <p className="text-2xl font-bold text-amber-400">{batchResult.processing}</p>
                          <p className="text-xs text-muted-foreground">Processing</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-500/10">
                          <p className="text-2xl font-bold text-red-400">{batchResult.failed}</p>
                          <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                      </div>
                      <p className="text-center font-semibold text-green-400">₦{parseFloat(batchResult.totalPaid || 0).toLocaleString()} paid out</p>
                      {batchResult.results?.filter((r: any) => r.status === "failed").map((r: any) => (
                        <div key={r.payoutId} className="text-xs text-red-400 bg-red-500/10 rounded p-2">{r.payoutId.slice(-6)}: {r.reason}</div>
                      ))}
                      <Button className="w-full" onClick={closeModal}>Done</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── Payout History ───────────────────────────────────────────────── */
function PayoutHistory() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "processing" | "failed">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/payouts/history"],
    queryFn: async () => {
      const r = await fetch("/api/admin/payouts/history", { credentials: "include" });
      if (!r.ok) return { payouts: [], batches: [] };
      return r.json();
    },
    staleTime: 60_000,
  });

  const payouts: any[] = data?.payouts || [];
  const batches: any[] = data?.batches || [];

  const filtered = payouts.filter((p: any) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !((p.djName || "").toLowerCase().includes(search.toLowerCase()) || (p.email || "").toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const totalPaid = payouts.filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + parseFloat(p.amount || "0"), 0);
  const totalPending = payouts.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + parseFloat(p.amount || "0"), 0);

  const statusColor: Record<string, string> = {
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Payout History</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Paid Out</p>
          <p className="font-bold text-lg text-green-400">₦{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{payouts.filter((p: any) => p.status === "completed").length} transfers</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Still Pending</p>
          <p className="font-bold text-lg text-amber-400">₦{totalPending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{payouts.filter((p: any) => p.status === "pending").length} requests</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Batch Runs</p>
          <p className="font-bold text-lg">{batches.length}</p>
          <p className="text-xs text-muted-foreground">executed batch payouts</p>
        </CardContent></Card>
      </div>

      {/* Batch history */}
      {batches.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Batch Execution History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-40 overflow-y-auto">
              {batches.map((b: any, i: number) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{b.details?.batchId || "—"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">₦{parseFloat(b.details?.totalPaid || "0").toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{b.details?.succeeded || 0} ok · {b.details?.failed || 0} failed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search creator…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs w-48" />
        {(["all", "pending", "completed", "processing", "failed"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Payout log table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No payouts match this filter</div>
          ) : (
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {filtered.map((p: any) => (
                <div key={p.id} className="px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.djName || p.userId}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    {p.bankAccount && <p className="text-xs text-muted-foreground font-mono">{p.bankAccount} · {p.bankName}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">₦{parseFloat(p.amount || "0").toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</p>
                  </div>
                  <Badge className={`text-[10px] border shrink-0 ${statusColor[p.status] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Audit Logs ───────────────────────────────────────────────────── */
function AuditLogs() {
  const { data: logs } = useQuery<any[]>({ queryKey: ["/api/admin/audit-logs"], queryFn: async () => { const r = await fetch("/api/admin/audit-logs", { credentials: "include" }); if (!r.ok) return []; return r.json(); } });
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Audit Logs</h2>
      <Card>
        <CardContent className="p-0">
          {(logs || []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No audit logs yet</div>
          ) : (
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {(logs || []).map((l: any, i: number) => (
                <div key={l.id || i} className="px-4 py-3 text-sm">
                  <div className="flex justify-between items-start">
                    <p className="font-medium capitalize">{l.action?.replace(/_/g, " ")}</p>
                    <span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{l.adminEmail || l.adminId} · {l.ipAddress || ""}</p>
                  {l.details && Object.keys(l.details).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{JSON.stringify(l.details).slice(0, 120)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Fraud Detection ─────────────────────────────────────────────── */
function FraudDetection() {
  const { data: fraud } = useQuery<any>({ queryKey: ["/api/admin/fraud"], queryFn: async () => { const r = await fetch("/api/admin/fraud", { credentials: "include" }); if (!r.ok) return {}; return r.json(); } });
  const suspicious = fraud?.suspiciousAccounts || [];
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Fraud Detection</h2>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Flagged Accounts", val: suspicious.length, color: "text-red-400" },
              { label: "Resolved Cases", val: fraud?.resolvedCases || 0, color: "text-green-400" },
              { label: "Open Cases", val: fraud?.openCases || 0, color: "text-amber-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {suspicious.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Flagged Accounts</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {suspicious.map((a: any) => (
                <div key={a.userId} className="px-4 py-3 text-sm flex justify-between">
                  <div>
                    <p className="font-medium">{a.userId}</p>
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400">Flagged</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Admin Accounts (Founder only) ───────────────────────────────── */
function AdminAccounts({ role }: { role: string }) {
  const { data: accounts } = useQuery<any[]>({ queryKey: ["/api/admin/accounts"], queryFn: async () => { const r = await fetch("/api/admin/accounts", { credentials: "include" }); if (!r.ok) return []; return r.json(); } });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "admin" });
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await fetch("/api/admin/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      qc.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "admin" });
      toast({ title: "Admin created" });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    setCreating(false);
  }

  async function remove(id: string) {
    if (!confirm("Remove admin role from this user?")) return;
    await fetch(`/api/admin/accounts/${id}`, { method: "DELETE", credentials: "include" });
    qc.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
    toast({ title: "Admin removed" });
  }

  if (role !== "founder") {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>Admin account management is restricted to the Founder.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold">Admin Accounts</h2>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add Admin</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
            <Input placeholder="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <div className="relative">
              <Input type={showPw ? "text" : "password"} placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="w-4 h-4" /></button>
            </div>
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <Button type="submit" disabled={creating} className="md:col-span-1">
              {creating ? "Creating…" : "Create Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Current Admins</CardTitle></CardHeader>
        <CardContent className="p-0">
          {(accounts || []).length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No admin accounts yet</div>
          ) : (
            <div className="divide-y divide-border">
              {(accounts || []).map((a: any) => (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{a.firstName} {a.lastName}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{a.role}</Badge>
                  {a.role !== "founder" && (
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive" onClick={() => remove(a.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Security Center (2FA + settings) ────────────────────────────── */
function SecurityCenter() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showDisable, setShowDisable] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: totpStatus, refetch: refetchTotp } = useQuery<any>({
    queryKey: ["/api/admin/auth/totp/status"],
    queryFn: async () => {
      const r = await fetch("/api/admin/auth/totp/status", { credentials: "include" });
      if (!r.ok) return { enabled: false, recoveryCodesRemaining: 0 };
      return r.json();
    },
    staleTime: 30_000,
  });

  async function startSetup() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/auth/totp/setup", { method: "POST", credentials: "include" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setSetupData(data);
      setVerifyCode("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function enableTOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/admin/auth/totp/enable", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setRecoveryCodes(data.recoveryCodes || []);
      setSetupData(null);
      refetchTotp();
      qc.invalidateQueries({ queryKey: ["/api/admin/auth/me"] });
      toast({ title: "2FA enabled!", description: "Save your recovery codes — they cannot be shown again." });
    } catch (e: any) {
      toast({ title: "Invalid code", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function disableTOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/admin/auth/totp/disable", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setShowDisable(false);
      setDisableCode("");
      refetchTotp();
      toast({ title: "2FA disabled" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold">Security</h2>

      {/* 2FA Card */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Require a code from your authenticator app on every login</p>
              </div>
            </div>
            <Badge className={totpStatus?.enabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
              {totpStatus?.enabled ? <><CheckCircle className="w-3 h-3 mr-1" />Enabled</> : <><XCircle className="w-3 h-3 mr-1" />Disabled</>}
            </Badge>
          </div>

          {/* Recovery codes remaining */}
          {totpStatus?.enabled && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
              <span className="text-muted-foreground">Recovery codes remaining</span>
              <Badge variant="outline" className={totpStatus.recoveryCodesRemaining < 3 ? "text-amber-400" : ""}>
                {totpStatus.recoveryCodesRemaining} / 8
              </Badge>
            </div>
          )}

          {/* Setup flow */}
          {!totpStatus?.enabled && !setupData && recoveryCodes.length === 0 && (
            <Button onClick={startSetup} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Generating…" : "Set Up Two-Factor Authentication"}
            </Button>
          )}

          {/* Step 1: Show secret + QR URI */}
          {setupData && recoveryCodes.length === 0 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <p className="text-sm font-medium">1. Open your authenticator app</p>
                <p className="text-xs text-muted-foreground">Google Authenticator, Authy, 1Password, Microsoft Authenticator, etc.</p>
                <p className="text-sm font-medium mt-2">2. Add an account manually using this secret:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border border-border rounded px-3 py-2 font-mono tracking-wider break-all">{setupData.secret}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(setupData.secret)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Or copy the full otpauth URI for apps that accept it:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 font-mono break-all text-muted-foreground">{setupData.otpauthUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(setupData.otpauthUrl)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <form onSubmit={enableTOTP} className="space-y-3">
                <p className="text-sm font-medium">3. Enter the 6-digit code shown in your app to confirm</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    maxLength={6}
                    className="font-mono tracking-widest text-center text-lg max-w-[140px]"
                    required
                  />
                  <Button type="submit" disabled={loading || verifyCode.length !== 6}>
                    {loading ? "Verifying…" : "Activate 2FA"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSetupData(null)}>Cancel</Button>
                </div>
              </form>
            </div>
          )}

          {/* Recovery codes shown after enable */}
          {recoveryCodes.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" /> Save these recovery codes now
                </div>
                <p className="text-xs text-muted-foreground">Each code can be used once to log in if you lose your phone. They cannot be shown again.</p>
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code) => (
                    <code key={code} className="text-xs font-mono bg-background border border-border rounded px-2 py-1.5 text-center">{code}</code>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => copyToClipboard(recoveryCodes.join("\n"))}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy All Recovery Codes
                </Button>
              </div>
              <Button onClick={() => setRecoveryCodes([])}>Done — I've saved my codes</Button>
            </div>
          )}

          {/* Disable 2FA */}
          {totpStatus?.enabled && recoveryCodes.length === 0 && (
            <div>
              {!showDisable ? (
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowDisable(true)}>
                  <Lock className="w-3.5 h-3.5 mr-1.5" /> Disable 2FA
                </Button>
              ) : (
                <form onSubmit={disableTOTP} className="flex gap-2 items-center">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter current code to confirm"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    maxLength={6}
                    className="font-mono max-w-[200px]"
                    required
                  />
                  <Button type="submit" variant="destructive" size="sm" disabled={loading}>Confirm Disable</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowDisable(false)}>Cancel</Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other security settings */}
      <div className="grid gap-3">
        {[
          { label: "Session Timeout", desc: "Admin sessions expire after 8 hours of inactivity", status: "active" },
          { label: "Audit Logging", desc: "All admin actions are logged with IP and timestamp", status: "active" },
          { label: "Rate Limiting", desc: "Login attempts capped at 10/15 min per IP", status: "active" },
          { label: "Paystack Webhooks", desc: "Webhook signature verification enabled for payment events", status: "active" },
          { label: "Admin Portal Isolation", desc: "Admin portal uses a separate session from the user application", status: "active" },
        ].map(({ label, desc, status }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400">{status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Platform Settings ────────────────────────────────────────────── */
function PlatformSettings() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Platform Settings</h2>
      <div className="grid gap-4">
        {[
          { label: "2FA Enforcement", desc: "TOTP 2FA is available per-admin. Enable it from the Security tab.", status: "active" },
          { label: "Session Timeout", desc: "Admin sessions expire after 8 hours of inactivity", status: "active" },
          { label: "Audit Logging", desc: "All admin actions are logged with IP and timestamp", status: "active" },
          { label: "Rate Limiting", desc: "Login attempts capped at 10/15min per IP", status: "active" },
          { label: "Paystack Webhooks", desc: "Webhook signature verification enabled for payment events", status: "active" },
        ].map(({ label, desc, status }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400">{status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Admin Role Hierarchy Panel ──────────────────────────────────── */
function RoleHierarchy() {
  const roles = [
    { name: "Founder", badge: "bg-amber-500/20 text-amber-400", perms: ["Full platform control", "Create/remove admins", "Founder-only bootstrap", "Password resets", "Billing & infrastructure"] },
    { name: "Super Admin", badge: "bg-purple-500/20 text-purple-400", perms: ["All admin actions", "User management", "Payout approvals", "KYC review", "Fraud management"] },
    { name: "Admin", badge: "bg-blue-500/20 text-blue-400", perms: ["User management", "KYC review", "Payout review", "Audit log access"] },
    { name: "Moderator", badge: "bg-gray-500/20 text-gray-400", perms: ["Content moderation", "Fraud flags", "Audit log view"] },
  ];
  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Role Hierarchy</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {roles.map(({ name, badge, perms }) => (
          <Card key={name}>
            <CardContent className="p-4 space-y-2">
              <Badge className={badge}>{name}</Badge>
              <ul className="space-y-1">
                {perms.map(p => (
                  <li key={p} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Main Admin Portal ────────────────────────────────────────────── */
export default function AdminPage() {
  const [, setLocation] = useLocation();
  const { admin, isLoading } = useAdminAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
    qc.invalidateQueries({ queryKey: ["/api/admin/auth/me"] });
    setLocation("/admin/login");
    toast({ title: "Logged out from admin portal" });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-muted-foreground">Authentication required.</p>
            <Button onClick={() => setLocation("/admin/login")} className="w-full">Sign in to Admin Portal</Button>
            <p className="text-xs text-muted-foreground">
              First time?{" "}
              <a href="/admin/setup" className="text-primary hover:underline">Create founder account</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const role = (admin as any)?.role || "admin";
  const isFounder = role === "founder";
  const displayName = [(admin as any)?.firstName, (admin as any)?.lastName].filter(Boolean).join(" ") || (admin as any)?.email;

  const roleColors: Record<string, string> = {
    founder: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    super_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    moderator: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Admin Portal Header */}
        <div className="flex items-center gap-3 p-4 md:p-6 border-b border-border bg-card/50 sticky top-0 z-10">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight">STINE Admin Portal</h1>
            <p className="text-xs text-muted-foreground truncate">Signed in as {displayName}</p>
          </div>
          <Badge className={roleColors[role] || roleColors.admin}>
            <Zap className="w-3 h-3 mr-1" /> {role.replace("_", " ")}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </Button>
        </div>

        {/* Portal Tabs */}
        <div className="p-4 md:p-6">
          <Tabs defaultValue="health">
            <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
              <TabsTrigger value="health" className="gap-1.5 text-xs"><Activity className="w-3.5 h-3.5" /> Health</TabsTrigger>
              <TabsTrigger value="revenue" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Revenue</TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Users</TabsTrigger>
              <TabsTrigger value="kyc" className="gap-1.5 text-xs"><UserCheck className="w-3.5 h-3.5" /> KYC</TabsTrigger>
              <TabsTrigger value="payouts" className="gap-1.5 text-xs"><CreditCard className="w-3.5 h-3.5" /> Payouts</TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Audit</TabsTrigger>
              <TabsTrigger value="fraud" className="gap-1.5 text-xs"><Flag className="w-3.5 h-3.5" /> Fraud</TabsTrigger>
              {isFounder && <TabsTrigger value="admins" className="gap-1.5 text-xs"><Key className="w-3.5 h-3.5" /> Admins</TabsTrigger>}
              <TabsTrigger value="roles" className="gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" /> Roles</TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 text-xs"><Lock className="w-3.5 h-3.5" /> Security</TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs"><Settings className="w-3.5 h-3.5" /> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="health"><PlatformHealth /></TabsContent>
            <TabsContent value="revenue"><RevenueDashboard /></TabsContent>
            <TabsContent value="users"><UserManagement /></TabsContent>
            <TabsContent value="kyc"><KYCCenter /></TabsContent>
            <TabsContent value="payouts" className="space-y-8"><PayoutCenter /><PayoutHistory /></TabsContent>
            <TabsContent value="audit"><AuditLogs /></TabsContent>
            <TabsContent value="fraud"><FraudDetection /></TabsContent>
            {isFounder && <TabsContent value="admins"><AdminAccounts role={role} /></TabsContent>}
            <TabsContent value="roles"><RoleHierarchy /></TabsContent>
            <TabsContent value="security"><SecurityCenter /></TabsContent>
            <TabsContent value="settings"><PlatformSettings /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
