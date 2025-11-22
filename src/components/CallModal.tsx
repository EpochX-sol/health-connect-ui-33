import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVideoCall: boolean;
  participantName: string;
  participantInitials: string;
}

export const CallModal = ({ isOpen, onClose, isVideoCall, participantName, participantInitials }: CallModalProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Simulate connection
      setTimeout(() => setIsConnecting(false), 2000);
      
      // Start call timer
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Get user media if video call
      if (isVideoCall) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch((err) => console.error('Error accessing media devices:', err));
      }

      return () => {
        clearInterval(timer);
        // Cleanup media streams
        if (localVideoRef.current?.srcObject) {
          const stream = localVideoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isOpen, isVideoCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallDuration(0);
    onClose();
  };

  if (!isOpen) return null;

  // Minimized view - floating bubble
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
        <div className="bg-card border-2 border-primary shadow-2xl rounded-xl p-4 w-80">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {participantInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">{participantName}</p>
              <p className="text-xs text-muted-foreground">{formatDuration(callDuration)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
                className="h-8 w-8"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={handleEndCall}
                className="h-8 w-8"
              >
                <PhoneOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full screen view
  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {participantInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{participantName}</p>
                <p className="text-sm text-muted-foreground">
                  {isConnecting ? 'Connecting...' : formatDuration(callDuration)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEndCall}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 bg-muted relative">
          {isVideoEnabled ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-background rounded-lg overflow-hidden shadow-lg border-2 border-border">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl">
                  {participantInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {isConnecting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg font-medium text-foreground">Connecting...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-card border-t border-border p-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant={isMuted ? "destructive" : "secondary"}
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-full w-14 h-14"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {isVideoCall && (
              <Button
                size="lg"
                variant={!isVideoEnabled ? "destructive" : "secondary"}
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className="rounded-full w-14 h-14"
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            )}

            <Button
              size="lg"
              variant="destructive"
              onClick={handleEndCall}
              className="rounded-full w-14 h-14"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
