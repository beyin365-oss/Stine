import { useAuth } from "@/hooks/useAuth";
import { FounderRevenueDashboard } from "@/components/admin/founder-revenue-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogIn, Users, BarChart3, Settings, Ban, Crown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL || "beyin365@gmail.com";

function UserManagement() {
  const { toast } = useToast();
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated" });
    },
    onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
  });

  const banMutation = useMutation({
    mutationFn: async ({ id, banned }: { id: string; banned: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/ban`, { banned });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
    },
    onError: () => toast({ title: "Failed to update user", variant: "destructive" }),
  });

  const roleBadgeColor: Record<string, string> = {
    listener: "bg-gray-500",
    dj: "bg-purple-500",
    songcreator: "bg-blue-500",
    admin: "bg-red-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">User Management</h2>
        <Badge className="bg-primary/20 text-primary">{users.length} users</Badge>
      </div>
      <div className="space-y-3">
        {users.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No users yet</CardContent></Card>
        )}
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
                    <p className="font-medium text-sm truncate">
                      {u.djName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || u.id}
                    </p>
                    <Badge className={`text-xs ${roleBadgeColor[u.role] || "bg-gray-500"}`}>{u.role || "listener"}</Badge>
                    <Badge variant="outline" className="text-xs">{u.subscriptionTier || "tier-free"}</Badge>
                    {u.banned && <Badge className="bg-red-500 text-xs">Banned</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={u.role || "listener"}
                    onChange={(e) => changeRoleMutation.mutate({ id: u.id, role: e.target.value })}
                    className="text-xs rounded-md border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="listener">Listener</option>
                    <option value="dj">DJ</option>
                    <option value="songcreator">Song Creator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    className={u.banned ? "border-green-500 text-green-500 hover:bg-green-500 hover:text-white text-xs" : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-xs"}
                    onClick={() => banMutation.mutate({ id: u.id, banned: !u.banned })}
                  >
                    <Ban className="w-3 h-3 mr-1" />
                    {u.banned ? "Unban" : "Ban"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

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
            <p className="text-muted-foreground mb-6">
              This dashboard is restricted to the platform owner.
            </p>
            <Button variant="outline" onClick={() => setLocation("/home")} className="w-full">
              Back to Home
            </Button>
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
            <h1 className="text-2xl font-bold">Owner Dashboard</h1>
            <p className="text-sm text-muted-foreground">Full platform control panel</p>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="revenue">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="revenue" className="gap-2">
                <BarChart3 className="w-4 h-4" /> Revenue
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" /> Users
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" /> Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <FounderRevenueDashboard />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Platform Settings</h2>
                <Card className="geometric-clip">
                  <CardContent className="p-6 space-y-4">
                    {[
                      { label: "Platform Commission (Tips)", value: "15%" },
                      { label: "Platform Commission (Subscriptions)", value: "20%" },
                      { label: "Platform Commission (Merchandise)", value: "25%" },
                      { label: "Minimum Payout", value: "₦1,000" },
                      { label: "Payment Provider", value: "Paystack (NGN)" },
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
                      To change platform settings, update the routes in <code className="text-xs bg-amber-500/20 px-1 rounded">server/routes.ts</code>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
