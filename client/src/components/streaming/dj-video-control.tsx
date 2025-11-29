import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Video, VideoOff, Camera, Loader2 } from 'lucide-react';

export function DJVideoControl({ streamId }: { streamId?: string }) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [allowFansCam, setAllowFansCam] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
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
              <Video className="w-5 h-5 text-red-500" />
            ) : (
              <VideoOff className="w-5 h-5 text-muted-foreground" />
            )}
            DJ Camera
          </span>
          {cameraEnabled && <Badge className="bg-red-600">LIVE</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {cameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              data-testid="video-preview-dj"
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
              className="flex-1 bg-red-600 hover:bg-red-700"
              data-testid="button-start-camera"
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
              variant="destructive"
              className="flex-1"
              data-testid="button-stop-camera"
            >
              <VideoOff className="w-4 h-4 mr-2" />
              Turn Off Camera
            </Button>
          )}
        </div>

        {/* Allow Fans to See Toggle */}
        <div className="p-3 rounded-lg bg-muted space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Allow Fans to See You</p>
              <p className="text-xs text-muted-foreground">
                {cameraEnabled ? 'Camera is broadcasting to listeners' : 'Camera must be on to broadcast'}
              </p>
            </div>
            <Switch
              checked={allowFansCam && cameraEnabled}
              onCheckedChange={setAllowFansCam}
              disabled={!cameraEnabled}
              data-testid="toggle-allow-fans-cam"
            />
          </div>
          {!cameraEnabled && (
            <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
              ⚠️ Turn on your camera first to broadcast to fans
            </p>
          )}
        </div>

        {/* Status */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-xs text-blue-700 dark:text-blue-200">
          <p>
            {cameraEnabled && allowFansCam
              ? '✓ Your camera is live and fans can see you'
              : cameraEnabled
              ? '• Camera is on but fans cannot see you (toggle to broadcast)'
              : '• Camera is off'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
