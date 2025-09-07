import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StineLogo } from "@/components/ui/geometric-logo";
import { 
  Radio, 
  Users, 
  Music, 
  Zap, 
  Heart, 
  TrendingUp,
  Headphones,
  MessageCircle
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Radio,
      title: "Live Streaming",
      description: "Broadcast your DJ sets live to a global audience with crystal-clear audio quality"
    },
    {
      icon: Users, 
      title: "Community Chat",
      description: "Engage with your listeners through real-time chat and build your fanbase"
    },
    {
      icon: Music,
      title: "Music Library",
      description: "Upload and organize your tracks with smart categorization and playlist management"
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard", 
      description: "Track your performance with detailed insights about your audience and engagement"
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Get intelligent recommendations about your listeners and music selection"
    },
    {
      icon: Heart,
      title: "Fan Interaction",
      description: "Song requests, likes, and follows to connect directly with your audience"
    }
  ];

  const stats = [
    { label: "Active DJs", value: "2,847", icon: Headphones },
    { label: "Live Streams", value: "156", icon: Radio },
    { label: "Messages Sent", value: "892K", icon: MessageCircle },
    { label: "Tracks Played", value: "45.2K", icon: Music }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 diamond-shape bg-primary"></div>
          <div className="absolute top-40 right-20 w-24 h-24 diamond-shape bg-secondary"></div>
          <div className="absolute bottom-20 left-1/3 w-20 h-20 diamond-shape bg-accent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <StineLogo className="scale-150" />
            </div>
            
            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Stream. Connect. Create.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The ultimate DJ streaming platform with AI-powered insights, real-time community features, and geometric precision.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="geometric-gradient text-primary-foreground text-lg px-8 py-4"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-start-streaming"
              >
                <Radio className="w-5 h-5 mr-2" />
                Start Streaming
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 crystal-border"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="w-8 h-8 mx-auto mb-4 text-primary" />
                  <div className="text-3xl font-bold mb-2" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powered by <span className="text-primary">Geometric</span> Innovation
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of DJ streaming with cutting-edge features designed for modern creators.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="geometric-clip hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <Icon className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of DJs who are already streaming on Stine. Connect with your audience like never before.
          </p>
          <Button 
            size="lg" 
            className="geometric-gradient text-primary-foreground text-lg px-12 py-4"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-join-stine"
          >
            Join Stine Today
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <StineLogo />
            <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
              © 2025 Stine. Crafted with geometric precision.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
