import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PhoneOff, Minimize2, Maximize2, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { ActiveCallData } from '@/hooks/useCallState';
import { cn } from '@/lib/utils';

interface VideoCallModalProps {
  activeCall: ActiveCallData | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
}

export const VideoCallModal = ({
  activeCall,
  localStream,
  remoteStream,
  onEndCall,
}: VideoCallModalProps) => {
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!activeCall) return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCall]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('[VIDEO] Attaching local stream to video element:', localStream);
      localVideoRef.current.srcObject = localStream;
      console.log('[VIDEO] Local stream attached');
    } else {
      if (!localVideoRef.current) console.log('[VIDEO] Local video ref not ready');
      if (!localStream) console.log('[VIDEO] No local stream available');
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('[VIDEO] Attaching remote stream to video element:', remoteStream);
      console.log('[VIDEO] Remote stream tracks:', remoteStream.getTracks());
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('[VIDEO] Remote stream attached');
    } else {
      if (!remoteVideoRef.current) console.log('[VIDEO] Remote video ref not ready');
      if (!remoteStream) console.log('[VIDEO] No remote stream available');
    }
  }, [remoteStream]);

  // Toggle audio
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  if (!activeCall) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn(
      'fixed z-50 bg-black',
      isMinimized ? 'bottom-4 right-4 w-80 h-60 rounded-lg shadow-2xl' : 'inset-0 w-screen h-screen'
    )}>
      {/* Remote Video (Main/Full) */}
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                {getInitials(activeCall.participantName)}
              </AvatarFallback>
            </Avatar>
            <p className="text-white text-lg font-semibold">{activeCall.participantName}</p>
            <p className="text-gray-400 text-sm">Waiting for video...</p>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {!isMinimized && localStream && (
          <div className="absolute bottom-6 right-6 w-48 h-36 bg-black border-4 border-white rounded-lg overflow-hidden shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarFallback className="text-lg font-bold bg-gray-600">
                      You
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-white text-xs">Camera Off</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Control Bar */}
        {!isMinimized && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-8 pb-6 px-6">
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <Button
                onClick={toggleMute}
                size="lg"
                className={cn(
                  'rounded-full p-4 h-14 w-14',
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                )}
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>

              {/* Video Toggle Button */}
              <Button
                onClick={toggleVideo}
                size="lg"
                className={cn(
                  'rounded-full p-4 h-14 w-14',
                  !isVideoOn
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                )}
              >
                {!isVideoOn ? (
                  <VideoOff className="h-6 w-6" />
                ) : (
                  <Video className="h-6 w-6" />
                )}
              </Button>

              {/* End Call Button */}
              <Button
                onClick={onEndCall}
                size="lg"
                className="rounded-full p-4 h-14 w-14 bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>

              {/* Minimize Button */}
              <Button
                onClick={() => setIsMinimized(true)}
                size="lg"
                className="rounded-full p-4 h-14 w-14 bg-gray-700 hover:bg-gray-600"
              >
                <Minimize2 className="h-6 w-6" />
              </Button>
            </div>

            {/* Call Info */}
            <div className="text-center mt-6">
              <h2 className="text-white text-xl font-semibold">{activeCall.participantName}</h2>
              <p className="text-gray-300 text-lg mt-2 font-mono">{formatDuration(duration)}</p>
            </div>
          </div>
        )}

        {/* Minimized Control Bar */}
        {isMinimized && (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-4">
            <div className="text-center">
              <p className="text-white text-sm font-semibold">{activeCall.participantName}</p>
              <p className="text-gray-300 text-xs mt-1">{formatDuration(duration)}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setIsMinimized(false)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={onEndCall}
                size="sm"
                className="bg-red-500 hover:bg-red-600 h-10 w-10 p-0"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallModal;
