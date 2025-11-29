import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FanVideoControl } from './fan-video-control';
import { Video, Users } from 'lucide-react';

interface ListenerVideoPanelProps {
  streamId?: string;
  djAllowsFanCameras?: boolean;
}

export function ListenerVideoPanel({ streamId, djAllowsFanCameras = false }: ListenerVideoPanelProps) {
  const [activeFans, setActiveFans] = useState<string[]>([]);

  return (
    <Tabs defaultValue="my-camera" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="my-camera" className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          My Camera
        </TabsTrigger>
        <TabsTrigger value="fan-gallery" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Fan Gallery
        </TabsTrigger>
      </TabsList>

      {/* My Camera Tab */}
      <TabsContent value="my-camera" className="space-y-4">
        <FanVideoControl 
          streamId={streamId}
          djAllowsVisibility={djAllowsFanCameras}
        />
        
        <Card className="geometric-clip">
          <CardHeader>
            <CardTitle className="text-sm">Camera Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• You control when your camera is on</p>
            <p>• Only turn it on if you want the DJ/Singer to see you</p>
            <p>• Your camera is only visible if DJ allows fan cameras</p>
            <p>• You can turn it off anytime</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Fan Gallery Tab */}
      <TabsContent value="fan-gallery" className="space-y-4">
        <Card className="geometric-clip">
          <CardHeader>
            <CardTitle className="text-sm">Active Fans ({activeFans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {activeFans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No fans are currently showing their camera</p>
                <p className="text-xs mt-2">Fans will appear here when they enable their camera</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {activeFans.map((fanId) => (
                  <div 
                    key={fanId}
                    className="aspect-square bg-black rounded-lg flex items-center justify-center"
                    data-testid={`fan-video-${fanId}`}
                  >
                    <p className="text-xs text-muted-foreground">Fan {fanId}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
