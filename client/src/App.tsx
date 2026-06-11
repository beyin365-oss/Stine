import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import SearchPage from "@/pages/search";
import LibraryPage from "@/pages/library";
import ArtistPage from "@/pages/artist";
import AlbumPage from "@/pages/album";
import PlaylistPage from "@/pages/playlist";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import NotificationsPage from "@/pages/notifications";
import MixerPage from "@/pages/mixer";
import StudioPage from "@/pages/studio";
import FeedPage from "@/pages/feed";
import DashboardPage from "@/pages/dashboard";
import SubscriptionPage from "@/pages/subscription";
import AdminPage from "@/pages/admin";
import TermsPage from "@/pages/terms";
import { useEffect } from "react";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MobileNav />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <MusicPlayer />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 diamond-shape bg-gradient-to-br from-primary via-secondary to-accent animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading STINE...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AuthenticatedLayout>
      <Component />
    </AuthenticatedLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 diamond-shape bg-gradient-to-br from-primary via-secondary to-accent animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading STINE...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated
        ? () => <AuthenticatedLayout><HomePage /></AuthenticatedLayout>
        : Landing}
      />
      <Route path="/login" component={LoginPage} />
      <Route path="/landing" component={Landing} />

      <Route path="/home" component={() => <ProtectedRoute component={HomePage} />} />
      <Route path="/search" component={() => <ProtectedRoute component={SearchPage} />} />
      <Route path="/library" component={() => <ProtectedRoute component={LibraryPage} />} />
      <Route path="/artist/:id" component={() => <ProtectedRoute component={ArtistPage} />} />
      <Route path="/album/:id" component={() => <ProtectedRoute component={AlbumPage} />} />
      <Route path="/playlist/:id" component={() => <ProtectedRoute component={PlaylistPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />
      <Route path="/mixer" component={() => <ProtectedRoute component={MixerPage} />} />
      <Route path="/studio" component={() => <ProtectedRoute component={StudioPage} />} />
      <Route path="/feed" component={() => <ProtectedRoute component={FeedPage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/subscription" component={() => <ProtectedRoute component={SubscriptionPage} />} />

      <Route path="/admin" component={AdminPage} />
      <Route path="/terms" component={TermsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlayerProvider>
          <Toaster />
          <Router />
        </PlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
