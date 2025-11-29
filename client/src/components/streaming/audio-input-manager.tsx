import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plug, Bluetooth, Monitor, Volume2, Mic } from 'lucide-react';

interface AudioDevice {
  id: string;
  label: string;
  type: 'usb' | 'bluetooth' | 'hdmi' | 'builtin';
  icon: React.ReactNode;
}

export function AudioInputManager({ onAudioStreamChange }: { onAudioStreamChange?: (stream: MediaStream) => void }) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [volume, setVolume] = useState(100);
  const [loading, setLoading] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Enumerate available audio input devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          stream.getTracks().forEach(track => track.stop());
        });

        // Get all devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = allDevices.filter(device => device.kind === 'audioinput');

        const mapped: AudioDevice[] = audioDevices.map(device => {
          let type: 'usb' | 'bluetooth' | 'hdmi' | 'builtin' = 'builtin';
          let icon = <Mic className="w-4 h-4" />;

          if (device.label.toLowerCase().includes('usb')) {
            type = 'usb';
            icon = <Plug className="w-4 h-4" />;
          } else if (device.label.toLowerCase().includes('bluetooth') || device.label.toLowerCase().includes('bt')) {
            type = 'bluetooth';
            icon = <Bluetooth className="w-4 h-4" />;
          } else if (device.label.toLowerCase().includes('hdmi')) {
            type = 'hdmi';
            icon = <Monitor className="w-4 h-4" />;
          }

          return {
            id: device.deviceId,
            label: device.label || `${type.toUpperCase()} Device`,
            type,
            icon
          };
        });

        setDevices(mapped);
        if (mapped.length > 0) {
          setSelectedDevice(mapped[0].id);
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };

    getDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  const connectDevice = async () => {
    if (!selectedDevice) return;

    setLoading(true);
    try {
      // Get audio stream from selected device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDevice,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false // DJ controls gain manually
        }
      });

      // Create audio context for volume control
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const gainNode = ctx.createGain();
      
      gainNode.gain.value = volume / 100;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      setAudioContext(ctx);
      setIsConnected(true);

      // Notify parent component of new audio stream
      if (onAudioStreamChange) {
        onAudioStreamChange(stream);
      }
    } catch (error) {
      console.error('Error connecting device:', error);
      alert('Failed to connect device. Check permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectDevice = () => {
    audioContext?.close();
    setAudioContext(null);
    setIsConnected(false);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioContext) {
      // Update gain in audio context
      const gainNode = audioContext.createGain();
      gainNode.gain.value = newVolume / 100;
    }
  };

  const deviceTypes = {
    usb: { color: 'bg-blue-500', name: 'USB' },
    bluetooth: { color: 'bg-purple-500', name: 'Bluetooth' },
    hdmi: { color: 'bg-red-500', name: 'HDMI' },
    builtin: { color: 'bg-gray-500', name: 'Built-in' }
  };

  return (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plug className="w-5 h-5" />
            External Audio Input
          </span>
          {isConnected && (
            <Badge className="bg-green-600 hover:bg-green-700">Connected</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Audio Input Device</label>
          <Select value={selectedDevice} onValueChange={setSelectedDevice} disabled={isConnected}>
            <SelectTrigger data-testid="select-audio-device">
              <SelectValue placeholder="Choose device..." />
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem key={device.id} value={device.id}>
                  <div className="flex items-center gap-2">
                    {device.icon}
                    <span>{device.label}</span>
                    <Badge className={`${deviceTypes[device.type].color} text-white`} variant="secondary">
                      {deviceTypes[device.type].name}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Device List */}
        {devices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Available Devices:</p>
            <div className="grid grid-cols-1 gap-2">
              {devices.map(device => (
                <div key={device.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                  {device.icon}
                  <span className="flex-1">{device.label}</span>
                  <Badge className={deviceTypes[device.type].color} variant="secondary">
                    {deviceTypes[device.type].name}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volume Control */}
        {isConnected && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <label className="text-sm font-medium">Volume</label>
              <span className="text-sm text-muted-foreground ml-auto">{volume}%</span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={100}
              step={1}
              data-testid="slider-volume"
            />
          </div>
        )}

        {/* Connection Status */}
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-sm">
            {isConnected ? (
              <span className="text-green-600 font-medium">✓ Audio input active and streaming to listeners</span>
            ) : (
              <span className="text-muted-foreground">No external device connected</span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={connectDevice}
            disabled={isConnected || loading || !selectedDevice}
            className="flex-1"
            data-testid="button-connect-device"
          >
            {loading ? 'Connecting...' : 'Connect Device'}
          </Button>
          {isConnected && (
            <Button
              onClick={disconnectDevice}
              variant="outline"
              className="flex-1"
              data-testid="button-disconnect-device"
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Info Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>📱 <strong>Phone/Portable:</strong> Connect via USB cable</p>
          <p>💻 <strong>Laptop:</strong> Use HDMI, USB audio interface, or Bluetooth</p>
          <p>🎵 <strong>Bluetooth:</strong> Pair your device first in system settings</p>
          <p>🔊 <strong>Note:</strong> Adjust volume on both device and app for best quality</p>
        </div>
      </CardContent>
    </Card>
  );
}
