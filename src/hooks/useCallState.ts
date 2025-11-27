import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Media stream state
export interface MediaStreams {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
}

export interface IncomingCallData {
  callSessionId: string;
  callerId: string;
  callerName: string;
  roomId: string;
  callType: 'voice' | 'video';
}

export interface OutgoingCallData {
  recipientId: string;
  recipientName: string;
  callType: 'voice' | 'video';
  callSessionId?: string;
  roomId?: string;
}

export interface ActiveCallData {
  callSessionId: string;
  roomId: string;
  callType: 'voice' | 'video';
  participantId: string;
  participantName: string;
  startTime: Date;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  userType: 'doctor' | 'patient';
}

export const useCallState = (socket: Socket | null) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<OutgoingCallData | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const outgoingCallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringbackRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Initialize ringtone and ringback audio elements
  useEffect(() => {
    // Create ringtone (for incoming calls) - use sound.mp3
    ringtoneRef.current = new Audio('/sounds/sound.mp3');
    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.volume = 0.8;
    }

    // Create ringback tone (for outgoing calls) - use sound.mp3
    ringbackRef.current = new Audio('/sounds/sound.mp3');
    if (ringbackRef.current) {
      ringbackRef.current.loop = true;
      ringbackRef.current.volume = 0.6;
    }

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
      }
      if (ringbackRef.current) {
        ringbackRef.current.pause();
      }
    };
  }, []);

  // Register user and set up Socket.io listeners
  useEffect(() => {
    if (!socket || !user) return;

    // Register user as online
    socket.emit('register-user', {
      userId: user._id,
      userName: user.name,
      userType: user.role,
    });
    setIsUserOnline(true);

    // Listen for incoming calls
    socket.on('incoming-call', (data: IncomingCallData) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);
      playRingtone();

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${data.callerName} is calling...`, {
          icon: '/phone-icon.png',
          tag: 'incoming-call',
          requireInteraction: true,
        });
      }

      // Vibrate phone
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    });

    // Listen for call accepted
    socket.on('call-accepted', (data: { callSessionId: string; roomId: string; callType: 'voice' | 'video' }) => {
      console.log('Call accepted');
      
      // Clear the 30-second timeout
      if (outgoingCallTimerRef.current) {
        clearTimeout(outgoingCallTimerRef.current);
      }
      
      // Use state updater function to avoid stale closure
      setOutgoingCall((prevOut) => {
        if (prevOut) {
          setActiveCall({
            callSessionId: data.callSessionId,
            roomId: data.roomId,
            callType: data.callType,
            participantId: prevOut.recipientId,
            participantName: prevOut.recipientName,
            startTime: new Date(),
          });
        }
        return null;
      });
      stopRingbackTone();
      stopAllSounds();
    });

    // Listen for call confirmed (recipient side)
    socket.on('call-confirmed', (data: { callSessionId: string; roomId: string; callType: 'voice' | 'video' }) => {
      console.log('Call confirmed');
      stopRingtone();
      stopAllSounds();

      // Use state updater function to avoid stale closure
      setIncomingCall((prevIn) => {
        if (prevIn) {
          setActiveCall({
            callSessionId: data.callSessionId,
            roomId: data.roomId,
            callType: data.callType,
            participantId: prevIn.callerId,
            participantName: prevIn.callerName,
            startTime: new Date(),
          });
        }
        return null;
      });
    });

    // Listen for call rejected
    socket.on('call-rejected', () => {
      console.log('Call rejected');
      setOutgoingCall(null);
      stopRingbackTone();
      stopAllSounds();
      toast({
        title: 'Call Declined',
        description: 'The recipient declined your call',
        variant: 'destructive',
      });
    });

    // Listen for call cancelled
    socket.on('call-cancelled', () => {
      console.log('Call cancelled');
      setIncomingCall(null);
      stopRingtone();
      stopAllSounds();
      toast({
        title: 'Call Cancelled',
        description: 'The caller cancelled the call',
      });
    });

    // Listen for call ended
    socket.on('call-ended', () => {
      console.log('Call ended');
      setActiveCall(null);
      stopAllSounds();
    });

    // Listen for user offline
    socket.on('user-offline', () => {
      console.log('User is offline');
      setOutgoingCall(null);
      stopRingbackTone();
      stopAllSounds();
      toast({
        title: 'User Offline',
        description: 'This user is currently offline',
        variant: 'destructive',
      });
    });

    // Listen for user busy
    socket.on('user-busy', () => {
      console.log('User is busy');
      setOutgoingCall(null);
      stopRingbackTone();
      stopAllSounds();
      toast({
        title: 'User Busy',
        description: 'This user is currently in another call',
        variant: 'destructive',
      });
    });

    // Listen for online users list
    socket.on('online-users', (users: OnlineUser[]) => {
      console.log('Online users:', users);
      setOnlineUsers(users);
    });

    // Listen for user disconnect during call
    socket.on('user-disconnected-during-call', () => {
      console.log('User disconnected during call');
      setActiveCall(null);
      stopAllSounds();
      toast({
        title: 'Connection Lost',
        description: 'The other participant disconnected',
        variant: 'destructive',
      });
    });

    // Handle socket disconnect
    socket.on('disconnect', () => {
      setIsUserOnline(false);
    });

    socket.on('connect', () => {
      setIsUserOnline(true);
    });

    // WebRTC signaling listeners
    socket.on('webrtc-offer', async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log('Received WebRTC offer from:', data.from);
      await handleWebRTCOffer(data.offer, data.from);
    });

    socket.on('webrtc-answer', async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
      console.log('Received WebRTC answer from:', data.from);
      await handleWebRTCAnswer(data.answer, data.from);
    });

    socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log('Received ICE candidate from:', data.from);
      await handleICECandidate(data.candidate, data.from);
    });

    return () => {
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-confirmed');
      socket.off('call-rejected');
      socket.off('call-cancelled');
      socket.off('call-ended');
      socket.off('user-offline');
      socket.off('user-busy');
      socket.off('online-users');
      socket.off('user-disconnected-during-call');
      socket.off('disconnect');
      socket.off('connect');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('ice-candidate');
    };
  }, [socket, user, outgoingCall, incomingCall]);

  // Get media stream for call
  const getMediaStream = useCallback(async (callType: 'voice' | 'video') => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
      toast({
        title: 'Error',
        description: 'Unable to access microphone' + (callType === 'video' ? ' and camera' : ''),
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Stop media stream
  const stopMediaStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }
  }, [localStream]);

  // Sound control functions
  const playRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch((err) => console.log('Ringtone play error:', err));
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

  const playRingbackTone = useCallback(() => {
    if (ringbackRef.current) {
      ringbackRef.current.currentTime = 0;
      ringbackRef.current.play().catch((err) => console.log('Ringback play error:', err));
    }
  }, []);

  const stopRingbackTone = useCallback(() => {
    if (ringbackRef.current) {
      ringbackRef.current.pause();
      ringbackRef.current.currentTime = 0;
    }
  }, []);

  const stopAllSounds = useCallback(() => {
    stopRingtone();
    stopRingbackTone();
  }, [stopRingtone, stopRingbackTone]);

  // Initiate call
  const initiateCall = useCallback(
    async (recipientId: string, recipientName: string, callType: 'voice' | 'video') => {
      if (!socket) return;

      try {
        // Get media stream before initiating call
        await getMediaStream(callType);

        socket.emit('initiate-call', {
          recipientId,
          callType,
        });

        setOutgoingCall({
          recipientId,
          recipientName,
          callType,
        });

        playRingbackTone();

        // Set 30-second timeout for call
        const timer = setTimeout(() => {
          // Auto-cancel if no response (don't reference stale outgoingCall)
          socket.emit('cancel-call', {
            recipientId,
            callSessionId: undefined,
          });
          setOutgoingCall(null);
          stopRingbackTone();
          stopMediaStream();
          toast({
            title: 'No Answer',
            description: 'The call was not answered',
            variant: 'destructive',
          });
        }, 30000); // 30 seconds

        outgoingCallTimerRef.current = timer;
      } catch (error) {
        console.error('Error initiating call:', error);
        setOutgoingCall(null);
      }
    },
    [socket, playRingbackTone, stopRingbackTone, toast, getMediaStream, stopMediaStream]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) return;

    try {
      // Get media stream based on call type
      await getMediaStream(incomingCall.callType);

      // Clear any pending outgoing call timeout
      if (outgoingCallTimerRef.current) {
        clearTimeout(outgoingCallTimerRef.current);
        outgoingCallTimerRef.current = null;
      }

      socket.emit('accept-call', {
        callSessionId: incomingCall.callSessionId,
        recipientId: incomingCall.callerId,
      });

      stopRingtone();
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  }, [socket, incomingCall, stopRingtone, getMediaStream]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!socket || !incomingCall) return;

    // Clear any pending outgoing call timeout
    if (outgoingCallTimerRef.current) {
      clearTimeout(outgoingCallTimerRef.current);
      outgoingCallTimerRef.current = null;
    }

    socket.emit('reject-call', {
      callSessionId: incomingCall.callSessionId,
      callerId: incomingCall.callerId,
    });

    setIncomingCall(null);
    stopRingtone();
  }, [socket, incomingCall, stopRingtone]);

  // Cancel outgoing call
  const cancelCall = useCallback(() => {
    if (!socket || !outgoingCall) return;

    socket.emit('cancel-call', {
      recipientId: outgoingCall.recipientId,
      callSessionId: outgoingCall.callSessionId,
    });

    setOutgoingCall(null);
    stopRingbackTone();

    if (outgoingCallTimerRef.current) {
      clearTimeout(outgoingCallTimerRef.current);
    }
  }, [socket, outgoingCall, stopRingbackTone]);

  // Create peer connection
  const createPeerConnection = useCallback(
    async (remoteSocketId: string, isInitiator: boolean) => {
      try {
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });

        // Add local stream tracks
        if (localStream) {
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
          });
        }

        // Handle incoming remote stream
        peerConnection.ontrack = (event) => {
          console.log('Remote track received from:', remoteSocketId);
          if (event.streams && event.streams[0]) {
            setRemoteStreams(prev => new Map(prev).set(remoteSocketId, event.streams[0]));
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('ice-candidate', {
              candidate: event.candidate,
              to: remoteSocketId,
              from: socket.id,
              callSessionId: activeCall?.callSessionId
            });
          }
        };

        // Monitor connection state
        peerConnection.onconnectionstatechange = () => {
          console.log(`Connection state with ${remoteSocketId}:`, peerConnection.connectionState);
          if (peerConnection.connectionState === 'failed') {
            console.error('Connection failed');
            peerConnection.restartIce();
          }
        };

        peerConnectionsRef.current.set(remoteSocketId, peerConnection);

        // If initiator, create and send offer
        if (isInitiator && socket && activeCall) {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          socket.emit('webrtc-offer', {
            offer,
            callSessionId: activeCall.callSessionId,
            from: socket.id
          });
          console.log('WebRTC offer sent to:', remoteSocketId);
        }

        return peerConnection;
      } catch (err) {
        console.error('Error creating peer connection:', err);
        throw err;
      }
    },
    [socket, activeCall, localStream]
  );

  // Handle WebRTC offer
  const handleWebRTCOffer = useCallback(
    async (offer: RTCSessionDescriptionInit, from: string) => {
      try {
        let peerConnection = peerConnectionsRef.current.get(from);

        if (!peerConnection) {
          peerConnection = await createPeerConnection(from, false);
        }

        if (peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          if (socket && activeCall) {
            socket.emit('webrtc-answer', {
              answer,
              callSessionId: activeCall.callSessionId,
              from: socket.id
            });
          }

          console.log('WebRTC answer sent to:', from);
        }
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    },
    [socket, activeCall, createPeerConnection]
  );

  // Handle WebRTC answer
  const handleWebRTCAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit, from: string) => {
      try {
        const peerConnection = peerConnectionsRef.current.get(from);
        if (peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('Remote description set for:', from);
        }
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    },
    []
  );

  // Handle ICE candidate
  const handleICECandidate = useCallback(
    async (candidate: RTCIceCandidateInit, from: string) => {
      try {
        const peerConnection = peerConnectionsRef.current.get(from);
        if (peerConnection && candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    },
    []
  );

  // Clean up peer connections
  const cleanupPeerConnections = useCallback(() => {
    peerConnectionsRef.current.forEach(pc => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  // Cleanup on unmount or when call ends
  useEffect(() => {
    return () => {
      if (!activeCall && !incomingCall && !outgoingCall) {
        stopMediaStream();
        cleanupPeerConnections();
      }
    };
  }, [activeCall, incomingCall, outgoingCall, stopMediaStream, cleanupPeerConnections]);

  // End active call
  const endCall = useCallback(() => {
    if (!socket || !activeCall) return;

    // Clear any pending outgoing call timeout
    if (outgoingCallTimerRef.current) {
      clearTimeout(outgoingCallTimerRef.current);
      outgoingCallTimerRef.current = null;
    }

    socket.emit('end-call', {
      callSessionId: activeCall.callSessionId,
    });

    setActiveCall(null);
    stopAllSounds();
    stopMediaStream();
    cleanupPeerConnections();
  }, [socket, activeCall, stopAllSounds, stopMediaStream, cleanupPeerConnections]);

  return {
    incomingCall,
    outgoingCall,
    activeCall,
    onlineUsers,
    isUserOnline,
    initiateCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    stopAllSounds,
    localStream,
    remoteStreams,
    getMediaStream,
    stopMediaStream,
    createPeerConnection,
    handleWebRTCOffer,
    handleWebRTCAnswer,
    handleICECandidate,
    cleanupPeerConnections,
  };
};
