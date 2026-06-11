import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Crown, Eye, EyeOff, CheckCircle, Lock, AlertTriangle } from "lucide-react";

export default function AdminSetupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "available" | "unavailable">("loading");
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth/setup-status", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStatus(d.needsSetup ? "available" : "unavailable"))
      .catch(() => setStatus("available"));
  }, []);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: "Weak", color: "text-red-400", bar: "bg-red-500", width: "25%" };
    if (score <= 2) return { label: "Fair", color: "text-amber-400", bar: "bg-amber-500", width: "50%" };
    if (score <= 3) return { label: "Good", color: "text-yellow-400", bar: "bg-yellow-500", width: "75%" };
    return { label: "Strong", color: "text-green-400", bar: "bg-green-500", width: "100%" };
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName,
          middleName: form.middleName || undefined,
          lastName: form.lastName,
          username: form.username || undefined,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Setup failed");
      setDone(true);
      toast({ title: "Founder account created!", description: "You are now logged in as the platform founder." });
      setTimeout(() => setLocation("/admin"), 2000);
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
            <h1 className="text-xl font-bold">Setup Disabled</h1>
            <p className="text-sm text-muted-foreground">
              The founder account already exists. Setup is a one-time process and has been permanently disabled.
            </p>
            <Button onClick={() => setLocation("/admin/login")} className="w-full">
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h1 className="text-xl font-bold">Founder Account Created!</h1>
            <p className="text-sm text-muted-foreground">Redirecting you to the admin portal…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">Founder Setup</h1>
          <p className="text-sm text-muted-foreground">Create the root administrator account for STINE.</p>
        </div>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-semibold mb-1">One-time setup</p>
              <p className="text-amber-300/80">This page will be permanently disabled after the founder account is created. Store your credentials securely.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Founder Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">First Name *</Label>
                  <Input placeholder="John" {...field("firstName")} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Middle Name</Label>
                  <Input placeholder="Optional" {...field("middleName")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Last Name *</Label>
                  <Input placeholder="Doe" {...field("lastName")} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Username</Label>
                  <Input placeholder="@founder" {...field("username")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Email Address *</Label>
                <Input type="email" placeholder="beyin365@gmail.com" {...field("email")} required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    {...field("password")}
                    className="pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="space-y-1">
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${passwordStrength.bar}`} style={{ width: passwordStrength.width }} />
                    </div>
                    <p className={`text-xs font-medium ${passwordStrength.color}`}>{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Confirm Password *</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  {...field("confirmPassword")}
                  required
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-destructive">Passwords don't match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                disabled={loading || (!!form.confirmPassword && form.password !== form.confirmPassword)}
              >
                {loading ? "Creating Founder Account…" : "Create Founder Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to STINE</a>
        </div>
      </div>
    </div>
  );
}
