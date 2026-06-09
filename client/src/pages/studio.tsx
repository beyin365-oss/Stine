import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AutoMixing } from "@/components/ai/auto-mixing";
import { StreamRecorder, RecordingLibrary } from "@/components/recording/stream-recorder";
import { DJVideoControl } from "@/components/streaming/dj-video-control";
import { mockTracks, mockRecordings, mockWaveform } from "@/lib/mockData";
import {
  Mic2, Play, Pause, Square, Circle, Download, Music, Brain, Zap,
  FileAudio, Save, Clock, Volume2, Activity, Radio
} from "lucide-react";

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState("recording");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [masterGain, setMasterGain] = useState(75);
  const [micGain, setMicGain] = useState(60);
  const [mixProgress, setMixProgress] = useState(0);
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pb-24 md:pb-4 bg-background">
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Studio</h1>
            <p className="text-sm text-muted-foreground">Record, mix, and create your tracks</p>
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Zap className="w-3 h-3 mr-1" /> AI Powered
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recording" className="gap-1">
              <Mic2 className="w-4 h-4" /> Recording
            </TabsTrigger>
            <TabsTrigger value="mixing" className="gap-1">
              <Brain className="w-4 h-4" /> AI Mixing
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1">
              <FileAudio className="w-4 h-4" /> Library
            </TabsTrigger>
          </TabsList>

          {/* Recording Tab */}
          <TabsContent value="recording" className="space-y-6">
            {/* Recording Deck */}
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Circle className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                    Recording Deck
                  </span>
                  <Badge variant={isRecording ? "destructive" : "outline"}>
                    {isRecording ? (isPaused ? "PAUSED" : "RECORDING") : "READY"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timer Display */}
                <div className="text-center py-4">
                  <div className="text-5xl md:text-6xl font-mono font-bold tracking-wider">
                    {formatTime(recordingTime)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isRecording ? "Recording in progress..." : "Ready to record your session"}
                  </p>
                </div>

                {/* Recording Waveform */}
                <div className="relative h-20 bg-muted/50 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center gap-[1px] px-2">
                    {isRecording
                      ? Array.from({ length: 80 }, (_, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-red-500/60"
                            style={{ height: `${Math.random() * 70 + 10}%` }}
                          />
                        ))
                      : mockWaveform.map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-muted-foreground/20"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                  </div>
                </div>

                {/* Recording Controls */}
                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 rounded-full"
                      onClick={() => {
                        setIsRecording(true);
                        setRecordingTime(0);
                        toast({ title: "Recording Started", description: "Session recording is now active" });
                      }}
                    >
                      <Circle className="w-5 h-5 mr-2 fill-current" /> Start Recording
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full w-14 h-14"
                        onClick={() => setIsPaused(!isPaused)}
                      >
                        {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="lg"
                        className="rounded-full px-6"
                        onClick={() => {
                          setIsRecording(false);
                          setIsPaused(false);
                          toast({ title: "Recording Stopped", description: `Recorded ${formatTime(recordingTime)}` });
                        }}
                      >
                        <Square className="w-4 h-4 mr-2" /> Stop
                      </Button>
                    </>
                  )}
                </div>

                {/* Track Details */}
                {recordingTime > 0 && !isRecording && (
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <label className="text-sm font-medium">Recording Title</label>
                      <input
                        className="w-full mt-1 p-2 border rounded-lg bg-background text-sm"
                        placeholder="Name your recording..."
                        value={recordingTitle}
                        onChange={(e) => setRecordingTitle(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button className="flex-1" onClick={() => toast({ title: "Saved", description: "Recording saved to library" })}>
                        <Save className="w-4 h-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => { setRecordingTime(0); setRecordingTitle(""); }}>
                        Discard
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Input Controls */}
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> Input Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Master Gain</span>
                    <span className="font-mono">{masterGain}%</span>
                  </div>
                  <Slider value={[masterGain]} onValueChange={(v) => setMasterGain(v[0])} min={0} max={100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Microphone Gain</span>
                    <span className="font-mono">{micGain}%</span>
                  </div>
                  <Slider value={[micGain]} onValueChange={(v) => setMicGain(v[0])} min={0} max={100} />
                </div>
              </CardContent>
            </Card>

            {/* DJ Camera */}
            <DJVideoControl streamId="studio-1" />

            {/* Recording Library */}
            <RecordingLibrary recordings={mockRecordings as any} />
          </TabsContent>

          {/* AI Mixing Tab */}
          <TabsContent value="mixing" className="space-y-6">
            <AutoMixing tracks={mockTracks as any} />
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <Card className="geometric-clip">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Music className="w-4 h-4" /> My Recordings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecordingLibrary recordings={mockRecordings as any} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
