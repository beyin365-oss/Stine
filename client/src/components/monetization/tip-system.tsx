import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Heart, 
  DollarSign, 
  Gift, 
  Star, 
  Send,
  Coffee,
  Music,
  Sparkles
} from "lucide-react";

interface TipSystemProps {
  recipientId: string;
  recipientName: string;
  recipientImage?: string;
  streamId?: string;
  onTipSent?: (tip: any) => void;
}

const predefinedAmounts = [
  { amount: 1, icon: Coffee, label: "Coffee", emoji: "☕" },
  { amount: 5, icon: Heart, label: "Love it", emoji: "❤️" },
  { amount: 10, icon: Star, label: "Amazing", emoji: "⭐" },
  { amount: 25, icon: Sparkles, label: "Epic", emoji: "✨" },
  { amount: 50, icon: Gift, label: "Generous", emoji: "🎁" },
  { amount: 100, icon: Music, label: "Support", emoji: "🎵" },
];

const tipMessages = [
  "Love your music! 🎵",
  "This track is fire! 🔥",
  "Keep the energy up! ⚡",
  "Amazing set! 👏",
  "You're incredible! 🌟",
  "Playing my favorite! 💕",
];

export function TipSystem({ 
  recipientId, 
  recipientName, 
  recipientImage, 
  streamId,
  onTipSent 
}: TipSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sendTipMutation = useMutation({
    mutationFn: async (tipData: any) => {
      return await apiRequest('POST', '/api/tips', tipData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      setIsDialogOpen(false);
      setSelectedAmount(null);
      setCustomAmount("");
      setTipMessage("");
      onTipSent?.(data);
      
      toast({
        title: "Tip Sent! 💕",
        description: `You sent $${data.amount} to ${recipientName}`,
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Tip Failed",
        description: "Unable to send tip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendTip = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount ($1 minimum)",
        variant: "destructive",
      });
      return;
    }

    if (amount > 1000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum tip amount is $1000",
        variant: "destructive",
      });
      return;
    }

    sendTipMutation.mutate({
      toUserId: recipientId,
      streamId: streamId,
      amount: amount.toString(),
      message: tipMessage,
      currency: 'USD',
    });
  };

  const getAmountDisplay = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    return amount ? `$${amount}` : "$0";
  };

  if (!user) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-gradient-to-r from-pink-500/10 to-purple-500/10">
            <Heart className="w-4 h-4 mr-2" />
            Tip DJ
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Please log in to send tips to DJs
            </p>
            <Button onClick={() => window.location.href = '/api/login'}>
              Log In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          data-testid="button-tip-dj"
        >
          <Heart className="w-4 h-4 mr-2" />
          Tip DJ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={recipientImage} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary">
                {recipientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">Send Tip</p>
              <p className="text-sm text-muted-foreground">to {recipientName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Selection */}
          <div>
            <h4 className="font-medium mb-3">Choose Amount</h4>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {predefinedAmounts.map(({ amount, icon: Icon, label, emoji }) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  className="flex flex-col h-auto p-3"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  data-testid={`button-tip-amount-${amount}`}
                >
                  <span className="text-lg mb-1">{emoji}</span>
                  <span className="text-sm font-semibold">${amount}</span>
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                min="1"
                max="1000"
                step="0.01"
                data-testid="input-custom-amount"
              />
            </div>
          </div>

          {/* Message Selection */}
          <div>
            <h4 className="font-medium mb-3">Add a Message (Optional)</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {tipMessages.map((message) => (
                <Button
                  key={message}
                  variant={tipMessage === message ? "default" : "outline"}
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => setTipMessage(message)}
                  data-testid={`button-tip-message-${message.substring(0, 10)}`}
                >
                  {message}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Or write your own message..."
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              maxLength={200}
              className="resize-none"
              data-testid="textarea-tip-message"
            />
          </div>

          {/* Tip Summary */}
          <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Tip Amount</p>
                  <p className="text-sm text-muted-foreground">
                    {tipMessage && `"${tipMessage}"`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary" data-testid="text-tip-amount">
                    {getAmountDisplay()}
                  </p>
                  <p className="text-xs text-muted-foreground">USD</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSendTip}
            disabled={
              sendTipMutation.isPending || 
              (!selectedAmount && !parseFloat(customAmount)) ||
              (parseFloat(customAmount) < 1 && !selectedAmount)
            }
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            data-testid="button-send-tip"
          >
            {sendTipMutation.isPending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Tip {getAmountDisplay()}
              </>
            )}
          </Button>

          {/* Payment Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Secure payment powered by Stripe
            </p>
            <p className="text-xs text-muted-foreground">
              Tips go directly to the DJ
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Recent Tips Display Component
interface RecentTipsProps {
  tips: Array<{
    id: string;
    amount: string;
    message?: string;
    fromUser?: { djName?: string; firstName?: string };
    createdAt: string;
  }>;
}

export function RecentTips({ tips }: RecentTipsProps) {
  if (tips.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No tips yet</p>
          <p className="text-sm text-muted-foreground">Tips will appear here during your stream</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Heart className="w-5 h-5 mr-2 text-pink-500" />
          Recent Tips ({tips.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.slice(0, 10).map((tip) => (
          <div 
            key={tip.id}
            className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-pink-50/50 to-purple-50/50 dark:from-pink-950/10 dark:to-purple-950/10"
            data-testid={`tip-${tip.id}`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-primary">
                  ${tip.amount}
                </span>
                <span className="text-sm text-muted-foreground">
                  from {tip.fromUser?.djName || tip.fromUser?.firstName || 'Anonymous'}
                </span>
              </div>
              {tip.message && (
                <p className="text-sm text-muted-foreground italic">
                  "{tip.message}"
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(tip.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}