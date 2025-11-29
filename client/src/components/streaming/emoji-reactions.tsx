import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Heart, Flame, Zap, Sparkles, RotateCw, Eye } from "lucide-react";

const emojis = [
  { emoji: "❤️", label: "Love", icon: Heart, color: "text-red-500" },
  { emoji: "🔥", label: "Fire", icon: Flame, color: "text-orange-500" },
  { emoji: "⚡", label: "Energy", icon: Zap, color: "text-yellow-500" },
  { emoji: "✨", label: "Amazing", icon: Sparkles, color: "text-purple-500" },
  { emoji: "🙌", label: "Vibe", color: "text-blue-500" },
  { emoji: "🎉", label: "Party" },
  { emoji: "🔊", label: "Sound" },
  { emoji: "🎵", label: "Music" },
];

interface EmojiReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export function EmojiReactions({ streamId }: { streamId?: string }) {
  const [reactions, setReactions] = useState<Record<string, EmojiReaction>>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = (emoji: string) => {
    setReactions(prev => {
      const current = prev[emoji] || { emoji, count: 0, reacted: false };
      return {
        ...prev,
        [emoji]: {
          ...current,
          count: current.reacted ? current.count - 1 : current.count + 1,
          reacted: !current.reacted,
        }
      };
    });
    setIsOpen(false);
  };

  const topReactions = Object.values(reactions)
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="flex items-center space-x-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            data-testid="button-reactions"
          >
            <span>React</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="grid grid-cols-4 gap-2">
            {emojis.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-muted rounded"
                title={label}
                data-testid={`reaction-${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {topReactions.map(({ emoji, count }) => (
        <Badge 
          key={emoji}
          variant="secondary"
          className="cursor-pointer hover:bg-primary"
          onClick={() => handleReaction(emoji)}
          data-testid={`reaction-badge-${emoji}`}
        >
          {emoji} {count}
        </Badge>
      ))}
    </div>
  );
}
