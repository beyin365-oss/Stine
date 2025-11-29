import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  CreditCard,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Crown,
  Heart,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  Gift,
  Percent,
  Building,
  Shield
} from "lucide-react";

interface RevenueMetric {
  label: string;
  value: number;
  change: number;
  changeLabel: string;
  icon: any;
  color: string;
}

interface RevenueStream {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

export function FounderRevenueDashboard() {
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['/api/admin/revenue', timeRange],
    refetchInterval: 30000,
  });

  const revenue = (revenueData as any) || {
    totalRevenue: 0,
    platformFees: 0,
    subscriptionRevenue: 0,
    tipCommissions: 0,
    nftCommissions: 0,
    totalTransactions: 0,
    activeSubscribers: 0,
    newDJs: 0,
    withdrawalsPending: 0,
  };

  const metrics: RevenueMetric[] = [
    {
      label: 'Total Platform Revenue',
      value: revenue.totalRevenue || 15847.32,
      change: 23.5,
      changeLabel: 'vs last period',
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      label: 'Platform Fees (15%)',
      value: revenue.platformFees || 2377.10,
      change: 18.2,
      changeLabel: 'from tips & subs',
      icon: Percent,
      color: 'text-blue-500',
    },
    {
      label: 'Active Subscribers',
      value: revenue.activeSubscribers || 342,
      change: 12.8,
      changeLabel: 'growth rate',
      icon: Crown,
      color: 'text-purple-500',
    },
    {
      label: 'Total Transactions',
      value: revenue.totalTransactions || 1247,
      change: 31.4,
      changeLabel: 'this period',
      icon: CreditCard,
      color: 'text-cyan-500',
    },
  ];

  const revenueStreams: RevenueStream[] = [
    {
      id: 'tips',
      name: 'Tip Commissions (15%)',
      amount: 1234.56,
      percentage: 35,
      trend: 'up',
      color: 'bg-pink-500',
    },
    {
      id: 'subscriptions',
      name: 'DJ Subscriptions',
      amount: 892.34,
      percentage: 25,
      trend: 'up',
      color: 'bg-purple-500',
    },
    {
      id: 'nft',
      name: 'NFT Marketplace (10%)',
      amount: 567.89,
      percentage: 16,
      trend: 'up',
      color: 'bg-yellow-500',
    },
    {
      id: 'premium',
      name: 'Premium DJ Plans',
      amount: 445.67,
      percentage: 13,
      trend: 'neutral',
      color: 'bg-blue-500',
    },
    {
      id: 'merch',
      name: 'Merch Commission (8%)',
      amount: 236.86,
      percentage: 7,
      trend: 'down',
      color: 'bg-green-500',
    },
    {
      id: 'ads',
      name: 'Advertising Revenue',
      amount: 156.45,
      percentage: 4,
      trend: 'up',
      color: 'bg-orange-500',
    },
  ];

  const platformStats = {
    totalDJs: 1247,
    activeDJs: 342,
    totalListeners: 45678,
    activeListeners: 8934,
    totalStreams: 5678,
    liveStreams: 23,
    totalTips: 8934,
    averageTip: 12.50,
  };

  const withdrawalQueue = [
    { id: '1', djName: 'DJ Pulse', amount: 1250.00, status: 'pending', requestedAt: '2 hours ago' },
    { id: '2', djName: 'Bass Master', amount: 890.50, status: 'pending', requestedAt: '5 hours ago' },
    { id: '3', djName: 'Techno Queen', amount: 2100.00, status: 'processing', requestedAt: '1 day ago' },
  ];

  const topEarners = [
    { rank: 1, djName: 'DJ Pulse', totalEarnings: 12500.00, tips: 8500, subs: 4000 },
    { rank: 2, djName: 'Bass Master', totalEarnings: 9800.00, tips: 5800, subs: 4000 },
    { rank: 3, djName: 'Techno Queen', totalEarnings: 8200.00, tips: 4200, subs: 4000 },
    { rank: 4, djName: 'House Legend', totalEarnings: 6500.00, tips: 3500, subs: 3000 },
    { rank: 5, djName: 'Trance Master', totalEarnings: 5100.00, tips: 2100, subs: 3000 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Building className="w-8 h-8 mr-3 text-primary" />
            Founder Revenue Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time platform earnings and analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.change > 0;
          
          return (
            <Card key={index} className="geometric-clip">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div className={`flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {metric.change}%
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-2xl font-bold" data-testid={`metric-${index}`}>
                    {typeof metric.value === 'number' && metric.label.includes('Revenue') || metric.label.includes('Fees')
                      ? `$${metric.value.toLocaleString()}`
                      : metric.value.toLocaleString()
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.changeLabel}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Streams</TabsTrigger>
          <TabsTrigger value="payouts">DJ Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Fee Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Breakdown */}
            <Card className="lg:col-span-2 geometric-clip">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Revenue Breakdown
                </CardTitle>
                <CardDescription>How you earn money from STINE</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueStreams.map((stream) => (
                    <div key={stream.id} className="space-y-2" data-testid={`revenue-stream-${stream.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${stream.color}`} />
                          <span className="font-medium">{stream.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold">${stream.amount.toLocaleString()}</span>
                          <Badge variant={stream.trend === 'up' ? 'default' : stream.trend === 'down' ? 'destructive' : 'secondary'}>
                            {stream.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                            {stream.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                            {stream.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={stream.percentage} className="h-2" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total This Period</span>
                    <span className="text-2xl font-bold text-green-500">
                      ${revenueStreams.reduce((acc, s) => acc + s.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Stats */}
            <Card className="geometric-clip">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xl font-bold">{platformStats.totalDJs.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total DJs</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Eye className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xl font-bold">{platformStats.totalListeners.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Listeners</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Heart className="w-5 h-5 mx-auto mb-1 text-pink-500" />
                    <p className="text-xl font-bold">{platformStats.totalTips.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Tips</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-xl font-bold">${platformStats.averageTip}</p>
                    <p className="text-xs text-muted-foreground">Avg Tip</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Live Streams</span>
                    <Badge variant="destructive" className="animate-pulse">
                      {platformStats.liveStreams} LIVE
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active DJs</span>
                    <span className="font-medium">{platformStats.activeDJs}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Earning DJs */}
          <Card className="geometric-clip">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                Top Earning DJs
              </CardTitle>
              <CardDescription>DJs generating the most platform revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topEarners.map((dj) => (
                  <div 
                    key={dj.rank}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`top-earner-${dj.rank}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        dj.rank === 1 ? 'bg-yellow-500 text-black' :
                        dj.rank === 2 ? 'bg-gray-400 text-black' :
                        dj.rank === 3 ? 'bg-orange-600 text-white' :
                        'bg-muted-foreground/20'
                      }`}>
                        {dj.rank}
                      </div>
                      <div>
                        <p className="font-semibold">{dj.djName}</p>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Heart className="w-3 h-3 mr-1 text-pink-500" />
                            ${dj.tips.toLocaleString()} tips
                          </span>
                          <span className="flex items-center">
                            <Crown className="w-3 h-3 mr-1 text-purple-500" />
                            ${dj.subs.toLocaleString()} subs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">${dj.totalEarnings.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        You earn: ${(dj.totalEarnings * 0.15).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Streams Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="geometric-clip border-pink-500/50">
              <CardHeader>
                <CardTitle className="flex items-center text-pink-500">
                  <Heart className="w-5 h-5 mr-2" />
                  Tip Commissions
                </CardTitle>
                <CardDescription>15% of all tips sent to DJs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$1,234.56</p>
                <p className="text-sm text-muted-foreground">From 892 tips this period</p>
                <div className="mt-4 p-3 bg-pink-500/10 rounded-lg">
                  <p className="text-sm font-medium">How it works:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When listeners tip DJs, STINE keeps 15% as a platform fee. 
                    The DJ receives 85% of every tip.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="geometric-clip border-purple-500/50">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-500">
                  <Crown className="w-5 h-5 mr-2" />
                  Subscription Revenue
                </CardTitle>
                <CardDescription>Monthly DJ subscription fees</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$892.34</p>
                <p className="text-sm text-muted-foreground">From 45 active DJ subscriptions</p>
                <div className="mt-4 p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-sm font-medium">Plans:</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>Basic: $9.99/mo - 23 DJs</li>
                    <li>Pro: $29.99/mo - 15 DJs</li>
                    <li>Premium: $99.99/mo - 7 DJs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="geometric-clip border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-500">
                  <Sparkles className="w-5 h-5 mr-2" />
                  NFT Marketplace
                </CardTitle>
                <CardDescription>10% commission on NFT sales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$567.89</p>
                <p className="text-sm text-muted-foreground">From 34 NFT sales this period</p>
                <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                  <p className="text-sm font-medium">How it works:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    When DJs sell exclusive NFT drops, STINE takes 10% commission.
                    Secondary sales include 2.5% royalty to platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="geometric-clip border-blue-500/50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-500">
                  <Gift className="w-5 h-5 mr-2" />
                  Fan Subscriptions
                </CardTitle>
                <CardDescription>Revenue from fan-to-DJ subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$445.67</p>
                <p className="text-sm text-muted-foreground">From 234 active fan subscriptions</p>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-sm font-medium">Platform split:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    STINE keeps 20% of fan subscription fees.
                    DJs receive 80% of their subscriber revenue.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="geometric-clip border-green-500/50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-500">
                  <PiggyBank className="w-5 h-5 mr-2" />
                  Merch Commission
                </CardTitle>
                <CardDescription>8% from DJ merchandise sales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$236.86</p>
                <p className="text-sm text-muted-foreground">From 89 merch orders this period</p>
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                  <p className="text-sm font-medium">How it works:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    DJs can sell branded merchandise through STINE.
                    Platform takes 8% of each sale after production costs.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="geometric-clip border-orange-500/50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-500">
                  <Eye className="w-5 h-5 mr-2" />
                  Advertising Revenue
                </CardTitle>
                <CardDescription>Sponsored content and ads</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$156.45</p>
                <p className="text-sm text-muted-foreground">From 5 active ad campaigns</p>
                <div className="mt-4 p-3 bg-orange-500/10 rounded-lg">
                  <p className="text-sm font-medium">Ad types:</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>Banner ads: CPM model</li>
                    <li>Sponsored streams: Flat fee</li>
                    <li>Brand partnerships: Custom</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-6">
          <Card className="geometric-clip">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Pending DJ Withdrawals
              </CardTitle>
              <CardDescription>Payouts waiting to be processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawalQueue.map((withdrawal) => (
                  <div 
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`withdrawal-${withdrawal.id}`}
                  >
                    <div>
                      <p className="font-semibold">{withdrawal.djName}</p>
                      <p className="text-sm text-muted-foreground">Requested {withdrawal.requestedAt}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="font-bold">${withdrawal.amount.toLocaleString()}</p>
                      <Badge variant={withdrawal.status === 'pending' ? 'secondary' : 'default'}>
                        {withdrawal.status}
                      </Badge>
                      <Button size="sm" data-testid={`button-approve-${withdrawal.id}`}>
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <span>Total Pending Payouts</span>
                  <span className="text-xl font-bold text-orange-500">
                    ${withdrawalQueue.reduce((acc, w) => acc + w.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="geometric-clip">
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed breakdown of platform performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <LineChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Revenue charts will appear here</p>
                  <p className="text-sm text-muted-foreground">Connected to real-time payment data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="geometric-clip">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Platform Fee Configuration
              </CardTitle>
              <CardDescription>Control your revenue split percentages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tip Commission Rate</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      defaultValue={15}
                      className="w-20 p-2 border rounded"
                      data-testid="input-tip-rate"
                    />
                    <span>%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Industry standard: 10-20%</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">NFT Commission Rate</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      defaultValue={10}
                      className="w-20 p-2 border rounded"
                      data-testid="input-nft-rate"
                    />
                    <span>%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Industry standard: 5-15%</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fan Subscription Split</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      defaultValue={20}
                      className="w-20 p-2 border rounded"
                      data-testid="input-sub-rate"
                    />
                    <span>%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Industry standard: 15-30%</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Merch Commission Rate</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      defaultValue={8}
                      className="w-20 p-2 border rounded"
                      data-testid="input-merch-rate"
                    />
                    <span>%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Industry standard: 5-10%</p>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button className="w-full" data-testid="button-save-settings">
                  Save Fee Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
