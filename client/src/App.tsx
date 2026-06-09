import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { MobileNav } from "@/components/navigation/mobile-nav";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminPage from "@/pages/admin";
import MixerPage from "@/pages/mixer";
import StudioPage from "@/pages/studio";
import FeedPage from "@/pages/feed";
import DashboardPage from "@/pages/dashboard";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MobileNav />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 diamond-shape bg-gradient-to-br from-primary via-secondary to-accent animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading STINE...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={isAuthenticated ? () => <AuthenticatedLayout><MixerPage /></AuthenticatedLayout> : Landing} />

      {/* Authenticated app routes */}
      <Route path="/mixer" component={() => <AuthenticatedLayout><MixerPage /></AuthenticatedLayout>} />
      <Route path="/studio" component={() => <AuthenticatedLayout><StudioPage /></AuthenticatedLayout>} />
      <Route path="/feed" component={() => <AuthenticatedLayout><FeedPage /></AuthenticatedLayout>} />
      <Route path="/dashboard" component={() => <AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />

      {/* Admin route */}
      <Route path="/admin" component={AdminPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
