import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share, 
  UserPlus, 
  Radio,
  Zap,
  TrendingUp
} from "lucide-react";

interface AnalyticsData {
  newListeners: number;
  returningFans: number;
  likes: number;
  comments: number;
  shares: number;
  newFollows: number;
  bitrate: string;
  latency: string;
  dropRate: string;
}

interface AnalyticsCardsProps {
  data?: AnalyticsData;
}

// Default data for when no data is provided
const defaultData: AnalyticsData = {
  newListeners: 64,
  returningFans: 36,
  likes: 346,
  comments: 89,
  shares: 23,
  newFollows: 12,
  bitrate: "320 kbps",
  latency: "2.3s",
  dropRate: "0.1%"
};

export function AnalyticsCards({ data = defaultData }: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Audience Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="w-5 h-5 text-primary mr-2" />
            Audience Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>New Listeners</span>
              <span className="text-primary font-mono" data-testid="text-new-listeners">
                {data.newListeners}%
              </span>
            </div>
            <Progress value={data.newListeners} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Returning Fans</span>
              <span className="text-secondary font-mono" data-testid="text-returning-fans">
                {data.returningFans}%
              </span>
            </div>
            <Progress value={data.returningFans} className="h-2 [&>div]:bg-secondary" />
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="w-5 h-5 text-secondary mr-2" />
            Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Heart className="w-4 h-4 text-primary mr-1" />
                <div className="text-2xl font-bold text-primary" data-testid="text-likes-count">
                  {data.likes}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MessageCircle className="w-4 h-4 text-secondary mr-1" />
                <div className="text-2xl font-bold text-secondary" data-testid="text-comments-count">
                  {data.comments}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Comments</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Share className="w-4 h-4 text-accent mr-1" />
                <div className="text-2xl font-bold text-accent" data-testid="text-shares-count">
                  {data.shares}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Shares</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <UserPlus className="w-4 h-4 text-green-400 mr-1" />
                <div className="text-2xl font-bold text-green-400" data-testid="text-follows-count">
                  {data.newFollows}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">New Follows</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stream Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Radio className="w-5 h-5 text-accent mr-2" />
            Stream Quality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Zap className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-sm">Bitrate</span>
            </div>
            <span className="font-mono text-green-400" data-testid="text-bitrate">
              {data.bitrate}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Radio className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-sm">Latency</span>
            </div>
            <span className="font-mono text-yellow-400" data-testid="text-latency">
              {data.latency}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-sm">Drop Rate</span>
            </div>
            <span className="font-mono text-green-400" data-testid="text-drop-rate">
              {data.dropRate}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
