import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StineLogo } from "@/components/ui/geometric-logo";
import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, Radio, Music, Headphones } from "lucide-react";

export default function LoginPage() {
  const [_, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    setLocation("/");
  };

  const features = [
    { icon: Radio, text: "Live DJ Streams" },
    { icon: Music, text: "Millions of Tracks" },
    { icon: Headphones, text: "Crystal Clear Audio" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="geometric-clip border-2">
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-8">
              <StineLogo className="mx-auto scale-125 mb-4" />
              <h1 className="text-2xl font-bold mb-1">Welcome to STINE</h1>
              <p className="text-sm text-muted-foreground">Sign in to stream, discover, and connect</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full geometric-gradient text-primary-foreground" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/api/login'}
            >
              Sign in with Replit
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <button className="text-primary font-medium hover:underline">Sign up</button>
            </p>
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
