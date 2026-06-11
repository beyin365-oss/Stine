import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { usePlayer } from "@/contexts/PlayerContext";
import { AdvancedDJControls } from "@/components/dj/advanced-controls";
import { AudioInputManager } from "@/components/streaming/audio-input-manager";
import { AudioMixer } from "@/components/streaming/audio-mixer";
import {
  Radio, Play, Pause, Square, SkipBack, SkipForward,
  Heart, Headphones, Zap, Activity, Waves, Shield,
  Clock, Users, AlertTriangle, CheckCircle2, Send
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

function fmt(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function VerificationWall({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bio, setBio] = useState("");
  const [socialLink, setSocialLink] = useState("");

  const { data: status } = useQuery<any>({ queryKey: ["/api/verification/status"] });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/verification/submit", {
        bio,
        socialLink,
        djName: (user as any)?.djName || (user as any)?.firstName || "DJ",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });
      setSubmitted(true);
      toast({ title: "Application submitted!", description: "Admin will review and approve your request." });
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = status?.status === "pending" || submitted;
  const isApproved = status?.status === "approved";

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5">
        {isApproved ? (
          <>
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 mx-auto mb-3 text-green-400" />
              <h2 className="text-xl font-bold">You're Verified!</h2>
              <p className="text-muted-foreground text-sm mt-1">Your DJ profile has been approved by admin. You can now go live.</p>
            </div>
            <Button className="w-full geometric-gradient text-primary-foreground" onClick={onClose}>
              <Radio className="w-4 h-4 mr-2" /> Enter Mixer
            </Button>
          </>
        ) : isPending ? (
          <>
            <div className="text-center">
              <Clock className="w-14 h-14 mx-auto mb-3 text-amber-400" />
              <h2 className="text-xl font-bold">Application Pending</h2>
              <p className="text-muted-foreground text-sm mt-1">Your DJ verification is under review. You'll be able to go live once an admin approves your profile.</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400 text-center">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Typical review time: 24–48 hours
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Go Back
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Shield className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">DJ Verification Required</h2>
                <p className="text-sm text-muted-foreground">To protect the quality of live streams on STINE, all DJs must be verified by an admin before going live.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your DJ Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself as a DJ — your style, experience, genres..."
                  className="w-full text-sm rounded-lg border bg-background p-3 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={500}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Social Link (optional)</label>
                <input
                  type="url"
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                  placeholder="https://instagram.com/yourname"
                  className="w-full text-sm rounded-lg border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                className="geometric-gradient text-primary-foreground"
                disabled={!bio.trim() || submitting}
                onClick={handleSubmit}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Apply to Go Live"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MixerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: myTracks = [] } = useQuery<any[]>({ queryKey: ["/api/tracks/my"] });
  const { data: verificationStatus } = useQuery<any>({ queryKey: ["/api/verification/status"] });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [likes, setLikes] = useState(0);
  const [listenerCount, setListenerCount] = useState(0);
  const [showVerificationWall, setShowVerificationWall] = useState(false);

  const currentTrack = myTracks[currentTrackIndex] || null;
  const progress = currentTrack ? (currentTime / (currentTrack.duration || 1)) * 100 : 0;
  const isVerified = verificationStatus?.status === "approved";

  const handleGoLive = () => {
    if (!isVerified) {
      setShowVerificationWall(true);
      return;
    }
    setIsLive(true);
    setListenerCount(0);
    toast({ title: "You're Live!", description: "Your stream is now broadcasting" });
  };

  const handleEndStream = () => {
    setIsLive(false);
    setStreamDuration(0);
    toast({ title: "Stream ended", description: `Thanks for streaming!` });
  };

  const handleNext = () => { setCurrentTrackIndex((prev) => (prev + 1) % Math.max(myTracks.length, 1)); setCurrentTime(0); };
  const handlePrev = () => { setCurrentTrackIndex((prev) => (prev - 1 + Math.max(myTracks.length, 1)) % Math.max(myTracks.length, 1)); setCurrentTime(0); };

  const FALLBACK_ART = "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop";

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      {showVerificationWall && <VerificationWall onClose={() => setShowVerificationWall(false)} />}

      {/* Stream Status Bar */}
      <div className="sticky top-0 md:top-[57px] z-40 bg-card/80 backdrop-blur border-b border-border px-4 py-2">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{isLive ? "LIVE" : "OFFLINE"}</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono">{fmtDuration(streamDuration)}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-mono font-bold">{listenerCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-mono">{likes}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Verification notice */}
        {!isVerified && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-400 flex-1">
              {verificationStatus?.status === "pending"
                ? "Your DJ verification is pending admin approval."
                : "Apply for DJ verification to go live."}
            </p>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs" onClick={() => setShowVerificationWall(true)}>
              {verificationStatus?.status === "pending" ? "View Status" : "Apply"}
            </Button>
          </div>
        )}

        {/* Now Playing Card */}
        <Card className="geometric-clip overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="w-full md:w-48 h-48 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0 overflow-hidden relative">
                <img
                  src={currentTrack?.albumArt || FALLBACK_ART}
                  alt={currentTrack?.title || "No track"}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {currentTrack?.genre && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge className="bg-primary/80 text-xs">{currentTrack.genre}</Badge>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold truncate">{currentTrack?.title || "No Track Selected"}</h2>
                  <p className="text-muted-foreground text-sm">{currentTrack?.artist || "Upload tracks in Studio to begin"}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentTrack?.bpm && <Badge variant="outline" className="text-xs">{currentTrack.bpm} BPM</Badge>}
                    {currentTrack?.key && <Badge variant="outline" className="text-xs">Key: {currentTrack.key}</Badge>}
                    {currentTrack?.energy && <Badge variant="outline" className="text-xs">Energy: {currentTrack.energy}/10</Badge>}
                  </div>
                </div>

                <div className="mt-4">
                  <Progress value={progress} className="h-1.5 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{fmt(currentTime)}</span>
                    <span className="font-mono">{fmt(currentTrack?.duration || 0)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 mt-3">
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={handlePrev} disabled={myTracks.length === 0}>
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="icon" className="rounded-full w-14 h-14 geometric-gradient text-primary-foreground"
                    onClick={() => setIsPlaying(!isPlaying)} disabled={myTracks.length === 0}>
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={handleNext} disabled={myTracks.length === 0}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={() => setLikes(l => l + 1)}>
                    <Heart className="w-4 h-4 text-pink-400" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        <Card className="geometric-clip">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Waves className="w-4 h-4 text-cyan-400" />
              Track Queue
              <Badge variant="secondary" className="ml-auto">{myTracks.length} tracks</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTracks.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No tracks yet — <a href="/studio" className="text-primary hover:underline">Upload tracks in Studio</a>
              </p>
            ) : myTracks.map((track: any, idx: number) => (
              <div key={track.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${idx === currentTrackIndex ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}`}
                onClick={() => { setCurrentTrackIndex(idx); setCurrentTime(0); }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={track.albumArt || FALLBACK_ART} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ART; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${idx === currentTrackIndex ? "text-primary" : ""}`}>{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}{track.bpm ? ` · ${track.bpm} BPM` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {track.genre && <Badge variant="outline" className="text-[10px] px-1.5">{track.genre}</Badge>}
                  <span className="text-xs text-muted-foreground font-mono">{fmt(track.duration || 0)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* DJ Controls */}
        <AdvancedDJControls />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AudioInputManager onAudioStreamChange={() => toast({ title: "Audio Connected", description: "Device ready" })} />
          <AudioMixer externalInputVolume={100} onExternalInputVolumeChange={() => {}} />
        </div>

        {/* Stream Controls */}
        <div className="flex gap-3">
          {isLive ? (
            <Button variant="destructive" className="flex-1" onClick={handleEndStream}>
              <Square className="w-4 h-4 mr-2" /> End Stream
            </Button>
          ) : (
            <Button className="flex-1 geometric-gradient text-primary-foreground" onClick={handleGoLive}>
              <Radio className="w-4 h-4 mr-2" /> Go Live
            </Button>
          )}
          <Button variant="outline" className="flex-1">
            <Activity className="w-4 h-4 mr-2" /> Stream Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
