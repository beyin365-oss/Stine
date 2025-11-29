import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Volume2, Music, Mic } from 'lucide-react';

interface AudioMixerProps {
  externalInputVolume?: number;
  onExternalInputVolumeChange?: (volume: number) => void;
}

export function AudioMixer({ externalInputVolume = 50, onExternalInputVolumeChange }: AudioMixerProps) {
  const [musicVolume, setMusicVolume] = useState(75);
  const [micVolume, setMicVolume] = useState(80);
  const [externalVolume, setExternalVolume] = useState(externalInputVolume);

  const handleExternalVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setExternalVolume(newVolume);
    onExternalInputVolumeChange?.(newVolume);
  };

  return (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Audio Mixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Music Track Volume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span className="text-sm font-medium">Music Tracks</span>
            </div>
            <Badge variant="secondary">{musicVolume}%</Badge>
          </div>
          <Slider
            value={[musicVolume]}
            onValueChange={(value) => setMusicVolume(value[0])}
            min={0}
            max={100}
            step={1}
            data-testid="slider-music-volume"
          />
        </div>

        {/* Microphone Volume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Voice/Microphone</span>
            </div>
            <Badge variant="secondary">{micVolume}%</Badge>
          </div>
          <Slider
            value={[micVolume]}
            onValueChange={(value) => setMicVolume(value[0])}
            min={0}
            max={100}
            step={1}
            data-testid="slider-mic-volume"
          />
        </div>

        {/* External Input Volume */}
        <div className="space-y-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">External Input</span>
            </div>
            <Badge className="bg-blue-600 hover:bg-blue-700">{externalVolume}%</Badge>
          </div>
          <Slider
            value={[externalVolume]}
            onValueChange={handleExternalVolumeChange}
            min={0}
            max={100}
            step={1}
            data-testid="slider-external-volume"
          />
          <p className="text-xs text-muted-foreground">Connected USB/Bluetooth/HDMI device</p>
        </div>

        {/* Master Volume */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Master Output</span>
            <Badge className="bg-green-600 hover:bg-green-700">100%</Badge>
          </div>
          <Slider
            value={[100]}
            disabled
            min={0}
            max={100}
            step={1}
            data-testid="slider-master-volume"
          />
          <p className="text-xs text-muted-foreground">Overall stream volume (all channels combined)</p>
        </div>
      </CardContent>
    </Card>
  );
}
