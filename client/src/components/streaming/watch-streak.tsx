import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Gift } from "lucide-react";

export function WatchStreak() {
  const streak = 12;
  const nextReward = 15;
  
  return (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Flame className="w-5 h-5 mr-2 text-orange-500" />
          Watch Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-500" data-testid="streak-count">{streak}</div>
          <p className="text-sm text-muted-foreground">streams watched</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Next reward at {nextReward} streams</span>
            <span>{streak}/{nextReward}</span>
          </div>
          <Progress value={(streak / nextReward) * 100} />
        </div>
        <div className="p-2 bg-orange-500/10 rounded text-sm">
          <div className="flex items-center mb-1">
            <Gift className="w-4 h-4 mr-2" />
            <span className="font-medium">Rewards unlocked</span>
          </div>
          <ul className="text-xs space-y-1 ml-6">
            <li>✓ Channel Points x2</li>
            <li>✓ Exclusive badge</li>
            <li>✓ Emote unlock</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
