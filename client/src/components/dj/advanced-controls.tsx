import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw,
  Zap,
  Settings,
  Save,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Headphones,
  Radio,
  Sliders
} from "lucide-react";

interface DJControlsProps {
  onCrossfaderChange?: (value: number) => void;
  onEQChange?: (deck: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number) => void;
  onEffectChange?: (effect: string, value: number) => void;
  onDeckControl?: (deck: 'A' | 'B', action: string) => void;
}

interface DeckState {
  volume: number;
  gain: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  pitch: number;
  isPlaying: boolean;
  cueEnabled: boolean;
  keyLock: boolean;
  sync: boolean;
}

interface EffectState {
  reverb: number;
  delay: number;
  filter: number;
  flanger: number;
  phaser: number;
  bitcrusher: number;
}

const initialDeckState: DeckState = {
  volume: 75,
  gain: 50,
  eq: { low: 50, mid: 50, high: 50 },
  pitch: 0,
  isPlaying: false,
  cueEnabled: false,
  keyLock: false,
  sync: false,
};

const initialEffectState: EffectState = {
  reverb: 0,
  delay: 0,
  filter: 50,
  flanger: 0,
  phaser: 0,
  bitcrusher: 0,
};

export function AdvancedDJControls({ 
  onCrossfaderChange, 
  onEQChange, 
  onEffectChange, 
  onDeckControl 
}: DJControlsProps) {
  const [deckA, setDeckA] = useState<DeckState>(initialDeckState);
  const [deckB, setDeckB] = useState<DeckState>(initialDeckState);
  const [crossfader, setCrossfader] = useState(50);
  const [effects, setEffects] = useState<EffectState>(initialEffectState);
  const [masterVolume, setMasterVolume] = useState(75);
  const [cueVolume, setCueVolume] = useState(50);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);

  const updateDeck = useCallback((deck: 'A' | 'B', updates: Partial<DeckState>) => {
    const setter = deck === 'A' ? setDeckA : setDeckB;
    setter(prev => ({ ...prev, ...updates }));
  }, []);

  const handleCrossfaderChange = useCallback((value: number[]) => {
    const newValue = value[0];
    setCrossfader(newValue);
    onCrossfaderChange?.(newValue);
  }, [onCrossfaderChange]);

  const handleEQChange = useCallback((deck: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number[]) => {
    const newValue = value[0];
    updateDeck(deck, { 
      eq: { 
        ...((deck === 'A' ? deckA : deckB).eq), 
        [band]: newValue 
      } 
    });
    onEQChange?.(deck, band, newValue);
  }, [deckA, deckB, updateDeck, onEQChange]);

  const handleEffectChange = useCallback((effect: keyof EffectState, value: number[]) => {
    const newValue = value[0];
    setEffects(prev => ({ ...prev, [effect]: newValue }));
    onEffectChange?.(effect, newValue);
  }, [onEffectChange]);

  const handleDeckAction = useCallback((deck: 'A' | 'B', action: string) => {
    switch (action) {
      case 'play':
        updateDeck(deck, { isPlaying: !((deck === 'A' ? deckA : deckB).isPlaying) });
        break;
      case 'cue':
        updateDeck(deck, { cueEnabled: !((deck === 'A' ? deckA : deckB).cueEnabled) });
        break;
      case 'sync':
        updateDeck(deck, { sync: !((deck === 'A' ? deckA : deckB).sync) });
        break;
      case 'keylock':
        updateDeck(deck, { keyLock: !((deck === 'A' ? deckA : deckB).keyLock) });
        break;
    }
    onDeckControl?.(deck, action);
  }, [deckA, deckB, updateDeck, onDeckControl]);

  const resetDeck = (deck: 'A' | 'B') => {
    updateDeck(deck, initialDeckState);
  };

  const DeckControls = ({ deck, state }: { deck: 'A' | 'B', state: DeckState }) => (
    <Card className="geometric-clip">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Radio className="w-5 h-5 mr-2" />
            Deck {deck}
          </span>
          <div className="flex space-x-1">
            <Badge variant={state.isPlaying ? "default" : "outline"}>
              {state.isPlaying ? "PLAYING" : "STOPPED"}
            </Badge>
            {state.sync && <Badge variant="secondary">SYNC</Badge>}
            {state.keyLock && <Badge variant="secondary">KEY</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transport Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full"
            data-testid={`button-${deck.toLowerCase()}-prev`}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            size="lg"
            className={`w-16 h-16 rounded-full ${
              state.isPlaying ? 'geometric-gradient' : 'bg-muted hover:bg-muted/80'
            }`}
            onClick={() => handleDeckAction(deck, 'play')}
            data-testid={`button-${deck.toLowerCase()}-play`}
          >
            {state.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 rounded-full"
            data-testid={`button-${deck.toLowerCase()}-next`}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Pitch and Tempo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Pitch</label>
            <span className="text-sm font-mono">
              {state.pitch > 0 ? '+' : ''}{state.pitch.toFixed(1)}%
            </span>
          </div>
          <Slider
            value={[state.pitch]}
            onValueChange={(value) => updateDeck(deck, { pitch: value[0] })}
            min={-50}
            max={50}
            step={0.1}
            className="h-2"
            data-testid={`slider-${deck.toLowerCase()}-pitch`}
          />
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateDeck(deck, { pitch: 0 })}
              data-testid={`button-${deck.toLowerCase()}-pitch-reset`}
            >
              Reset
            </Button>
            <Button
              variant={state.sync ? "default" : "outline"}
              size="sm"
              onClick={() => handleDeckAction(deck, 'sync')}
              data-testid={`button-${deck.toLowerCase()}-sync`}
            >
              SYNC
            </Button>
            <Button
              variant={state.keyLock ? "default" : "outline"}
              size="sm"
              onClick={() => handleDeckAction(deck, 'keylock')}
              data-testid={`button-${deck.toLowerCase()}-keylock`}
            >
              KEY
            </Button>
          </div>
        </div>

        {/* EQ Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center">
            <Sliders className="w-4 h-4 mr-2" />
            EQ
          </h4>
          
          {(['high', 'mid', 'low'] as const).map((band) => (
            <div key={band} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm capitalize">{band}</label>
                <span className="text-xs font-mono">
                  {((state.eq[band] - 50) * 0.24).toFixed(1)}dB
                </span>
              </div>
              <Slider
                value={[state.eq[band]]}
                onValueChange={(value) => handleEQChange(deck, band, value)}
                min={0}
                max={100}
                step={1}
                className="h-2"
                data-testid={`slider-${deck.toLowerCase()}-eq-${band}`}
              />
            </div>
          ))}
        </div>

        {/* Volume and Gain */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Gain</label>
              <span className="text-xs font-mono">{state.gain}%</span>
            </div>
            <Slider
              value={[state.gain]}
              onValueChange={(value) => updateDeck(deck, { gain: value[0] })}
              min={0}
              max={100}
              step={1}
              className="h-2"
              data-testid={`slider-${deck.toLowerCase()}-gain`}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Volume</label>
              <span className="text-xs font-mono">{state.volume}%</span>
            </div>
            <Slider
              value={[state.volume]}
              onValueChange={(value) => updateDeck(deck, { volume: value[0] })}
              min={0}
              max={100}
              step={1}
              className="h-2"
              data-testid={`slider-${deck.toLowerCase()}-volume`}
            />
          </div>
        </div>

        {/* Cue and Reset */}
        <div className="flex space-x-2">
          <Button
            variant={state.cueEnabled ? "default" : "outline"}
            onClick={() => handleDeckAction(deck, 'cue')}
            className="flex-1"
            data-testid={`button-${deck.toLowerCase()}-cue`}
          >
            <Headphones className="w-4 h-4 mr-2" />
            CUE
          </Button>
          <Button
            variant="outline"
            onClick={() => resetDeck(deck)}
            data-testid={`button-${deck.toLowerCase()}-reset`}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Master Controls */}
      <Card className="geometric-clip">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              Master Controls
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
                data-testid="button-record"
              >
                {isRecording ? "⏹ Stop Recording" : "⏺ Record"}
              </Button>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="house">House Mix</SelectItem>
                  <SelectItem value="techno">Techno Drive</SelectItem>
                  <SelectItem value="ambient">Ambient Flow</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" data-testid="button-save-preset">
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Crossfader */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Crossfader</span>
              <span className="text-xs font-mono">
                {crossfader < 45 ? 'A' : crossfader > 55 ? 'B' : 'CENTER'}
              </span>
            </div>
            <div className="relative">
              <Slider
                value={[crossfader]}
                onValueChange={handleCrossfaderChange}
                min={0}
                max={100}
                step={1}
                className="h-4"
                data-testid="slider-crossfader"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>A</span>
                <span>B</span>
              </div>
            </div>
          </div>

          {/* Master Volume and Cue */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Master Volume</label>
                <span className="text-xs font-mono">{masterVolume}%</span>
              </div>
              <Slider
                value={[masterVolume]}
                onValueChange={(value) => setMasterVolume(value[0])}
                min={0}
                max={100}
                step={1}
                className="h-2"
                data-testid="slider-master-volume"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Cue Volume</label>
                <span className="text-xs font-mono">{cueVolume}%</span>
              </div>
              <Slider
                value={[cueVolume]}
                onValueChange={(value) => setCueVolume(value[0])}
                min={0}
                max={100}
                step={1}
                className="h-2"
                data-testid="slider-cue-volume"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Effects Rack */}
      <Card className="geometric-clip">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Effects Rack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.keys(effects) as Array<keyof EffectState>).map((effect) => (
              <div key={effect} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium capitalize">{effect}</label>
                  <span className="text-xs font-mono">{effects[effect]}%</span>
                </div>
                <Slider
                  value={[effects[effect]]}
                  onValueChange={(value) => handleEffectChange(effect, value)}
                  min={0}
                  max={100}
                  step={1}
                  className="h-2"
                  data-testid={`slider-effect-${effect}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deck Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeckControls deck="A" state={deckA} />
        <DeckControls deck="B" state={deckB} />
      </div>
    </div>
  );
}