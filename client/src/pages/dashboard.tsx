import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { mockAnalyticsData, mockActiveDJ, mockAIRecommendations } from "@/lib/mockData";
import {
  TrendingUp, Users, Heart, DollarSign, Music, Brain, Lightbulb,
  Target, Activity, Volume2, MapPin, Calendar, Clock, Star,
  BarChart3, PieChart, LineChart, Zap, ArrowUpRight, Globe, Smartphone
} from "lucide-react";

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState("day");
  const { toast } = useToast();
  const data = mockAnalyticsData;

  const MetricCard = ({ title, value, change, icon: Icon, color = "text-cyan-400" }: any) => (
    <Card className="geometric-clip">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xl font-bold">{value}</p>
              {change !== undefined && (
                <Badge variant={change >= 0 ? "default" : "destructive"} className="text-[10px]">
                  {change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : ""}{change}%
                </Badge>
              )}
            </div>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <Card className="geometric-clip">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                {mockActiveDJ.djName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold">{mockActiveDJ.djName}</h2>
                  <Badge className="bg-primary text-[10px]">{mockActiveDJ.verificationLevel}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{mockActiveDJ.bio}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {mockActiveDJ.genres.map((g) => (
                    <Badge key={g} variant="outline" className="text-[10px] capitalize">{g}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold">{mockActiveDJ.followerCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold">{mockActiveDJ.totalStreams}</p>
                <p className="text-xs text-muted-foreground">Streams</p>
              </div>
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold">${mockActiveDJ.totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard title="Listeners" value={data.listenerStats.total.toLocaleString()} change={data.listenerStats.growth} icon={Users} color="text-cyan-400" />
          <MetricCard title="Peak" value={data.listenerStats.peak.toLocaleString()} icon={TrendingUp} color="text-green-400" />
          <MetricCard title="Engagement" value={(data.engagement.likes + data.engagement.comments).toLocaleString()} icon={Heart} color="text-pink-400" />
          <MetricCard title="Tips" value={`$${data.engagement.tips.toLocaleString()}`} icon={DollarSign} color="text-yellow-400" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="audience" className="text-xs md:text-sm">Audience</TabsTrigger>
            <TabsTrigger value="tracks" className="text-xs md:text-sm">Tracks</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs md:text-sm">AI</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            {/* Time Range Selector */}
            <div className="flex gap-2">
              {["hour", "day", "week", "month"].map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? "default" : "outline"}
                  size="sm"
                  className="text-xs capitalize"
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range === "hour" ? "1H" : range === "day" ? "24H" : range === "week" ? "7D" : "30D"}
                </Button>
              ))}
            </div>

            {/* Listener & Engagement Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="geometric-clip">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-cyan-400" /> Listener Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end gap-1 px-2">
                    {data.timeSeriesData.map((point, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-[1px] items-end">
                          <div className="flex-1 bg-cyan-500/60 rounded-t" style={{ height: `${(point.listeners / 3000) * 100}px` }} />
                          <div className="flex-1 bg-pink-500/40 rounded-t" style={{ height: `${(point.engagement / 100) * 80}px` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{point.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="geometric-clip">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" /> Engagement vs Energy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end gap-1 px-2">
                    {data.timeSeriesData.map((point, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-[1px] items-end">
                          <div className="flex-1 bg-purple-500/60 rounded-t" style={{ height: `${(point.engagement / 100) * 100}px` }} />
                          <div className="flex-1 bg-yellow-500/40 rounded-t" style={{ height: `${(point.energy / 100) * 100}px` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{point.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stream Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-green-400" /> Live Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-sm">Current Listeners</span><span className="font-bold text-green-400">{data.listenerStats.total}</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm">Engagement Rate</span><span className="font-bold">87%</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm">Audio Quality</span><Badge className="text-xs">320kbps</Badge></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Volume2 className="w-4 h-4 text-blue-400" /> Stream Health</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1"><div className="flex justify-between text-sm"><span>Connection</span><span>98%</span></div><Progress value={98} className="h-1.5" /></div>
                  <div className="space-y-1"><div className="flex justify-between text-sm"><span>Server Load</span><span>45%</span></div><Progress value={45} className="h-1.5" /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-purple-400" /> Goals</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1"><div className="flex justify-between text-sm"><span>Listener Goal</span><span>75%</span></div><Progress value={75} className="h-1.5" /></div>
                  <div className="space-y-1"><div className="flex justify-between text-sm"><span>Duration Goal</span><span>60%</span></div><Progress value={60} className="h-1.5" /></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audience */}
          <TabsContent value="audience" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Age Demographics */}
              <Card className="geometric-clip">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><PieChart className="w-4 h-4" /> Age Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.demographics.ageGroups.map((group, i) => (
                      <div key={group.name} className="space-y-1">
                        <div className="flex justify-between text-sm"><span>{group.name}</span><span>{group.value}%</span></div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${group.value}%`, backgroundColor: COLORS[i] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Geographic */}
              <Card className="geometric-clip">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> Top Locations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.demographics.locations.map((loc, i) => (
                    <div key={loc.country} className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm flex-1">{loc.country}</span>
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(loc.listeners / 1247) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono">{loc.listeners}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Devices */}
              <Card className="geometric-clip">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Smartphone className="w-4 h-4 text-purple-400" /> Devices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.demographics.devices.map((device, i) => (
                    <div key={device.type} className="space-y-1">
                      <div className="flex justify-between text-sm"><span>{device.type}</span><span>{device.percentage}%</span></div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: `${device.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tracks */}
          <TabsContent value="tracks" className="space-y-4">
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400" /> Top Performing Tracks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topTracks.map((track, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground">{track.artist}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center"><p className="font-bold">{track.plays}</p><p className="text-muted-foreground">Plays</p></div>
                      <div className="text-center"><p className="font-bold">{track.likes}</p><p className="text-muted-foreground">Likes</p></div>
                      <div className="text-center"><p className="font-bold">{track.requests}</p><p className="text-muted-foreground">Requests</p></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="geometric-clip">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" /> AI Audience Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{data.aiInsights.audienceProfile}</p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Best Genres</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {data.aiInsights.bestPerformingGenres.map((g) => (
                          <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Best Times</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {data.aiInsights.optimalStreamingTimes.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="geometric-clip">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" /> AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.aiInsights.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent text-sm">
                      {rec}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* AI Mixing Recommendations */}
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" /> AI Mixing Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mockAIRecommendations.map((rec) => (
                    <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{rec.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{rec.type}</Badge>
                          <span className="text-xs text-muted-foreground">{Math.round(rec.confidence * 100)}% confidence</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
