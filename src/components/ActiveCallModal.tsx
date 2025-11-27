import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PhoneOff } from 'lucide-react';
import { ActiveCallData } from '@/hooks/useCallState';

interface ActiveCallModalProps {
  activeCall: ActiveCallData | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  onEndCall: () => void;
}

export const ActiveCallModal = ({
  activeCall,
  localStream,
  remoteStreams,
  onEndCall,
}: ActiveCallModalProps) => {
  const [duration, setDuration] = useState(0);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!activeCall) return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCall]);

  // Get the first remote stream (in case of multiple participants)
  const remoteStream = remoteStreams.size > 0 ? Array.from(remoteStreams.values())[0] : null;

  // Attach remote stream to video element if video call
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && activeCall?.callType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall?.callType]);

  if (!activeCall) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const callTypeText = activeCall.callType === 'video' ? 'Video Call' : 'Voice Call';

  return (
    <Dialog open={!!activeCall} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm rounded-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold">{callTypeText}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* Video Stream for Video Calls */}
          {activeCall.callType === 'video' && remoteStream ? (
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <>
              {/* Participant Avatar for Voice Calls */}
              <Avatar className="h-24 w-24 border-4 border-green-500">
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-green-400 to-green-600 text-white">
                  {getInitials(activeCall.participantName)}
                </AvatarFallback>
              </Avatar>
            </>
          )}

          {/* Participant Name */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{activeCall.participantName}</h2>
            <p className="text-sm text-muted-foreground mt-1">{callTypeText}</p>
          </div>

          {/* Call Duration */}
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{formatDuration(duration)}</p>
            <p className="text-xs text-muted-foreground mt-2">Call in progress</p>
          </div>

          {/* Call Type Indicator */}
          <div className="text-sm text-muted-foreground">
            {activeCall.callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
          </div>

          {/* End Call Button */}
          <Button
            onClick={onEndCall}
            size="lg"
            className="w-full bg-red-500 hover:bg-red-600 text-white gap-2"
          >
            <PhoneOff className="h-5 w-5" />
            End Call
          </Button>

          {/* Status Badge */}
          <div className="w-full text-center">
            <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              ● Connected
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActiveCallModal;
