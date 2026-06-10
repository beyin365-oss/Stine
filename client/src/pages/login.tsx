import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StineLogo } from "@/components/ui/geometric-logo";
import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, Radio, Music, Headphones, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

type Tab = "login" | "signup";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("login");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupDjName, setSignupDjName] = useState("");
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", { email: loginEmail, password: loginPassword });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/home");
    } catch (err: any) {
      const msg = err.message?.includes("401") ? "Invalid email or password" : (err.message || "Login failed");
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSignupLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register", {
        email: signupEmail,
        password: signupPassword,
        firstName: signupFirstName,
        djName: signupDjName || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Account created!", description: "Welcome to STINE" });
      setLocation("/home");
    } catch (err: any) {
      const msg = err.message?.includes("400") ? "Email already registered" : (err.message || "Sign up failed");
      toast({ title: "Sign up failed", description: msg, variant: "destructive" });
    } finally {
      setSignupLoading(false);
    }
  };

  const features = [
    { icon: Radio, text: "Live DJ Streams" },
    { icon: Music, text: "Millions of Tracks" },
    { icon: Headphones, text: "Crystal Clear Audio" },
  ];

  const inputCls = "w-full py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="geometric-clip border-2">
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-6">
              <StineLogo className="mx-auto scale-125 mb-4" />
              <h1 className="text-2xl font-bold mb-1">Welcome to STINE</h1>
              <p className="text-sm text-muted-foreground">Stream, discover, and connect</p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-lg overflow-hidden border mb-6">
              <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "login" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
                onClick={() => setTab("login")}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === "signup" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
                onClick={() => setTab("signup")}
              >
                Create Account
              </button>
            </div>

            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@email.com"
                      className={`${inputCls} pl-10 pr-4`}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showLoginPwd ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className={`${inputCls} pl-10 pr-10`}
                      required
                    />
                    <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full geometric-gradient text-primary-foreground" disabled={loginLoading}>
                  {loginLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}

            {tab === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)}
                      placeholder="Full name"
                      className={`${inputCls} pl-10 pr-4`}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@email.com"
                      className={`${inputCls} pl-10 pr-4`}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">DJ Name <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={signupDjName}
                    onChange={(e) => setSignupDjName(e.target.value)}
                    placeholder="e.g. DJ Stine"
                    className={`${inputCls} px-4`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showSignupPwd ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className={`${inputCls} pl-10 pr-10`}
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowSignupPwd(!showSignupPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showSignupPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full geometric-gradient text-primary-foreground" disabled={signupLoading}>
                  {signupLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}

            {process.env.NODE_ENV !== "production" && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/api/login"}>
                  Sign in with Replit
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-6 mt-8">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-2 text-sm text-muted-foreground">
              <f.icon className="w-4 h-4" />
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
