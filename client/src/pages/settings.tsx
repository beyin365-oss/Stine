import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Bell, Lock, User, Palette, Globe, Volume2, Download, Shield, LogOut, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("account");

  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    offlineMode: false,
    highQuality: true,
    explicitContent: true,
    dataSaver: false,
    autoPlay: true,
    privateProfile: false,
  });

  const toggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    toast({ title: "Setting updated" });
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account, preferences, and app settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" className="gap-1"><User className="w-3 h-3" /> Account</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1"><Bell className="w-3 h-3" /> Notifications</TabsTrigger>
            <TabsTrigger value="playback" className="gap-1"><Volume2 className="w-3 h-3" /> Playback</TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1"><Shield className="w-3 h-3" /> Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-4 space-y-4">
            <Card className="geometric-clip">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                    <img src={user?.avatar || "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold">{user?.name || user?.username || "DJ Stine"}</p>
                    <p className="text-sm text-muted-foreground">@{user?.username || "djstine"}</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => setLocation("/profile")}>
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {[
              { label: "Change Password", icon: Lock, action: () => toast({ title: "Change password" }) },
              { label: "Email Preferences", icon: Globe, action: () => toast({ title: "Email preferences" }) },
              { label: "Connected Accounts", icon: User, action: () => toast({ title: "Connected accounts" }) },
              { label: "Language", icon: Globe, action: () => toast({ title: "Language settings" }) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors cursor-pointer" onClick={item.action}>
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            {[
              { label: "Push Notifications", key: "pushNotifications", desc: "Get notified about new streams, tips, and followers" },
              { label: "Email Notifications", key: "emailNotifications", desc: "Receive weekly summaries and important updates" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-card/50">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={settings[item.key as keyof typeof settings] as boolean} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="playback" className="mt-4 space-y-4">
            {[
              { label: "High Quality Audio", key: "highQuality", desc: "Stream at 320kbps when available" },
              { label: "Offline Mode", key: "offlineMode", desc: "Only play downloaded content" },
              { label: "Data Saver", key: "dataSaver", desc: "Reduce audio quality to save data" },
              { label: "Auto Play", key: "autoPlay", desc: "Continue playing similar tracks" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-card/50">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={settings[item.key as keyof typeof settings] as boolean} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="privacy" className="mt-4 space-y-4">
            {[
              { label: "Explicit Content", key: "explicitContent", desc: "Allow explicit content in streams" },
              { label: "Private Profile", key: "privateProfile", desc: "Only followers can see your activity" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-card/50">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={settings[item.key as keyof typeof settings] as boolean} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="pt-8 border-t border-border">
          <Button variant="destructive" className="w-full" onClick={() => window.location.href = "/api/logout"}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
