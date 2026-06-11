import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Lock, Mail, ArrowLeft, Smartphone } from "lucide-react";

type Step = "login" | "2fa" | "forgot";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("login");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA fields
  const [twoFaCode, setTwoFaCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setStep("2fa");
        return;
      }

      toast({ title: "Welcome back", description: `Logged in as ${data.role}` });
      setLocation("/admin");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault();
    setTwoFaLoading(true);
    try {
      const res = await fetch("/api/admin/auth/totp/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tempToken, code: twoFaCode.replace(/\s/g, ""), rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");

      toast({ title: "Welcome back", description: data.warning || `Logged in as ${data.role}` });
      setLocation("/admin");
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
      setTwoFaCode("");
    } finally {
      setTwoFaLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      toast({
        title: "Reset requested",
        description: data.devToken
          ? `Dev token: ${data.devToken.slice(0, 16)}… (check server logs for full token)`
          : data.message,
      });
      setStep("login");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">STINE Admin Portal</h1>
          <p className="text-sm text-muted-foreground">Restricted access — authorised personnel only</p>
        </div>

        {/* Step: Login */}
        {step === "login" && (
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@stine.app"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    <span className="text-sm text-muted-foreground">Remember me (30 days)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep("forgot")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in to Admin Portal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step: 2FA verification */}
        {step === "2fa" && (
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handle2FA} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app, or paste a recovery code (format: <span className="font-mono text-xs">XXXXXXXX-XXXXXXXX</span>).
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="twoFaCode" className="text-sm">Authentication code</Label>
                  <Input
                    id="twoFaCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000  or  XXXXXXXX-XXXXXXXX"
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value)}
                    maxLength={20}
                    autoFocus
                    required
                    className="font-mono tracking-widest text-center text-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setStep("login"); setTwoFaCode(""); }}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={twoFaLoading || twoFaCode.length < 6}>
                    {twoFaLoading ? "Verifying…" : "Verify & Sign In"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step: Forgot password */}
        {step === "forgot" && (
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your admin email. A reset token will be generated and logged to the server. In production, it would be emailed to you.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="forgotEmail" className="text-sm">Admin email</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="admin@stine.app"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("login")}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={forgotLoading}>
                    {forgotLoading ? "Sending…" : "Request Reset"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to STINE
          </a>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            First time?{" "}
            <a href="/admin/setup" className="text-primary hover:underline">
              Create founder account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
