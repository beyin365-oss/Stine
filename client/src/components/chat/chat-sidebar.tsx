import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MessageCircle, Send, Settings } from "lucide-react";

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  messageType: string;
  createdAt: string;
}

interface ChatSidebarProps {
  streamId?: string;
  className?: string;
}

export function ChatSidebar({ streamId, className = "" }: ChatSidebarProps) {
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { 
    isConnected, 
    listenerCount, 
    messages: wsMessages, 
    sendChatMessage 
  } = useWebSocket(streamId);

  // Combine local and WebSocket messages
  const allMessages = [...localMessages, ...wsMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !user || !streamId) return;

    // Add message locally for immediate feedback
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      message: messageText.trim(),
      messageType: 'chat',
      createdAt: new Date().toISOString()
    };

    setLocalMessages(prev => [...prev, newMessage]);

    // Send via WebSocket
    sendChatMessage(messageText.trim(), user.id);
    
    setMessageText("");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (userId: string) => {
    if (userId === user?.id) return user.djName || user.firstName || 'You';
    return `User ${userId.slice(-4)}`;
  };

  const getUserColor = (userId: string) => {
    // Generate consistent colors for users
    const colors = [
      'text-primary',
      'text-secondary', 
      'text-accent',
      'text-green-400',
      'text-purple-400',
      'text-pink-400',
      'text-orange-400'
    ];
    const index = parseInt(userId.slice(-2), 16) % colors.length;
    return colors[index];
  };

  return (
    <div className={`w-80 bg-card border-l border-border flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 text-primary mr-2" />
            <h3 className="font-semibold">Live Chat</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Badge variant="secondary" className="text-xs" data-testid="text-active-users">
              {listenerCount} active
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages-container">
        {allMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          allMessages.slice(-50).map((message) => (
            <div key={message.id} className="flex space-x-2" data-testid={`chat-message-${message.id}`}>
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarFallback className={`text-xs ${message.userId === user?.id ? 'bg-primary' : 'bg-gradient-to-br from-primary to-secondary'}`}>
                  {getUserDisplayName(message.userId).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-sm font-medium ${getUserColor(message.userId)}`} data-testid={`text-username-${message.id}`}>
                    {getUserDisplayName(message.userId)}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${message.id}`}>
                    {formatTime(message.createdAt)}
                  </span>
                </div>
                <p className="text-sm break-words" data-testid={`text-message-${message.id}`}>
                  {message.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input 
            type="text" 
            placeholder={isConnected ? "Send a message..." : "Connecting..."}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!isConnected || !user}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button 
            type="submit" 
            disabled={!messageText.trim() || !isConnected || !user}
            className="geometric-gradient text-primary-foreground"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Be respectful and follow community guidelines</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 h-auto"
            data-testid="button-chat-settings"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
