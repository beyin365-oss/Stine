import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  Music, 
  X, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  Volume2,
  BarChart3
} from "lucide-react";

interface AudioFile {
  file: File;
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm?: number;
  key?: string;
  energy?: number;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  audioUrl?: string;
  waveformData?: number[];
  duration?: number;
}

interface UploadManagerProps {
  onUploadComplete?: (tracks: any[]) => void;
}

const genres = [
  'House', 'Techno', 'Trance', 'Progressive', 'Deep House', 'Tech House',
  'Minimal', 'Drum & Bass', 'Dubstep', 'Trap', 'Future Bass', 'Ambient',
  'Downtempo', 'Breakbeat', 'Garage', 'Hardstyle', 'Hardcore', 'Other'
];

const musicalKeys = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

export function UploadManager({ onUploadComplete }: UploadManagerProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (trackData: any) => {
      const formData = new FormData();
      Object.keys(trackData).forEach(key => {
        if (trackData[key] !== undefined) {
          formData.append(key, trackData[key]);
        }
      });
      return await apiRequest('POST', '/api/tracks/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks/my'] });
      toast({
        title: "Upload Successful",
        description: "Your track has been uploaded and processed!",
      });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  }, []);

  const processFiles = (files: File[]) => {
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)
    );

    if (audioFiles.length === 0) {
      toast({
        title: "Invalid Files",
        description: "Please select audio files (MP3, WAV, FLAC, etc.)",
        variant: "destructive",
      });
      return;
    }

    const newAudioFiles: AudioFile[] = audioFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "",
      genre: "House",
      uploadProgress: 0,
      status: 'pending',
    }));

    setAudioFiles(prev => [...prev, ...newAudioFiles]);

    // Process each file for audio analysis
    newAudioFiles.forEach(audioFile => {
      analyzeAudio(audioFile);
    });
  };

  const analyzeAudio = async (audioFile: AudioFile) => {
    try {
      setAudioFiles(prev => prev.map(f => 
        f.id === audioFile.id ? { ...f, status: 'processing' } : f
      ));

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Extract basic audio properties
      const duration = audioBuffer.duration;
      const sampleRate = audioBuffer.sampleRate;
      
      // Generate waveform data (simplified)
      const channelData = audioBuffer.getChannelData(0);
      const samples = 200; // Number of waveform points
      const blockSize = Math.floor(channelData.length / samples);
      const waveformData: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        waveformData.push(sum / blockSize);
      }

      // Create audio URL for preview
      const audioUrl = URL.createObjectURL(audioFile.file);

      // Simple BPM detection (placeholder - would need more sophisticated algorithm)
      const estimatedBPM = Math.floor(Math.random() * 60) + 100; // 100-160 BPM range

      setAudioFiles(prev => prev.map(f => 
        f.id === audioFile.id ? { 
          ...f, 
          status: 'completed',
          duration: Math.floor(duration),
          audioUrl,
          waveformData,
          bpm: estimatedBPM,
          energy: Math.floor(Math.random() * 5) + 5, // 5-10 energy level
        } : f
      ));

      audioContext.close();
    } catch (error) {
      console.error('Audio analysis failed:', error);
      setAudioFiles(prev => prev.map(f => 
        f.id === audioFile.id ? { ...f, status: 'error' } : f
      ));
    }
  };

  const updateTrackInfo = (id: string, field: string, value: any) => {
    setAudioFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const removeTrack = (id: string) => {
    setAudioFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.audioUrl) {
        URL.revokeObjectURL(file.audioUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadTrack = async (audioFile: AudioFile) => {
    if (!audioFile.title || !audioFile.artist) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and artist fields",
        variant: "destructive",
      });
      return;
    }

    setAudioFiles(prev => prev.map(f => 
      f.id === audioFile.id ? { ...f, status: 'uploading', uploadProgress: 0 } : f
    ));

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setAudioFiles(prev => prev.map(f => {
        if (f.id === audioFile.id && f.uploadProgress < 90) {
          return { ...f, uploadProgress: f.uploadProgress + 10 };
        }
        return f;
      }));
    }, 200);

    try {
      await uploadMutation.mutateAsync({
        file: audioFile.file,
        title: audioFile.title,
        artist: audioFile.artist,
        genre: audioFile.genre,
        bpm: audioFile.bpm,
        key: audioFile.key,
        energy: audioFile.energy,
        duration: audioFile.duration,
      });

      clearInterval(progressInterval);
      removeTrack(audioFile.id);
    } catch (error) {
      clearInterval(progressInterval);
      setAudioFiles(prev => prev.map(f => 
        f.id === audioFile.id ? { ...f, status: 'error', uploadProgress: 0 } : f
      ));
    }
  };

  const uploadAllTracks = async () => {
    const readyTracks = audioFiles.filter(f => 
      f.status === 'completed' && f.title && f.artist
    );

    if (readyTracks.length === 0) {
      toast({
        title: "No Tracks Ready",
        description: "Please complete track information for all files",
        variant: "destructive",
      });
      return;
    }

    for (const track of readyTracks) {
      await uploadTrack(track);
    }
  };

  const togglePlayback = (audioFile: AudioFile) => {
    if (!audioFile.audioUrl) return;

    if (currentlyPlaying === audioFile.id) {
      setCurrentlyPlaying(null);
      // Stop audio playback
    } else {
      setCurrentlyPlaying(audioFile.id);
      // Start audio playback
    }
  };

  const getStatusIcon = (status: AudioFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <BarChart3 className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Music className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Music Tracks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drop your music files here</h3>
            <p className="text-muted-foreground mb-4">
              Supports MP3, WAV, FLAC, AAC and other audio formats
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-select-files"
            >
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {audioFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Track Queue ({audioFiles.length})</span>
              <Button 
                onClick={uploadAllTracks}
                disabled={uploadMutation.isPending}
                data-testid="button-upload-all"
              >
                Upload All Tracks
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {audioFiles.map((audioFile) => (
              <div 
                key={audioFile.id}
                className="border rounded-lg p-4 space-y-4"
                data-testid={`track-upload-${audioFile.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(audioFile.status)}
                    <div>
                      <p className="font-medium">{audioFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(audioFile.file.size / 1024 / 1024).toFixed(1)} MB
                        {audioFile.duration && ` • ${Math.floor(audioFile.duration / 60)}:${(audioFile.duration % 60).toString().padStart(2, '0')}`}
                        {audioFile.bpm && ` • ${audioFile.bpm} BPM`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {audioFile.audioUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePlayback(audioFile)}
                        data-testid={`button-preview-${audioFile.id}`}
                      >
                        {currentlyPlaying === audioFile.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTrack(audioFile.id)}
                      data-testid={`button-remove-${audioFile.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Waveform Visualization */}
                {audioFile.waveformData && (
                  <div className="h-16 bg-muted rounded flex items-end space-x-1 p-2">
                    {audioFile.waveformData.map((amplitude, index) => (
                      <div
                        key={index}
                        className="bg-primary flex-1 rounded-sm"
                        style={{ height: `${amplitude * 100}%`, minHeight: '2px' }}
                      />
                    ))}
                  </div>
                )}

                {/* Track Information Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`title-${audioFile.id}`}>Title *</Label>
                    <Input
                      id={`title-${audioFile.id}`}
                      value={audioFile.title}
                      onChange={(e) => updateTrackInfo(audioFile.id, 'title', e.target.value)}
                      placeholder="Track title"
                      data-testid={`input-title-${audioFile.id}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`artist-${audioFile.id}`}>Artist *</Label>
                    <Input
                      id={`artist-${audioFile.id}`}
                      value={audioFile.artist}
                      onChange={(e) => updateTrackInfo(audioFile.id, 'artist', e.target.value)}
                      placeholder="Artist name"
                      data-testid={`input-artist-${audioFile.id}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`genre-${audioFile.id}`}>Genre</Label>
                    <Select 
                      value={audioFile.genre} 
                      onValueChange={(value) => updateTrackInfo(audioFile.id, 'genre', value)}
                    >
                      <SelectTrigger data-testid={`select-genre-${audioFile.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map(genre => (
                          <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`bpm-${audioFile.id}`}>BPM</Label>
                    <Input
                      id={`bpm-${audioFile.id}`}
                      type="number"
                      value={audioFile.bpm || ''}
                      onChange={(e) => updateTrackInfo(audioFile.id, 'bpm', parseInt(e.target.value))}
                      placeholder="120"
                      data-testid={`input-bpm-${audioFile.id}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`key-${audioFile.id}`}>Key</Label>
                    <Select 
                      value={audioFile.key || ''} 
                      onValueChange={(value) => updateTrackInfo(audioFile.id, 'key', value)}
                    >
                      <SelectTrigger data-testid={`select-key-${audioFile.id}`}>
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent>
                        {musicalKeys.map(key => (
                          <SelectItem key={key} value={key}>{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`energy-${audioFile.id}`}>Energy (1-10)</Label>
                    <Input
                      id={`energy-${audioFile.id}`}
                      type="number"
                      min="1"
                      max="10"
                      value={audioFile.energy || ''}
                      onChange={(e) => updateTrackInfo(audioFile.id, 'energy', parseInt(e.target.value))}
                      placeholder="7"
                      data-testid={`input-energy-${audioFile.id}`}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => uploadTrack(audioFile)}
                      disabled={!audioFile.title || !audioFile.artist || audioFile.status === 'uploading'}
                      className="w-full"
                      data-testid={`button-upload-${audioFile.id}`}
                    >
                      {audioFile.status === 'uploading' ? 'Uploading...' : 'Upload Track'}
                    </Button>
                  </div>
                </div>

                {/* Upload Progress */}
                {audioFile.status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{audioFile.uploadProgress}%</span>
                    </div>
                    <Progress value={audioFile.uploadProgress} />
                  </div>
                )}

                {/* Auto-detected Properties */}
                {audioFile.status === 'completed' && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      <Volume2 className="w-3 h-3 mr-1" />
                      {audioFile.duration ? `${Math.floor(audioFile.duration / 60)}:${(audioFile.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}
                    </Badge>
                    {audioFile.bpm && (
                      <Badge variant="outline">
                        {audioFile.bpm} BPM
                      </Badge>
                    )}
                    {audioFile.energy && (
                      <Badge variant="outline">
                        Energy: {audioFile.energy}/10
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}