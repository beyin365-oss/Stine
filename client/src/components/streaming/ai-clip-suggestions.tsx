import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, Share2, Clock, TrendingUp } from "lucide-react";

export function AIClipSuggestions({ streamId }: { streamId?: string }) {
  const { data: suggestions = [] } = useQuery({
    queryKey: ['/api/clips/suggestions', streamId],
    refetchInterval: 60000,
  });

  const mockSuggestions = [
    { id: '1', title: 'Sick Drop at 12:34', timestamp: 754, duration: 45, engagement: 98, description: 'Peak energy moment' },
    { id: '2', title: 'Crowd React 15:22', timestamp: 922, duration: 30, engagement: 92, description: 'Listener reactions' },
    { id: '3', title: 'Smooth Transition 8:45', timestamp: 525, duration: 20, engagement: 87, description: 'Seamless mixing' },
  ];

  return (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
            AI-Suggested Clips
          </span>
          <Badge variant="secondary">Auto-detected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(suggestions.length > 0 ? suggestions : mockSuggestions).map((clip: any) => (
            <div 
              key={clip.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              data-testid={`clip-suggestion-${clip.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-sm">{clip.title}</h4>
                  <p className="text-xs text-muted-foreground">{clip.description}</p>
                </div>
                <Badge variant="outline" className="ml-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {clip.engagement}%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.floor(clip.timestamp / 60)}:{String(clip.timestamp % 60).padStart(2, '0')} ({clip.duration}s)
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" data-testid={`button-export-${clip.id}`}>
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button size="sm" variant="outline" className="flex-1" data-testid={`button-share-${clip.id}`}>
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
