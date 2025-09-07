import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  Play, 
  Pause, 
  SkipForward,
  Zap,
  Settings,
  Target,
  TrendingUp,
  Music,
  Activity,
  Sparkles,
  Volume2,
  RotateCcw,
  Save,
  Download
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  energy: number;
  genre: string;
  duration: number;
  audioUrl: string;
  waveformData?: number[];
}

interface MixingSession {
  id: string;
  tracks: Track[];
  currentTrackIndex: number;
  mixPoints: Array<{
    fromTrack: string;
    toTrack: string;
    startTime: number;
    endTime: number;
    crossfadeType: 'quick' | 'smooth' | 'beatmatch';
    confidence: number;
  }>;
  aiSettings: {
    style: 'smooth' | 'energetic' | 'progressive' | 'harmonic';
    keyMatching: boolean;
    bpmMatching: boolean;
    energyFlow: 'maintain' | 'build' | 'dynamic';
    genreFlexibility: number;
  };
  status: 'analyzing' | 'ready' | 'mixing' | 'completed';
}

interface AutoMixingProps {
  tracks: Track[];
  onMixComplete?: (sessionId: string) => void;
}

const mixingStyles = [
  { value: 'smooth', label: 'Smooth & Seamless', description: 'Perfect for background listening' },
  { value: 'energetic', label: 'High Energy', description: 'Keep the dance floor moving' },
  { value: 'progressive', label: 'Progressive Build', description: 'Gradually increase intensity' },
  { value: 'harmonic', label: 'Harmonic Mixing', description: 'Focus on musical key compatibility' },
];

const energyFlows = [
  { value: 'maintain', label: 'Maintain Energy', description: 'Keep consistent energy level' },
  { value: 'build', label: 'Build Energy', description: 'Gradually increase energy' },
  { value: 'dynamic', label: 'Dynamic Flow', description: 'Varied energy with peaks and valleys' },
];

export function AutoMixing({ tracks, onMixComplete }: AutoMixingProps) {
  const [mixingSession, setMixingSession] = useState<MixingSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [mixProgress, setMixProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [aiSettings, setAiSettings] = useState({
    style: 'smooth' as const,
    keyMatching: true,
    bpmMatching: true,
    energyFlow: 'maintain' as const,
    genreFlexibility: 50,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  // Fetch AI mixing recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['/api/ai/mixing-recommendations', tracks.map(t => t.id)],
    enabled: tracks.length > 0,
  });

  const analyzeTracksMutation = useMutation({
    mutationFn: async (analysisData: any) => {
      return await apiRequest('POST', '/api/ai/analyze-tracks', analysisData);
    },
    onSuccess: (data) => {
      setMixingSession(data);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete! 🧠",
        description: `Found ${data.mixPoints.length} optimal mix points`,
      });
    },
    onError: () => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze tracks for mixing",
        variant: "destructive",
      });
    },
  });

  const generateAutoMixMutation = useMutation({
    mutationFn: async (mixData: any) => {
      return await apiRequest('POST', '/api/ai/generate-mix', mixData);
    },
    onSuccess: (data) => {
      setMixProgress(100);
      onMixComplete?.(data.sessionId);
      toast({
        title: "Auto-Mix Complete! 🎵",
        description: "Your AI-generated mix is ready to download",
      });
    },
    onError: () => {
      toast({
        title: "Mix Generation Failed",
        description: "Unable to generate the auto-mix",
        variant: "destructive",
      });
    },
  });

  const startAnalysis = async () => {
    if (tracks.length < 2) {
      toast({
        title: "Need More Tracks",
        description: "Add at least 2 tracks to create an auto-mix",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    analyzeTracksMutation.mutate({
      tracks: tracks.map(track => ({
        id: track.id,
        bpm: track.bpm,
        key: track.key,
        energy: track.energy,
        genre: track.genre,
        duration: track.duration,
      })),
      settings: aiSettings,
    });
  };

  const generateMix = () => {
    if (!mixingSession) return;
    
    setMixProgress(0);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setMixProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 1000);

    generateAutoMixMutation.mutate({
      sessionId: mixingSession.id,
      settings: aiSettings,
    });
  };

  const previewMixPoint = (mixPoint: any) => {
    setPreviewMode(true);
    // Implement audio preview logic here
    setTimeout(() => setPreviewMode(false), 10000); // 10-second preview
  };

  const getBpmDifference = (track1: Track, track2: Track) => {
    return Math.abs(track1.bpm - track2.bpm);
  };

  const getKeyCompatibility = (key1: string, key2: string) => {
    // Simplified key compatibility calculation
    const keyMap: { [key: string]: number } = {
      'A': 0, 'A#': 1, 'Bb': 1, 'B': 2, 'C': 3, 'C#': 4, 'Db': 4,
      'D': 5, 'D#': 6, 'Eb': 6, 'E': 7, 'F': 8, 'F#': 9, 'Gb': 9,
      'G': 10, 'G#': 11, 'Ab': 11
    };
    
    const diff = Math.abs((keyMap[key1] || 0) - (keyMap[key2] || 0));
    return diff <= 1 || diff >= 11 ? 'perfect' : diff <= 3 ? 'good' : 'poor';
  };

  return (
    <div className="space-y-6">
      {/* AI Mixing Header */}
      <Card className="geometric-clip">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-primary" />
            AI Auto-Mixing
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-tracks-count">
                {tracks.length}
              </div>
              <div className="text-sm text-muted-foreground">Tracks Loaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary" data-testid="text-mix-points">
                {mixingSession?.mixPoints.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Mix Points Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent" data-testid="text-total-duration">
                {Math.floor(tracks.reduce((acc, track) => acc + track.duration, 0) / 60)}m
              </div>
              <div className="text-sm text-muted-foreground">Total Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card className="geometric-clip">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            AI Mixing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mixing Style */}
          <div>
            <label className="text-sm font-medium mb-3 block">Mixing Style</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mixingStyles.map((style) => (
                <Button
                  key={style.value}
                  variant={aiSettings.style === style.value ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-start"
                  onClick={() => setAiSettings(prev => ({ ...prev, style: style.value as any }))}
                  data-testid={`button-style-${style.value}`}
                >
                  <span className="font-semibold">{style.label}</span>
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Energy Flow */}
          <div>
            <label className="text-sm font-medium mb-3 block">Energy Flow</label>
            <Select 
              value={aiSettings.energyFlow} 
              onValueChange={(value) => setAiSettings(prev => ({ ...prev, energyFlow: value as any }))}
            >
              <SelectTrigger data-testid="select-energy-flow">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {energyFlows.map((flow) => (
                  <SelectItem key={flow.value} value={flow.value}>
                    <div>
                      <div className="font-medium">{flow.label}</div>
                      <div className="text-xs text-muted-foreground">{flow.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Key Matching</span>
                <p className="text-xs text-muted-foreground">Prioritize harmonically compatible keys</p>
              </div>
              <Button
                variant={aiSettings.keyMatching ? "default" : "outline"}
                size="sm"
                onClick={() => setAiSettings(prev => ({ ...prev, keyMatching: !prev.keyMatching }))}
                data-testid="button-key-matching"
              >
                {aiSettings.keyMatching ? "On" : "Off"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">BPM Matching</span>
                <p className="text-xs text-muted-foreground">Match tempo for seamless transitions</p>
              </div>
              <Button
                variant={aiSettings.bpmMatching ? "default" : "outline"}
                size="sm"
                onClick={() => setAiSettings(prev => ({ ...prev, bpmMatching: !prev.bpmMatching }))}
                data-testid="button-bpm-matching"
              >
                {aiSettings.bpmMatching ? "On" : "Off"}
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Genre Flexibility</span>
                <span className="text-sm text-muted-foreground">{aiSettings.genreFlexibility}%</span>
              </div>
              <Slider
                value={[aiSettings.genreFlexibility]}
                onValueChange={(value) => setAiSettings(prev => ({ ...prev, genreFlexibility: value[0] }))}
                min={0}
                max={100}
                step={10}
                className="h-2"
                data-testid="slider-genre-flexibility"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Strict</span>
                <span>Flexible</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={startAnalysis}
              disabled={isAnalyzing || tracks.length < 2}
              className="flex-1"
              data-testid="button-analyze-tracks"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Tracks
                </>
              )}
            </Button>

            {mixingSession && (
              <Button
                onClick={generateMix}
                disabled={generateAutoMixMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                data-testid="button-generate-mix"
              >
                {generateAutoMixMutation.isPending ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Mix
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mix Generation Progress */}
      {generateAutoMixMutation.isPending && (
        <Card className="geometric-clip">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 animate-pulse" />
              Generating Auto-Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing audio and creating transitions...</span>
                <span>{Math.round(mixProgress)}%</span>
              </div>
              <Progress value={mixProgress} className="h-3" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className={`p-3 rounded ${mixProgress > 30 ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                <Music className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs">Audio Analysis</div>
              </div>
              <div className={`p-3 rounded ${mixProgress > 60 ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                <Target className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs">Mix Points</div>
              </div>
              <div className={`p-3 rounded ${mixProgress > 90 ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                <Volume2 className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs">Final Render</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {mixingSession && (
        <Card className="geometric-clip">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Mix Analysis Results
              </span>
              <Badge variant="secondary">
                {mixingSession.mixPoints.length} transitions found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mixingSession.mixPoints.map((mixPoint, index) => {
              const fromTrack = tracks.find(t => t.id === mixPoint.fromTrack);
              const toTrack = tracks.find(t => t.id === mixPoint.toTrack);
              
              if (!fromTrack || !toTrack) return null;
              
              return (
                <div 
                  key={index}
                  className="p-4 border rounded-lg"
                  data-testid={`mix-point-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">
                        {fromTrack.title} → {toTrack.title}
                      </span>
                      <Badge 
                        variant={mixPoint.confidence > 0.8 ? "default" : mixPoint.confidence > 0.6 ? "secondary" : "outline"}
                      >
                        {Math.round(mixPoint.confidence * 100)}% match
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewMixPoint(mixPoint)}
                        data-testid={`button-preview-${index}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">BPM Diff:</span>
                      <div className="font-medium">
                        {getBpmDifference(fromTrack, toTrack)} BPM
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Key Match:</span>
                      <div className="font-medium capitalize">
                        {getKeyCompatibility(fromTrack.key, toTrack.key)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Transition:</span>
                      <div className="font-medium capitalize">
                        {mixPoint.crossfadeType}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">
                        {Math.round(mixPoint.endTime - mixPoint.startTime)}s
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Track List with AI Insights */}
      {tracks.length > 0 && (
        <Card className="geometric-clip">
          <CardHeader>
            <CardTitle>Track Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tracks.map((track, index) => (
                <div 
                  key={track.id}
                  className="flex items-center justify-between p-3 border rounded"
                  data-testid={`track-analysis-${track.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <div className="font-medium">{track.title}</div>
                      <div className="text-sm text-muted-foreground">{track.artist}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{track.bpm} BPM</span>
                    <span>Key: {track.key}</span>
                    <span>Energy: {track.energy}/10</span>
                    <Badge variant="outline">{track.genre}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}