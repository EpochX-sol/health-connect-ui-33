import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VideoCall = () => {
  const { roomName } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [twilioToken, setTwilioToken] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    if (!user || !token || !roomName) return;

    try {
      // Get Twilio token
      const tokenData = await api.getVideoToken({
        identity: user._id,
        room: roomName
      }, token);
      
      setTwilioToken(tokenData.token);
      
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsConnecting(false);
      
      toast({
        title: 'Connected',
        description: 'Video call started successfully',
      });
    } catch (error) {
      console.error('Failed to initialize call:', error);
      toast({
        title: 'Error',
        description: 'Failed to start video call',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    cleanup();
    navigate(-1);
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600 mx-auto"></div>
            <p className="text-muted-foreground">Connecting to call...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* Remote Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded">
            {user?.role === 'doctor' ? 'Patient' : 'Doctor'}
          </div>
        </div>

        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-800">
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            onClick={toggleMute}
            className="rounded-full w-14 h-14"
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>

          <Button
            size="lg"
            variant={isVideoOff ? 'destructive' : 'secondary'}
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={endCall}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
