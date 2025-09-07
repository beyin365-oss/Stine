import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Share2, 
  Music, 
  Clock, 
  Save,
  Settings,
  Volume2,
  FileAudio,
  Calendar,
  Eye,
  Headphones
} from "lucide-react";

interface Recording {
  id: string;
  title: string;
  description?: string;
  duration: number;
  fileSize: number;
  audioUrl: string;
  waveformUrl?: string;
  isPublic: boolean;
  downloadCount: number;
  playCount: number;
  createdAt: string;
  stream?: {
    title: string;
    genre?: string;
  };
}

interface StreamRecorderProps {
  streamId?: string;
  onRecordingComplete?: (recording: Recording) => void;
}

export function StreamRecorder({ streamId, onRecordingComplete }: StreamRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [audioQuality, setAudioQuality] = useState("high");
  const [isPublic, setIsPublic] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveRecordingMutation = useMutation({
    mutationFn: async (recordingData: FormData) => {
      return await apiRequest('POST', '/api/recordings', recordingData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      onRecordingComplete?.(data);
      toast({
        title: "Recording Saved",
        description: "Your stream recording has been saved successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: audioQuality === 'high' ? 48000 : 44100,
        } 
      });

      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: audioQuality === 'high' ? 320000 : 128000,
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      toast({
        title: "Recording Started",
        description: "Stream recording has begun!",
      });
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      toast({
        title: "Recording Paused",
        description: "Recording has been paused",
      });
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      toast({
        title: "Recording Resumed",
        description: "Recording has been resumed",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const saveRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      toast({
        title: "No Recording",
        description: "No audio data to save",
        variant: "destructive",
      });
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('title', recordingTitle || `Stream Recording - ${new Date().toLocaleDateString()}`);
    formData.append('description', recordingDescription);
    formData.append('duration', recordingTime.toString());
    formData.append('isPublic', isPublic.toString());
    if (streamId) {
      formData.append('streamId', streamId);
    }

    saveRecordingMutation.mutate(formData);
    
    // Reset state
    audioChunksRef.current = [];
    setRecordingTime(0);
    setRecordingTitle("");
    setRecordingDescription("");
  };

  const discardRecording = () => {
    audioChunksRef.current = [];
    setRecordingTime(0);
    setRecordingTitle("");
    setRecordingDescription("");
    toast({
      title: "Recording Discarded",
      description: "Recording has been discarded",
    });
  };

  return (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <FileAudio className="w-5 h-5 mr-2" />
            Stream Recorder
          </span>
          <div className="flex items-center space-x-2">
            <Badge variant={isRecording ? "destructive" : "outline"} className={isRecording ? "animate-pulse" : ""}>
              {isRecording ? (isPaused ? "PAUSED" : "RECORDING") : "READY"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              data-testid="button-recording-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Timer */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold mb-2" data-testid="text-recording-time">
            {formatTime(recordingTime)}
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              {isRecording ? (isPaused ? "Paused" : "Recording") : "Ready to record"}
            </span>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white"
              data-testid="button-start-recording"
            >
              <FileAudio className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={isPaused ? resumeRecording : pauseRecording}
                data-testid="button-pause-resume"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button
                variant="destructive"
                onClick={stopRecording}
                data-testid="button-stop-recording"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Recording Metadata (when stopped) */}
        {recordingTime > 0 && !isRecording && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Recording Title</label>
                <Input
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  placeholder={`Stream Recording - ${new Date().toLocaleDateString()}`}
                  data-testid="input-recording-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={recordingDescription}
                  onChange={(e) => setRecordingDescription(e.target.value)}
                  placeholder="Add a description for your recording..."
                  rows={3}
                  data-testid="textarea-recording-description"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    data-testid="checkbox-public-recording"
                  />
                  <span className="text-sm">Make recording public</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={saveRecording}
                disabled={saveRecordingMutation.isPending}
                className="flex-1"
                data-testid="button-save-recording"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveRecordingMutation.isPending ? "Saving..." : "Save Recording"}
              </Button>
              <Button
                variant="outline"
                onClick={discardRecording}
                data-testid="button-discard-recording"
              >
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recording Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Audio Quality</label>
                <select
                  value={audioQuality}
                  onChange={(e) => setAudioQuality(e.target.value)}
                  className="w-full p-2 border rounded"
                  data-testid="select-audio-quality"
                >
                  <option value="standard">Standard (128 kbps)</option>
                  <option value="high">High (320 kbps)</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">Enable noise suppression and echo cancellation</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Recording Library Component
interface RecordingLibraryProps {
  recordings: Recording[];
  onPlay?: (recording: Recording) => void;
}

export function RecordingLibrary({ recordings, onPlay }: RecordingLibraryProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const downloadRecordingMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      return await apiRequest('POST', `/api/recordings/${recordingId}/download`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
    },
  });

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async (recording: Recording) => {
    try {
      await downloadRecordingMutation.mutateAsync(recording.id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = recording.audioUrl;
      link.download = `${recording.title}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Recordings Yet</h3>
          <p className="text-muted-foreground">
            Start recording your streams to build your library
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recordings.map((recording) => (
        <Card key={recording.id} className="geometric-clip">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold" data-testid={`text-recording-title-${recording.id}`}>
                    {recording.title}
                  </h4>
                  {!recording.isPublic && (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
                
                {recording.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {recording.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDuration(recording.duration)}
                  </span>
                  <span>{formatFileSize(recording.fileSize)}</span>
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {recording.playCount} plays
                  </span>
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    {recording.downloadCount} downloads
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(recording.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (playingId === recording.id) {
                      setPlayingId(null);
                    } else {
                      setPlayingId(recording.id);
                      onPlay?.(recording);
                    }
                  }}
                  data-testid={`button-play-${recording.id}`}
                >
                  {playingId === recording.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(recording)}
                  disabled={downloadRecordingMutation.isPending}
                  data-testid={`button-download-${recording.id}`}
                >
                  <Download className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`button-share-${recording.id}`}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}