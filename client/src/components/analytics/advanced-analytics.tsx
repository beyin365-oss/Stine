import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  Music, 
  Clock, 
  Star,
  Target,
  Brain,
  Lightbulb,
  Calendar,
  MapPin,
  Volume2,
  Activity
} from "lucide-react";

interface AnalyticsData {
  listenerStats: {
    total: number;
    peak: number;
    average: number;
    growth: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    tips: number;
  };
  demographics: {
    ageGroups: Array<{ name: string; value: number }>;
    locations: Array<{ country: string; listeners: number }>;
    devices: Array<{ type: string; percentage: number }>;
  };
  timeSeriesData: Array<{
    time: string;
    listeners: number;
    engagement: number;
    energy: number;
  }>;
  topTracks: Array<{
    title: string;
    artist: string;
    plays: number;
    likes: number;
    requests: number;
  }>;
  aiInsights: {
    audienceProfile: string;
    recommendations: string[];
    bestPerformingGenres: string[];
    optimalStreamingTimes: string[];
    engagementTrends: string;
  };
}

interface AdvancedAnalyticsProps {
  streamId?: string;
  timeRange?: 'hour' | 'day' | 'week' | 'month';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AdvancedAnalytics({ streamId, timeRange = 'day' }: AdvancedAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/advanced', streamId, selectedTimeRange],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: aiRecommendations } = useQuery<any[]>({
    queryKey: ['/api/analytics/ai-recommendations', streamId],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = "text-primary" 
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<any>;
    color?: string;
  }) => (
    <Card className="geometric-clip">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {value}
              </p>
              {change !== undefined && (
                <Badge 
                  variant={change >= 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {change >= 0 ? "+" : ""}{change}%
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
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-report">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Listeners"
          value={analyticsData?.listenerStats.total || 0}
          change={analyticsData?.listenerStats.growth}
          icon={Users}
          color="text-blue-500"
        />
        <MetricCard
          title="Peak Concurrent"
          value={analyticsData?.listenerStats.peak || 0}
          icon={TrendingUp}
          color="text-green-500"
        />
        <MetricCard
          title="Total Engagement"
          value={analyticsData?.engagement.likes + analyticsData?.engagement.comments || 0}
          icon={Heart}
          color="text-pink-500"
        />
        <MetricCard
          title="Tips Received"
          value={`$${analyticsData?.engagement.tips || 0}`}
          icon={Star}
          color="text-yellow-500"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="real-time">Real-time</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Listener Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Listener Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData?.timeSeriesData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="listeners" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement & Energy</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.timeSeriesData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#82ca9d" 
                      name="Engagement"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="energy" 
                      stroke="#ffc658" 
                      name="Energy Level"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Age Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Age Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.demographics.ageGroups || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analyticsData?.demographics.ageGroups.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analyticsData?.demographics.locations.slice(0, 5).map((location, index) => (
                  <div key={location.country} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{location.country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-muted rounded">
                        <div 
                          className="h-full bg-primary rounded"
                          style={{ 
                            width: `${(location.listeners / (analyticsData.demographics.locations[0]?.listeners || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{location.listeners}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Device Types */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData?.demographics.devices || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topTracks.map((track, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`top-track-${index}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{track.plays}</p>
                        <p className="text-muted-foreground">Plays</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{track.likes}</p>
                        <p className="text-muted-foreground">Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{track.requests}</p>
                        <p className="text-muted-foreground">Requests</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audience Profile */}
            <Card className="geometric-clip">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-primary" />
                  AI Audience Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4" data-testid="text-audience-profile">
                  {analyticsData?.aiInsights.audienceProfile || "No analysis available yet."}
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Best Performing Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {analyticsData?.aiInsights.bestPerformingGenres.map((genre) => (
                        <Badge key={genre} variant="secondary">{genre}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Optimal Streaming Times</h4>
                    <div className="flex flex-wrap gap-2">
                      {analyticsData?.aiInsights.optimalStreamingTimes.map((time) => (
                        <Badge key={time} variant="outline">{time}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="geometric-clip">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-accent" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.aiInsights.recommendations.map((recommendation, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent"
                      data-testid={`ai-recommendation-${index}`}
                    >
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Trends Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground" data-testid="text-engagement-trends">
                {analyticsData?.aiInsights.engagementTrends || "Analyzing engagement patterns..."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="real-time" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-500" />
                  Live Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Listeners</span>
                  <span className="text-2xl font-bold text-green-500" data-testid="text-current-listeners">
                    {analyticsData?.listenerStats.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Engagement Rate</span>
                  <span className="text-lg font-semibold">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Audio Quality</span>
                  <Badge variant="default">High (320kbps)</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-blue-500" />
                  Stream Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Connection Quality</span>
                    <span className="text-sm">98%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Server Load</span>
                    <span className="text-sm">45%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-500" />
                  Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Listener Goal (100)</span>
                    <span className="text-sm">75%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Stream Duration (2h)</span>
                    <span className="text-sm">60%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}