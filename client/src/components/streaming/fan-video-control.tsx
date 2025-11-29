import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Video, VideoOff, Camera, Loader2, Eye, EyeOff } from 'lucide-react';

interface FanVideoControlProps {
  streamId?: string;
  djAllowsVisibility?: boolean;
}

export function FanVideoControl({ streamId, djAllowsVisibility = false }: FanVideoControlProps) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showToJD, setShowToJD] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraEnabled(true);
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Please allow camera access to enable video');
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraEnabled(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {cameraEnabled ? (
              <Video className="w-5 h-5 text-green-500" />
            ) : (
              <VideoOff className="w-5 h-5 text-muted-foreground" />
            )}
            Your Camera
          </span>
          {cameraEnabled && showToJD && (
            <Badge className="bg-green-600">VISIBLE</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DJ Status */}
        {!djAllowsVisibility && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-sm text-amber-700 dark:text-amber-200">
            <p className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              DJ has not enabled fan camera view yet
            </p>
          </div>
        )}

        {/* Video Preview */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {cameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              data-testid="video-preview-fan"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Camera Off</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Control Button */}
        <div className="flex gap-2">
          {!cameraEnabled ? (
            <Button
              onClick={startCamera}
              disabled={loading}
              className="flex-1"
              data-testid="button-start-fan-camera"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Turn On Camera
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={stopCamera}
              variant="outline"
              className="flex-1"
              data-testid="button-stop-fan-camera"
            >
              <VideoOff className="w-4 h-4 mr-2" />
              Turn Off Camera
            </Button>
          )}
        </div>

        {/* Show to DJ Toggle */}
        <div className="p-3 rounded-lg bg-muted space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Show Camera to DJ/Singer</p>
              <p className="text-xs text-muted-foreground">
                {cameraEnabled ? 'DJ can see your camera feed' : 'Camera must be on to share'}
              </p>
            </div>
            <Switch
              checked={showToJD && cameraEnabled && djAllowsVisibility}
              onCheckedChange={setShowToJD}
              disabled={!cameraEnabled || !djAllowsVisibility}
              data-testid="toggle-show-to-dj"
            />
          </div>
          {!cameraEnabled && (
            <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
              ⚠️ Turn on your camera first
            </p>
          )}
          {!djAllowsVisibility && cameraEnabled && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              ℹ️ DJ will need to enable fan camera view first
            </p>
          )}
        </div>

        {/* Status */}
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-200">
          {cameraEnabled && showToJD && djAllowsVisibility ? (
            <p className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              ✓ Your camera is visible to the DJ/Singer
            </p>
          ) : cameraEnabled && djAllowsVisibility ? (
            <p className="flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              • Camera is on, toggle to show to DJ
            </p>
          ) : cameraEnabled ? (
            <p className="flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              • Camera is on but DJ hasn't enabled fan view
            </p>
          ) : (
            <p className="flex items-center gap-2">
              <VideoOff className="w-4 h-4" />
              • Camera is off
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
