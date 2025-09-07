import { useAuth } from "@/hooks/useAuth";
import { StineLogo } from "@/components/ui/geometric-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Radio, 
  Music, 
  Users, 
  TrendingUp, 
  Settings,
  User as UserIcon
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  listenerCount: number;
  isActive: boolean;
}

export function Sidebar() {
  const { user } = useAuth();
  
  const { data: activeRooms = [] } = useQuery<Room[]>({
    queryKey: ['/api/rooms/active'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col geometric-clip">
      {/* Brand Header */}
      <div className="p-6 border-b border-border">
        <StineLogo />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          <Button 
            variant="default" 
            className="w-full justify-start geometric-gradient text-primary-foreground"
            data-testid="button-live-stream"
          >
            <Radio className="w-5 h-5 mr-3" />
            Live Stream
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-muted"
            data-testid="button-my-library"
          >
            <Music className="w-5 h-5 mr-3" />
            My Library
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-muted"
            data-testid="button-followers"
          >
            <Users className="w-5 h-5 mr-3" />
            Followers
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-muted"
            data-testid="button-analytics"
          >
            <TrendingUp className="w-5 h-5 mr-3" />
            Analytics
          </Button>
        </div>
        
        {/* Rooms Section */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">ROOMS</p>
          <div className="space-y-1">
            {activeRooms.map((room) => (
              <Button
                key={room.id}
                variant="ghost"
                className="w-full justify-start hover:bg-muted p-3 h-auto"
                data-testid={`button-room-${room.id}`}
              >
                <div className={`w-2 h-2 rounded-full mr-3 ${room.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 text-left">
                  <span className="text-sm block">{room.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {room.listenerCount}
                </Badge>
              </Button>
            ))}
            
            {activeRooms.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-2">No active rooms</p>
            )}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" data-testid="text-user-name">
              {user?.djName || user?.firstName || 'DJ Stine'}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-user-status">
              {user?.isStreaming ? 'Streaming' : 'Online'}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
