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
  UserPlus, Ban, RefreshCw, Eye, EyeOff, Key, Trash2, Smartphone, Copy, Lock
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
  const { data: payouts } = useQuery<any[]>({ queryKey: ["/api/admin/payouts/pending"], queryFn: async () => { const r = await fetch("/api/admin/payouts/pending", { credentials: "include" }); if (!r.ok) return []; return r.json(); } });
  const { toast } = useToast();
  const qc = useQueryClient();

  async function approve(payoutId: string) {
    try {
      const r = await fetch(`/api/admin/payout/${payoutId}/approve`, { method: "POST", credentials: "include" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      qc.invalidateQueries({ queryKey: ["/api/admin/payouts/pending"] });
      toast({ title: "Payout approved", description: d.message });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Payout Center</h2>
      <Card>
        <CardContent className="p-0">
          {(payouts || []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No pending payouts</div>
          ) : (
            <div className="divide-y divide-border">
              {(payouts || []).map((p: any) => (
                <div key={p.id} className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.djName || p.userId}</p>
                    <p className="text-xs text-muted-foreground">{p.email} · {p.bankAccount || "No bank linked"}</p>
                  </div>
                  <p className="font-bold">₦{parseFloat(p.amount || "0").toLocaleString()}</p>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => approve(p.id)}>Approve & Transfer</Button>
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
            <TabsContent value="payouts"><PayoutCenter /></TabsContent>
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
