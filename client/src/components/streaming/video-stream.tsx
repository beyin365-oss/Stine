import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, 
  VideoOff, 
  Camera, 
  Monitor, 
  Smartphone,
  Settings,
  Maximize,
  Minimize,
  RotateCcw,
  Zap,
  Eye,
  Users,
  Signal
} from "lucide-react";

interface VideoStreamProps {
  streamId?: string;
  audioEnabled?: boolean;
  onStreamStart?: (streamData: any) => void;
  onStreamStop?: () => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface StreamSettings {
  resolution: '720p' | '1080p' | '4K';
  framerate: 30 | 60;
  bitrate: number;
  camera: string;
  layout: 'single' | 'pip' | 'side-by-side' | 'green-screen';
}

export function VideoStream({ 
  streamId, 
  audioEnabled = true, 
  onStreamStart, 
  onStreamStop 
}: VideoStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [availableScreens, setAvailableScreens] = useState<CameraDevice[]>([]);
  const [streamHealth, setStreamHealth] = useState({
    bitrate: 0,
    framerate: 0,
    droppedFrames: 0,
    viewers: 0,
  });

  const [settings, setSettings] = useState<StreamSettings>({
    resolution: '1080p',
    framerate: 30,
    bitrate: 2500,
    camera: '',
    layout: 'single',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingRef = useRef<MediaRecorder | null>(null);
  
  const { toast } = useToast();

  // Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras as CameraDevice[]);
        
        if (cameras.length > 0 && !settings.camera) {
          setSettings(prev => ({ ...prev, camera: cameras[0].deviceId }));
        }
      } catch (error) {
        console.error('Failed to get devices:', error);
      }
    };

    getDevices();
  }, []);

  // Get screen sharing options
  const getScreenSources = async () => {
    try {
      // Note: This would require additional setup for screen capture
      const screenSources = [
        { deviceId: 'screen1', label: 'Entire Screen', kind: 'screen' },
        { deviceId: 'window1', label: 'Application Window', kind: 'window' },
      ];
      setAvailableScreens(screenSources as CameraDevice[]);
    } catch (error) {
      console.error('Failed to get screen sources:', error);
    }
  };

  // Start video stream
  const startVideoStream = async () => {
    try {
      const constraints = {
        video: {
          deviceId: settings.camera ? { exact: settings.camera } : undefined,
          width: getResolutionConstraints(settings.resolution).width,
          height: getResolutionConstraints(settings.resolution).height,
          frameRate: settings.framerate,
        },
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setVideoEnabled(true);
      setIsStreaming(true);
      
      // Start WebRTC broadcasting
      startWebRTCBroadcast(stream);
      
      onStreamStart?.({
        streamId: `video_${Date.now()}`,
        type: 'video',
        settings,
      });

      toast({
        title: "Video Stream Started! 📹",
        description: "Broadcasting live video to viewers",
      });

    } catch (error) {
      toast({
        title: "Camera Access Failed",
        description: "Please allow camera access and try again",
        variant: "destructive",
      });
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: getResolutionConstraints(settings.resolution).width,
          height: getResolutionConstraints(settings.resolution).height,
          frameRate: settings.framerate,
        },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setVideoEnabled(true);
      setIsStreaming(true);
      
      // Handle screen share end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopVideoStream();
      });

      startWebRTCBroadcast(stream);

      toast({
        title: "Screen Share Started! 🖥️",
        description: "Broadcasting your screen to viewers",
      });

    } catch (error) {
      toast({
        title: "Screen Share Failed",
        description: "Unable to start screen sharing",
        variant: "destructive",
      });
    }
  };

  // Start WebRTC broadcast
  const startWebRTCBroadcast = (stream: MediaStream) => {
    // This would integrate with the WebRTC infrastructure
    // For now, simulate the broadcast setup
    
    // Simulate stream health monitoring
    const healthInterval = setInterval(() => {
      if (isStreaming) {
        setStreamHealth(prev => ({
          bitrate: Math.floor(Math.random() * 500) + settings.bitrate - 250,
          framerate: Math.floor(Math.random() * 5) + settings.framerate - 2,
          droppedFrames: Math.floor(Math.random() * 100),
          viewers: Math.floor(Math.random() * 50) + 10,
        }));
      } else {
        clearInterval(healthInterval);
      }
    }, 2000);
  };

  // Stop video stream
  const stopVideoStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (recordingRef.current) {
      recordingRef.current.stop();
      recordingRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setVideoEnabled(false);
    setIsStreaming(false);
    onStreamStop?.();

    toast({
      title: "Video Stream Stopped",
      description: "Video broadcast has ended",
    });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Get resolution constraints
  const getResolutionConstraints = (resolution: string) => {
    switch (resolution) {
      case '720p': return { width: 1280, height: 720 };
      case '1080p': return { width: 1920, height: 1080 };
      case '4K': return { width: 3840, height: 2160 };
      default: return { width: 1920, height: 1080 };
    }
  };

  // Get bitrate for resolution
  const getBitrateForResolution = (resolution: string, framerate: number) => {
    const baseRates = {
      '720p': 1500,
      '1080p': 2500,
      '4K': 8000,
    };
    return baseRates[resolution as keyof typeof baseRates] * (framerate / 30);
  };

  return (
    <div className="space-y-6">
      {/* Video Preview/Stream */}
      <Card className="geometric-clip">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Video className="w-5 h-5 mr-2" />
              Live Video Stream
            </span>
            <div className="flex items-center space-x-2">
              {isStreaming && (
                <Badge variant="destructive" className="animate-pulse">
                  🔴 LIVE
                </Badge>
              )}
              <Badge variant="outline">
                {settings.resolution} @ {settings.framerate}fps
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              data-testid="video-preview"
            />
            
            {!videoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <div className="text-center">
                  <VideoOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Video stream not active</p>
                </div>
              </div>
            )}

            {/* Stream Controls Overlay */}
            {videoEnabled && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVideoEnabled(!videoEnabled)}
                      data-testid="button-toggle-video"
                    >
                      {videoEnabled ? (
                        <Video className="w-4 h-4 text-white" />
                      ) : (
                        <VideoOff className="w-4 h-4 text-white" />
                      )}
                    </Button>
                    
                    <div className="text-white text-sm">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>{streamHealth.viewers} viewers</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      data-testid="button-fullscreen"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4 text-white" />
                      ) : (
                        <Maximize className="w-4 h-4 text-white" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stream Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Controls */}
        <Card className="geometric-clip">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Video Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isStreaming ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={startVideoStream}
                    className="bg-blue-500 hover:bg-blue-600"
                    data-testid="button-start-camera"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                  
                  <Button
                    onClick={startScreenShare}
                    variant="outline"
                    data-testid="button-start-screen"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Share Screen
                  </Button>
                </div>

                {/* Camera Selection */}
                <div>
                  <label className="text-sm font-medium">Camera</label>
                  <Select 
                    value={settings.camera} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, camera: value }))}
                  >
                    <SelectTrigger data-testid="select-camera">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera) => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${camera.deviceId.slice(0, 8)}...`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={stopVideoStream}
                  variant="destructive"
                  className="w-full"
                  data-testid="button-stop-video"
                >
                  <VideoOff className="w-4 h-4 mr-2" />
                  Stop Video Stream
                </Button>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-500">
                      {streamHealth.bitrate}
                    </div>
                    <div className="text-xs text-muted-foreground">kbps</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      {streamHealth.framerate}
                    </div>
                    <div className="text-xs text-muted-foreground">fps</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stream Settings */}
        <Card className="geometric-clip">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Stream Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Resolution</label>
              <Select 
                value={settings.resolution} 
                onValueChange={(value) => {
                  const newResolution = value as StreamSettings['resolution'];
                  setSettings(prev => ({ 
                    ...prev, 
                    resolution: newResolution,
                    bitrate: getBitrateForResolution(newResolution, prev.framerate)
                  }));
                }}
                disabled={isStreaming}
              >
                <SelectTrigger data-testid="select-resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="4K">4K (Ultra HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Frame Rate</label>
              <Select 
                value={settings.framerate.toString()} 
                onValueChange={(value) => {
                  const newFramerate = parseInt(value) as StreamSettings['framerate'];
                  setSettings(prev => ({ 
                    ...prev, 
                    framerate: newFramerate,
                    bitrate: getBitrateForResolution(prev.resolution, newFramerate)
                  }));
                }}
                disabled={isStreaming}
              >
                <SelectTrigger data-testid="select-framerate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 FPS</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Layout</label>
              <Select 
                value={settings.layout} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, layout: value as StreamSettings['layout'] }))}
              >
                <SelectTrigger data-testid="select-layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Camera</SelectItem>
                  <SelectItem value="pip">Picture in Picture</SelectItem>
                  <SelectItem value="side-by-side">Side by Side</SelectItem>
                  <SelectItem value="green-screen">Green Screen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Estimated Bitrate:</span>
                <span className="font-medium">{settings.bitrate} kbps</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Bandwidth Usage:</span>
                <span className="font-medium">{(settings.bitrate / 1000).toFixed(1)} Mbps</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stream Health Monitor */}
      {isStreaming && (
        <Card className="geometric-clip">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Signal className="w-5 h-5 mr-2" />
              Stream Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 mr-1 text-blue-500" />
                </div>
                <div className="text-2xl font-bold" data-testid="text-video-viewers">
                  {streamHealth.viewers}
                </div>
                <div className="text-xs text-muted-foreground">Viewers</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 mr-1 text-green-500" />
                </div>
                <div className="text-2xl font-bold" data-testid="text-video-bitrate">
                  {streamHealth.bitrate}
                </div>
                <div className="text-xs text-muted-foreground">kbps</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <RotateCcw className="w-4 h-4 mr-1 text-purple-500" />
                </div>
                <div className="text-2xl font-bold" data-testid="text-video-framerate">
                  {streamHealth.framerate}
                </div>
                <div className="text-xs text-muted-foreground">FPS</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Eye className="w-4 h-4 mr-1 text-red-500" />
                </div>
                <div className="text-2xl font-bold" data-testid="text-dropped-frames">
                  {streamHealth.droppedFrames}
                </div>
                <div className="text-xs text-muted-foreground">Dropped</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}