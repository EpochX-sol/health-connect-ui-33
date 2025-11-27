import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, Phone, Minimize2, Maximize2 } from 'lucide-react';
import { useVideoCall } from '@/hooks/useVideoCall';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVideoCall: boolean;
  participantName: string;
  participantInitials: string;
  appointmentId?: string;
  doctorId?: string;
  patientId?: string;
  currentUserId: string;
  currentUserName: string;
}

export default function CallModal({
  isOpen,
  onClose,
  isVideoCall,
  participantName,
  participantInitials,
  appointmentId,
  doctorId,
  patientId,
  currentUserId,
  currentUserName
}: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    localStream,
    remoteStreams,
    isCallActive,
    isConnecting,
    error,
    participants,
    startCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useVideoCall({
    appointmentId,
    doctorId,
    patientId,
    currentUserId,
    currentUserName,
    isVideoCall
  });

  // Start call when modal opens
  useEffect(() => {
    if (isOpen && !isCallActive) {
      startCall();
    }
  }, [isOpen]);

  // Display local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Display remote stream (first participant)
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreams.size > 0) {
      const firstStream = Array.from(remoteStreams.values())[0];
      remoteVideoRef.current.srcObject = firstStream;
    }
  }, [remoteStreams]);

  // Call duration timer
  useEffect(() => {
    if (isCallActive && !isConnecting) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isCallActive, isConnecting]);

  // Handle call end
  const handleEndCall = async () => {
    await endCall();
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(isVideoCall);
    onClose();
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  // Handle video toggle
  const handleVideoToggle = () => {
    const videoOff = toggleVideo();
    setIsVideoEnabled(!videoOff);
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-card border-2 border-primary shadow-2xl rounded-lg p-4 w-72">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                {participantInitials}
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">{participantName}</p>
                <p className="text-muted-foreground text-xs">{formatDuration(callDuration)}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={handleEndCall}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Phone className="h-4 w-4" style={{ transform: 'rotate(135deg)' }} />
            <span>End Call</span>
          </button>
        </div>
      </div>
    );
  }

  // Full screen view
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg z-10">
          {error}
        </div>
      )}

      {/* Remote Video (Full Screen) */}
      <div className="relative w-full h-full">
        {remoteStreams.size > 0 ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-4xl font-bold mx-auto mb-4">
                {participantInitials}
              </div>
              <p className="text-foreground text-xl font-medium">{participantName}</p>
              <p className="text-muted-foreground mt-2">
                {isConnecting ? 'Connecting...' : 'Waiting for participant...'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {isVideoCall && isVideoEnabled && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-card rounded-lg overflow-hidden shadow-lg border-2 border-border">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Call Info Overlay */}
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg">
          <p className="text-foreground text-sm font-medium">{participantName}</p>
          <p className="text-muted-foreground text-xs">
            {isConnecting ? 'Connecting...' : formatDuration(callDuration)}
          </p>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {/* Mute Button */}
          <button
            onClick={handleMuteToggle}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
            } hover:opacity-80`}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>

          {/* Video Toggle (only for video calls) */}
          {isVideoCall && (
            <button
              onClick={handleVideoToggle}
              className={`p-4 rounded-full transition-colors ${
                !isVideoEnabled ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
              } hover:opacity-80`}
            >
              {!isVideoEnabled ? (
                <VideoOff className="h-6 w-6" />
              ) : (
                <Video className="h-6 w-6" />
              )}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <Phone className="h-6 w-6" style={{ transform: 'rotate(135deg)' }} />
          </button>

          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-4 rounded-full bg-secondary text-secondary-foreground hover:opacity-80 transition-colors"
          >
            <Minimize2 className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
