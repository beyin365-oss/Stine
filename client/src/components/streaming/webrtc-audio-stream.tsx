import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Users,
  Signal,
  Wifi,
  WifiOff,
  Settings
} from "lucide-react";

interface WebRTCAudioStreamProps {
  streamId?: string;
  onStreamStart?: (streamId: string) => void;
  onStreamStop?: () => void;
  onListenerJoin?: (listenerId: string) => void;
  onListenerLeave?: (listenerId: string) => void;
}

interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  isConnected: boolean;
}

export function WebRTCAudioStream({ 
  streamId, 
  onStreamStart, 
  onStreamStop,
  onListenerJoin,
  onListenerLeave 
}: WebRTCAudioStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectedListeners, setConnectedListeners] = useState<PeerConnection[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState(100);
  const [bandwidth, setBandwidth] = useState(0);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  const { toast } = useToast();

  // WebRTC Configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize WebSocket connection for signaling
  const initializeSignaling = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/webrtc`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebRTC signaling connected');
    };
    
    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      await handleSignalingMessage(data);
    };
    
    wsRef.current.onerror = () => {
      toast({
        title: "Connection Error",
        description: "Failed to connect to streaming server",
        variant: "destructive",
      });
    };
  }, []);

  // Handle signaling messages
  const handleSignalingMessage = async (data: any) => {
    const { type, from, payload } = data;
    
    switch (type) {
      case 'listener-join':
        await createPeerConnection(from);
        onListenerJoin?.(from);
        break;
        
      case 'listener-leave':
        removePeerConnection(from);
        onListenerLeave?.(from);
        break;
        
      case 'offer':
        await handleOffer(from, payload);
        break;
        
      case 'answer':
        await handleAnswer(from, payload);
        break;
        
      case 'ice-candidate':
        await handleIceCandidate(from, payload);
        break;
    }
  };

  // Create peer connection for new listener
  const createPeerConnection = async (listenerId: string) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    peersRef.current.set(listenerId, peerConnection);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          to: listenerId,
          payload: event.candidate,
        }));
      }
    };
    
    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      setConnectedListeners(prev => 
        prev.map(peer => 
          peer.id === listenerId 
            ? { ...peer, isConnected: state === 'connected' }
            : peer
        )
      );
      
      if (state === 'failed' || state === 'disconnected') {
        removePeerConnection(listenerId);
      }
    };
    
    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'offer',
        to: listenerId,
        payload: offer,
      }));
    }
    
    // Add to connected listeners
    setConnectedListeners(prev => [...prev, {
      id: listenerId,
      connection: peerConnection,
      isConnected: false,
    }]);
  };

  // Remove peer connection
  const removePeerConnection = (listenerId: string) => {
    const peerConnection = peersRef.current.get(listenerId);
    if (peerConnection) {
      peerConnection.close();
      peersRef.current.delete(listenerId);
    }
    
    setConnectedListeners(prev => prev.filter(peer => peer.id !== listenerId));
  };

  // Handle WebRTC offer
  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    // This would be used for listener-side implementation
  };

  // Handle WebRTC answer
  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    const peerConnection = peersRef.current.get(from);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    const peerConnection = peersRef.current.get(from);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  };

  // Initialize audio monitoring
  const initializeAudioMonitoring = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateAudioLevel = () => {
      if (analyserRef.current && isStreaming) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(Math.round((average / 255) * 100));
        requestAnimationFrame(updateAudioLevel);
      }
    };
    
    updateAudioLevel();
  };

  // Start streaming
  const startStreaming = async () => {
    try {
      // Get user media with high-quality audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
        video: false,
      });
      
      localStreamRef.current = stream;
      initializeSignaling();
      initializeAudioMonitoring(stream);
      
      setIsStreaming(true);
      
      // Notify parent component
      const generatedStreamId = `stream_${Date.now()}`;
      onStreamStart?.(generatedStreamId);
      
      // Register as broadcaster
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'start-broadcast',
          streamId: generatedStreamId,
        }));
      }
      
      toast({
        title: "Live Audio Stream Started! 🔴",
        description: "Broadcasting high-quality audio to listeners",
      });
      
    } catch (error) {
      toast({
        title: "Stream Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop streaming
  const stopStreaming = () => {
    // Close all peer connections
    peersRef.current.forEach(connection => connection.close());
    peersRef.current.clear();
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop-broadcast' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsStreaming(false);
    setConnectedListeners([]);
    setAudioLevel(0);
    onStreamStop?.();
    
    toast({
      title: "Stream Ended",
      description: "Live audio broadcast has stopped",
    });
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Simulate connection quality monitoring
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        // Simulate connection quality based on number of peers
        const quality = Math.max(50, 100 - (connectedListeners.length * 5));
        setConnectionQuality(quality);
        
        // Simulate bandwidth usage
        setBandwidth(connectedListeners.length * 128); // 128 kbps per listener
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isStreaming, connectedListeners.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStreaming();
      }
    };
  }, []);

  return (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Radio className="w-5 h-5 mr-2" />
            Live Audio Streaming
          </span>
          <div className="flex items-center space-x-2">
            {isStreaming && (
              <Badge variant="destructive" className="animate-pulse">
                🔴 LIVE
              </Badge>
            )}
            <Badge variant="outline">
              WebRTC
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stream Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isStreaming ? (
            <Button
              onClick={startStreaming}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3"
              data-testid="button-start-webrtc-stream"
            >
              <Radio className="w-5 h-5 mr-2" />
              Start Live Stream
            </Button>
          ) : (
            <div className="flex space-x-3">
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "outline"}
                data-testid="button-toggle-mute"
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={stopStreaming}
                variant="destructive"
                data-testid="button-stop-webrtc-stream"
              >
                Stop Stream
              </Button>
            </div>
          )}
        </div>

        {/* Audio Level Meter */}
        {isStreaming && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Audio Level</span>
              <span className="text-sm text-muted-foreground">{audioLevel}%</span>
            </div>
            <div className="relative">
              <Progress value={audioLevel} className="h-3" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-2 rounded ${
                        i < audioLevel / 10 
                          ? i < 7 ? 'bg-green-500' : i < 9 ? 'bg-yellow-500' : 'bg-red-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stream Statistics */}
        {isStreaming && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 mr-1 text-blue-500" />
              </div>
              <div className="text-2xl font-bold" data-testid="text-connected-listeners">
                {connectedListeners.filter(p => p.isConnected).length}
              </div>
              <div className="text-xs text-muted-foreground">Listeners</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Signal className="w-4 h-4 mr-1 text-green-500" />
              </div>
              <div className="text-2xl font-bold" data-testid="text-connection-quality">
                {connectionQuality}%
              </div>
              <div className="text-xs text-muted-foreground">Quality</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                {connectionQuality > 80 ? (
                  <Wifi className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 mr-1 text-red-500" />
                )}
              </div>
              <div className="text-2xl font-bold" data-testid="text-bandwidth">
                {bandwidth}
              </div>
              <div className="text-xs text-muted-foreground">kbps</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Volume2 className="w-4 h-4 mr-1 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">48k</div>
              <div className="text-xs text-muted-foreground">Sample Rate</div>
            </div>
          </div>
        )}

        {/* Connected Listeners */}
        {connectedListeners.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Connected Listeners</h4>
            <div className="space-y-2">
              {connectedListeners.map((peer) => (
                <div 
                  key={peer.id}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                  data-testid={`listener-${peer.id}`}
                >
                  <span className="text-sm">Listener {peer.id.slice(-6)}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      peer.isConnected ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs text-muted-foreground">
                      {peer.isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Quality Info */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Audio Configuration</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Sample Rate: 48 kHz</div>
            <div>Channels: Stereo</div>
            <div>Echo Cancellation: On</div>
            <div>Noise Suppression: On</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}