import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/contexts/PlayerContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Mic2, Play, Pause, Square, Circle, Download, Music, Brain, Zap,
  FileAudio, Save, Clock, Volume2, Upload, Link, CheckCircle, Trash2,
  AlertCircle, Radio,
} from "lucide-react";

const FALLBACK_ART = "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function StudioPage() {
  const { user } = useAuth() as any;
  const { playTrack } = usePlayer();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("recording");

  // ── Recording state ─────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingArtist, setRecordingArtist] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [liveWaveform, setLiveWaveform] = useState<number[]>(Array(80).fill(20));
  const [micGain, setMicGain] = useState(80);
  const [masterGain, setMasterGain] = useState(75);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Upload state ─────────────────────────────────────────────────────────
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadArtist, setUploadArtist] = useState("");
  const [uploadGenre, setUploadGenre] = useState("afrobeat");
  const [uploadBpm, setUploadBpm] = useState("");
  const [uploadFileUrl, setUploadFileUrl] = useState("");
  const [uploadAlbumArt, setUploadAlbumArt] = useState("");
  const [uploadDuration, setUploadDuration] = useState("");

  // ── Fetch user tracks ────────────────────────────────────────────────────
  const { data: myTracks = [] } = useQuery<any[]>({
    queryKey: ["/api/tracks/my"],
    enabled: !!user,
  });

  // ── Create track mutation ────────────────────────────────────────────────
  const createTrack = useMutation({
    mutationFn: (data: any) => apiRequest("/api/tracks", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tracks/my"] });
      qc.invalidateQueries({ queryKey: ["/api/tracks/public"] });
      toast({ title: "Track saved!", description: "Your track is now in your library." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save track.", variant: "destructive" }),
  });

  const stopWaveformLoop = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopWaveformLoop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [stopWaveformLoop]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 48000 });
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = micGain / 100;
      analyser.fftSize = 256;
      source.connect(gainNode);
      gainNode.connect(analyser);
      analyserRef.current = analyser;

      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);
      setRecordingUrl(null);

      timerRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);

      const updateWaveform = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(data);
        const waveData = Array.from(data).slice(0, 80).map(v => ((v - 128) / 128) * 80 + 50);
        setLiveWaveform(waveData);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      toast({ title: "Recording started", description: "Microphone is active — 48kHz quality" });
    } catch (err: any) {
      toast({
        title: "Microphone Error",
        description: err.name === "NotAllowedError"
          ? "Please allow microphone access in your browser settings."
          : "Could not access your microphone.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setIsPaused(p => !p);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    stopWaveformLoop();
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setIsRecording(false);
    setIsPaused(false);
  };

  const downloadRecording = () => {
    if (!recordingUrl) return;
    const a = document.createElement("a");
    a.href = recordingUrl;
    a.download = `${recordingTitle || "recording"}-${Date.now()}.webm`;
    a.click();
  };

  const saveRecordingToLibrary = () => {
    if (!recordingUrl || !recordingTitle) {
      toast({ title: "Add a title", description: "Please name your recording first.", variant: "destructive" });
      return;
    }
    const artist = recordingArtist || user?.djName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown Artist";
    createTrack.mutate({
      title: recordingTitle,
      artist,
      duration: recordingTime,
      genre: "recording",
      fileUrl: recordingUrl,
      isPublic: true,
      audioFormat: "webm",
      sampleRate: 48000,
    });
  };

  const submitUpload = () => {
    if (!uploadTitle || !uploadArtist) {
      toast({ title: "Missing fields", description: "Title and artist are required.", variant: "destructive" });
      return;
    }
    if (uploadFileUrl && !uploadFileUrl.startsWith("http")) {
      toast({ title: "Invalid URL", description: "Audio URL must start with http(s)://", variant: "destructive" });
      return;
    }
    createTrack.mutate({
      title: uploadTitle,
      artist: uploadArtist,
      genre: uploadGenre || "other",
      bpm: uploadBpm ? parseInt(uploadBpm) : undefined,
      duration: uploadDuration ? parseInt(uploadDuration) : 0,
      fileUrl: uploadFileUrl || null,
      albumArt: uploadAlbumArt || null,
      isPublic: true,
      audioFormat: "mp3",
    });
    setUploadTitle(""); setUploadArtist(""); setUploadFileUrl(""); setUploadAlbumArt(""); setUploadBpm(""); setUploadDuration("");
  };

  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Studio</h1>
            <p className="text-sm text-muted-foreground">Record, upload, and manage your tracks</p>
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Zap className="w-3 h-3 mr-1" /> 48kHz Hi-Fi
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recording"><Mic2 className="w-4 h-4 mr-1" />Record</TabsTrigger>
            <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-1" />Upload</TabsTrigger>
            <TabsTrigger value="library"><FileAudio className="w-4 h-4 mr-1" />My Tracks</TabsTrigger>
          </TabsList>

          {/* ── RECORDING TAB ─────────────────────────────────────────── */}
          <TabsContent value="recording" className="space-y-4 mt-4">
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Circle className={`w-4 h-4 ${isRecording && !isPaused ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                    Recording Deck
                  </span>
                  <Badge variant={isRecording ? "destructive" : "outline"}>
                    {isRecording ? (isPaused ? "PAUSED" : "RECORDING") : recordedBlob ? "RECORDED" : "READY"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Timer */}
                <div className="text-center py-2">
                  <div className="text-5xl font-mono font-bold tracking-wider">{fmt(recordingTime)}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRecording ? (isPaused ? "Paused" : "Recording — 48kHz stereo") : recordedBlob ? "Recording ready — save or download" : "Ready to record"}
                  </p>
                </div>

                {/* Live waveform */}
                <div className="relative h-20 bg-muted/50 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center gap-[1px] px-2">
                    {liveWaveform.map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${isRecording && !isPaused ? "bg-red-500/70" : "bg-muted-foreground/20"}`}
                        style={{ height: `${Math.max(4, h)}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  {!isRecording && !recordedBlob && (
                    <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 rounded-full" onClick={startRecording}>
                      <Circle className="w-5 h-5 mr-2 fill-current" /> Start Recording
                    </Button>
                  )}
                  {isRecording && (
                    <>
                      <Button variant="outline" size="lg" className="rounded-full w-14 h-14" onClick={pauseRecording}>
                        {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                      </Button>
                      <Button variant="destructive" size="lg" className="rounded-full px-6" onClick={stopRecording}>
                        <Square className="w-4 h-4 mr-2" /> Stop
                      </Button>
                    </>
                  )}
                </div>

                {/* After recording: title input + save/download */}
                {recordedBlob && !isRecording && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Track Title *</label>
                        <input
                          className="w-full mt-1 p-2 border rounded-lg bg-background text-sm"
                          placeholder="My Recording"
                          value={recordingTitle}
                          onChange={(e) => setRecordingTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Artist Name</label>
                        <input
                          className="w-full mt-1 p-2 border rounded-lg bg-background text-sm"
                          placeholder={user?.djName || user?.firstName || "Artist"}
                          value={recordingArtist}
                          onChange={(e) => setRecordingArtist(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button className="flex-1" onClick={saveRecordingToLibrary} disabled={createTrack.isPending}>
                        <Save className="w-4 h-4 mr-2" /> Save to Library
                      </Button>
                      <Button variant="outline" onClick={downloadRecording}>
                        <Download className="w-4 h-4 mr-2" /> Download .webm
                      </Button>
                      <Button variant="ghost" onClick={() => {
                        setRecordedBlob(null); setRecordingUrl(null); setRecordingTime(0);
                        setLiveWaveform(Array(80).fill(20));
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {recordingUrl && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                        <audio src={recordingUrl} controls className="w-full h-8" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Input controls */}
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> Input Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Master Gain</span><span className="font-mono">{masterGain}%</span>
                  </div>
                  <Slider value={[masterGain]} onValueChange={([v]) => setMasterGain(v)} min={0} max={100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Microphone Gain</span><span className="font-mono">{micGain}%</span>
                  </div>
                  <Slider value={[micGain]} onValueChange={([v]) => setMicGain(v)} min={0} max={100} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Audio recorded at 48kHz / 16-bit with echo cancellation and noise suppression enabled.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── UPLOAD TAB ────────────────────────────────────────────── */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link className="w-4 h-4" /> Add a Track by URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2 text-sm text-blue-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Upload your audio to Google Drive, Dropbox, or SoundCloud, get a direct link, and paste it here. The file must be publicly accessible.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Track Title *</label>
                    <input className="w-full mt-1 p-2 border rounded-lg bg-background text-sm" placeholder="Song name" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Artist Name *</label>
                    <input className="w-full mt-1 p-2 border rounded-lg bg-background text-sm" placeholder="Your name or DJ name" value={uploadArtist} onChange={(e) => setUploadArtist(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Genre</label>
                    <select className="w-full mt-1 p-2 border rounded-lg bg-background text-sm" value={uploadGenre} onChange={(e) => setUploadGenre(e.target.value)}>
                      {["afrobeat","amapiano","highlife","alte","drill","fuji","gospel","house","techno","electronic","hip-hop","jazz","r&b","reggae","pop","other"].map(g => (
                        <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">BPM</label>
                    <input className="w-full mt-1 p-2 border rounded-lg bg-background text-sm" placeholder="e.g. 120" type="number" value={uploadBpm} onChange={(e) => setUploadBpm(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration (seconds)</label>
                    <input className="w-full mt-1 p-2 border rounded-lg bg-background text-sm" placeholder="e.g. 240" type="number" value={uploadDuration} onChange={(e) => setUploadDuration(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Album Art URL</label>
                    <input className="w-full mt-1 p-2 border rounded-lg bg-background text-sm" placeholder="https://..." value={uploadAlbumArt} onChange={(e) => setUploadAlbumArt(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Audio File URL</label>
                    <input className="w-full mt-1 p-2 border rounded-lg bg-background text-sm" placeholder="https://drive.google.com/... or direct .mp3 link" value={uploadFileUrl} onChange={(e) => setUploadFileUrl(e.target.value)} />
                  </div>
                </div>

                <Button className="w-full" onClick={submitUpload} disabled={createTrack.isPending}>
                  {createTrack.isPending ? "Saving..." : <><CheckCircle className="w-4 h-4 mr-2" />Add to Library</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── MY TRACKS TAB ─────────────────────────────────────────── */}
          <TabsContent value="library" className="space-y-4 mt-4">
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><Music className="w-4 h-4" /> My Tracks</span>
                  <Badge variant="outline">{myTracks.length} tracks</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myTracks.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Mic2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No tracks yet</p>
                    <p className="text-sm mt-1">Record or upload your first track</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myTracks.map((track: any) => (
                      <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                        <img
                          src={track.albumArt || FALLBACK_ART}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={(e: any) => { e.target.src = FALLBACK_ART; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground">{track.artist} · {track.genre}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {track.fileUrl && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                              onClick={() => playTrack({ ...track, albumArt: track.albumArt || FALLBACK_ART }, myTracks)}>
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          {track.fileUrl && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                              <a href={track.fileUrl} download={`${track.title}.mp3`} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{fmt(track.duration)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
