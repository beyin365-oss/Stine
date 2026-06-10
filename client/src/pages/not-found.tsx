import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StineLogo } from "@/components/ui/geometric-logo";
import { Home, ArrowLeft, Music } from "lucide-react";

export default function NotFound() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-4 geometric-clip border-2">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <StineLogo className="scale-100" />
          </div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-lg text-muted-foreground mb-2">Page Not Found</p>
          <p className="text-sm text-muted-foreground mb-6">
            The page you're looking for doesn't exist. Check the URL or go back to the app.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/home")} className="geometric-gradient text-primary-foreground">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Music className="w-3 h-3" /> STINE</span>
            <span>Stream • Connect • Create</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
