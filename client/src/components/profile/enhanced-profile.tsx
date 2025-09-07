import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  User, 
  Settings, 
  Trophy, 
  Calendar, 
  Music, 
  Heart, 
  Users, 
  Star,
  Edit3,
  Save,
  X,
  Plus,
  Clock,
  MapPin,
  Link as LinkIcon,
  Instagram,
  Twitter
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: string;
  points: number;
  unlockedAt?: string;
  progress?: number;
  requirement: { type: string; value: number };
}

interface ScheduledStream {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  genre?: string;
  status: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: React.ComponentType<any>;
}

const socialPlatforms = [
  { platform: 'instagram', icon: Instagram, label: 'Instagram' },
  { platform: 'twitter', icon: Twitter, label: 'Twitter' },
  { platform: 'soundcloud', icon: Music, label: 'SoundCloud' },
  { platform: 'spotify', icon: Music, label: 'Spotify' },
  { platform: 'website', icon: LinkIcon, label: 'Website' },
];

export function EnhancedProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    djName: user?.djName || '',
    bio: user?.bio || '',
    genres: user?.genres || [],
    socialLinks: user?.socialLinks || {},
  });

  // Fetch user achievements
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/user/achievements'],
    refetchInterval: 60000,
  });

  // Fetch scheduled streams
  const { data: scheduledStreams = [] } = useQuery<ScheduledStream[]>({
    queryKey: ['/api/user/scheduled-streams'],
    refetchInterval: 30000,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    refetchInterval: 60000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest('PATCH', '/api/user/profile', profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
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
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editedProfile);
  };

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);

  const getAchievementProgress = (achievement: Achievement) => {
    if (achievement.unlockedAt) return 100;
    if (!achievement.progress) return 0;
    return Math.min((achievement.progress / achievement.requirement.value) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVerificationBadge = () => {
    switch (user?.verificationLevel) {
      case 'verified':
        return <Badge className="bg-blue-500"><Star className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pro':
        return <Badge className="bg-purple-500"><Trophy className="w-3 h-3 mr-1" />Pro</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="geometric-clip">
        <CardContent className="p-8">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary">
                  {(user?.djName || user?.firstName || 'DJ').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background ${
                user?.isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {isEditing ? (
                  <Input
                    value={editedProfile.djName}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, djName: e.target.value }))}
                    className="text-2xl font-bold h-auto p-1 border-none bg-transparent"
                    placeholder="DJ Name"
                    data-testid="input-dj-name"
                  />
                ) : (
                  <h1 className="text-3xl font-bold" data-testid="text-dj-name">
                    {user?.djName || user?.firstName || 'Unnamed DJ'}
                  </h1>
                )}
                {getVerificationBadge()}
                {user?.isStreaming && (
                  <Badge variant="destructive" className="animate-pulse">
                    🔴 LIVE
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {user?.followerCount || 0} followers
                </span>
                <span className="flex items-center">
                  <Music className="w-4 h-4 mr-1" />
                  {user?.totalStreams || 0} streams
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.floor((user?.totalStreamTime || 0) / 60)}h total
                </span>
                <span className="flex items-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  {user?.achievementPoints || 0} points
                </span>
              </div>

              {isEditing ? (
                <Textarea
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about your music style and journey..."
                  className="mb-4"
                  data-testid="textarea-bio"
                />
              ) : (
                <p className="text-muted-foreground mb-4" data-testid="text-bio">
                  {user?.bio || "No bio available"}
                </p>
              )}

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(user?.genres || []).map((genre: string) => (
                  <Badge key={genre} variant="outline">{genre}</Badge>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-profile"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
                <Button variant="outline" data-testid="button-share-profile">
                  Share Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content Tabs */}
      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid gap-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-primary" />
                  Achievement Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="text-unlocked-count">
                      {unlockedAchievements.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Unlocked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary" data-testid="text-total-points">
                      {user?.achievementPoints || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent" data-testid="text-completion-rate">
                      {achievements.length > 0 ? Math.round((unlockedAchievements.length / achievements.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Completion</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unlocked Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Unlocked Achievements ({unlockedAchievements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedAchievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className="p-4 border rounded-lg geometric-clip bg-gradient-to-br from-primary/10 to-secondary/10"
                      data-testid={`achievement-unlocked-${achievement.id}`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">{achievement.category}</Badge>
                        <span className="text-sm font-mono text-primary">+{achievement.points} pts</span>
                      </div>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Unlocked {formatDate(achievement.unlockedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Locked Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>In Progress ({lockedAchievements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lockedAchievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className="p-4 border rounded-lg opacity-75"
                      data-testid={`achievement-locked-${achievement.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{achievement.category}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">+{achievement.points} pts</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress || 0} / {achievement.requirement.value}</span>
                        </div>
                        <Progress value={getAchievementProgress(achievement)} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Upcoming Streams
                </span>
                <Button data-testid="button-schedule-stream">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Stream
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledStreams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled streams</p>
                  <p className="text-sm">Schedule your next stream to keep your audience engaged!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledStreams.map((stream) => (
                    <div 
                      key={stream.id}
                      className="p-4 border rounded-lg"
                      data-testid={`scheduled-stream-${stream.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{stream.title}</h4>
                          <p className="text-sm text-muted-foreground">{stream.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(stream.scheduledAt)}
                            </span>
                            {stream.duration && (
                              <span>{stream.duration}min</span>
                            )}
                            {stream.genre && (
                              <Badge variant="outline">{stream.genre}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Cancel</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Music className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold" data-testid="text-total-tracks">
                    {userStats?.totalTracks || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Tracks</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <div className="text-2xl font-bold" data-testid="text-total-likes">
                    {userStats?.totalLikes || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Likes</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-secondary" />
                  <div className="text-2xl font-bold" data-testid="text-avg-listeners">
                    {userStats?.avgListeners || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Listeners</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Star className="w-8 h-8 mx-auto mb-2 text-accent" />
                  <div className="text-2xl font-bold" data-testid="text-rating">
                    {userStats?.rating || 0}/5
                  </div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Social Links */}
              <div>
                <h4 className="font-semibold mb-4">Social Links</h4>
                <div className="space-y-3">
                  {socialPlatforms.map(({ platform, icon: Icon, label }) => (
                    <div key={platform} className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder={`${label} URL`}
                        value={editedProfile.socialLinks[platform] || ''}
                        onChange={(e) => setEditedProfile(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, [platform]: e.target.value }
                        }))}
                        data-testid={`input-social-${platform}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <h4 className="font-semibold mb-4">Privacy Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Public Profile</p>
                      <p className="text-sm text-muted-foreground">Allow others to find and view your profile</p>
                    </div>
                    <Button variant="outline" size="sm">Toggle</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Online Status</p>
                      <p className="text-sm text-muted-foreground">Display when you're online to followers</p>
                    </div>
                    <Button variant="outline" size="sm">Toggle</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}