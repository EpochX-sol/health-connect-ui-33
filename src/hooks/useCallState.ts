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
    // Create ringtone (for incoming calls) - receiver hears when being called
    // Falls back to sound.mp3 if ringtone.mp3 doesn't exist
    ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.volume = 0.8;
      // Fallback to sound.mp3 if ringtone.mp3 fails to load
      ringtoneRef.current.addEventListener('error', () => {
        console.warn('[AUDIO] ringtone.mp3 not found, falling back to sound.mp3');
        ringtoneRef.current!.src = '/sounds/sound.mp3';
      });
    }

    // Create ringback tone (for outgoing calls) - caller hears while calling
    // Falls back to sound.mp3 if ringback.mp3 doesn't exist
    ringbackRef.current = new Audio('/sounds/ringback.mp3');
    if (ringbackRef.current) {
      ringbackRef.current.loop = true;
      ringbackRef.current.volume = 0.6;
      // Fallback to sound.mp3 if ringback.mp3 fails to load
      ringbackRef.current.addEventListener('error', () => {
        console.warn('[AUDIO] ringback.mp3 not found, falling back to sound.mp3');
        ringbackRef.current!.src = '/sounds/sound.mp3';
      });
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
      console.log('[CALL] Call accepted by recipient', data);
      
      // Clear the 30-second timeout
      if (outgoingCallTimerRef.current) {
        clearTimeout(outgoingCallTimerRef.current);
      }
      
      // Use state updater function to avoid stale closure
      setOutgoingCall((prevOut) => {
        if (prevOut) {
          console.log('[CALL] Setting active call state after acceptance');
          setActiveCall({
            callSessionId: data.callSessionId,
            roomId: data.roomId,
            callType: data.callType,
            participantId: prevOut.recipientId,
            participantName: prevOut.recipientName,
            startTime: new Date(),
          });
          
          // CRITICAL: Emit join-room to enter WebRTC room
          console.log('[CALL] Joining WebRTC room:', data.roomId);
          socket?.emit('join-room', {
            roomId: data.roomId,
            userId: user?._id,
            userName: user?.name
          });
        }
        return null;
      });
      stopRingbackTone();
      stopAllSounds();
    });

    // Listen for call confirmed (recipient side)
    socket.on('call-confirmed', (data: { callSessionId: string; roomId: string; callType: 'voice' | 'video' }) => {
      console.log('[CALL] Call confirmed - call is now active', data);
      stopRingtone();
      stopAllSounds();

      // Use state updater function to avoid stale closure
      setIncomingCall((prevIn) => {
        if (prevIn) {
          console.log('[CALL] Setting active call state after confirmation');
          setActiveCall({
            callSessionId: data.callSessionId,
            roomId: data.roomId,
            callType: data.callType,
            participantId: prevIn.callerId,
            participantName: prevIn.callerName,
            startTime: new Date(),
          });
          
          // CRITICAL: Emit join-room to enter WebRTC room
          console.log('[CALL] Joining WebRTC room:', data.roomId);
          socket?.emit('join-room', {
            roomId: data.roomId,
            userId: user?._id,
            userName: user?.name
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
      console.log('Call ended from remote participant');
      setActiveCall(null);
      stopAllSounds();
      // Cleanup media streams and peer connections
      stopMediaStream();
      cleanupPeerConnections();
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

    // Listen for existing participants when joining room (as joiner, we create offer for each)
    socket.on('existing-participants', async (participants: Array<{ socketId: string; userId: string; userName: string }>) => {
      console.log('[WebRTC] Existing participants in room:', participants);
      for (const participant of participants) {
        // We are the joiner, so we create the offer
        await createPeerConnection(participant.socketId, true);
      }
    });

    // Listen for new user joining room (as existing, they will create offer)
    socket.on('user-joined', async (data: { socketId: string; userId: string; userName: string }) => {
      console.log('[WebRTC] User joined room:', data);
      // New user joined, they will create the offer
      // We just prepare to receive it
      await createPeerConnection(data.socketId, false);
    });

    // Listen for user leaving room
    socket.on('user-left', ({ socketId }: { socketId: string }) => {
      console.log('[WebRTC] User left room:', socketId);
      const peerConnection = peerConnectionsRef.current.get(socketId);
      if (peerConnection) {
        peerConnection.close();
        peerConnectionsRef.current.delete(socketId);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(socketId);
          return newMap;
        });
      }
    });

    // WebRTC signaling listeners (standard naming: offer, answer, ice-candidate)
    socket.on('offer', async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log('[WebRTC] Received offer from:', data.from);
      await handleWebRTCOffer(data.offer, data.from);
    });

    socket.on('answer', async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
      console.log('[WebRTC] Received answer from:', data.from);
      await handleWebRTCAnswer(data.answer, data.from);
    });

    socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log('[WebRTC] Received ICE candidate from:', data.from);
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
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, user, outgoingCall, incomingCall]);

  // Get media stream for call
  const getMediaStream = useCallback(async (callType: 'voice' | 'video') => {
    try {
      console.log(`[MEDIA] Requesting ${callType} media stream...`);
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`[MEDIA] Successfully got ${callType} stream:`, stream);
      console.log(`[MEDIA] Audio tracks:`, stream.getAudioTracks());
      console.log(`[MEDIA] Video tracks:`, stream.getVideoTracks());
      
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('[MEDIA ERROR] Failed to get media stream:', error);
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
      console.log('[MEDIA] Stopping local stream, tracks:', localStream.getTracks().length);
      localStream.getTracks().forEach(track => {
        console.log(`[MEDIA] Stopping ${track.kind} track:`, track);
        track.stop();
      });
      setLocalStream(null);
      console.log('[MEDIA] Local stream stopped');
    } else {
      console.log('[MEDIA] No local stream to stop');
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
      if (!socket) {
        console.log('[CALL] No socket connection');
        return;
      }

      try {
        console.log(`[CALL] Initiating ${callType} call to ${recipientName} (${recipientId})`);
        
        // Get media stream before initiating call
        console.log(`[CALL] Getting media stream for ${callType} call...`);
        await getMediaStream(callType);
        console.log(`[CALL] Media stream acquired successfully`);

        socket.emit('initiate-call', {
          recipientId,
          callType,
        });
        console.log(`[CALL] Initiate call event emitted`);

        setOutgoingCall({
          recipientId,
          recipientName,
          callType,
        });

        playRingbackTone();

        // Set 30-second timeout for call
        const timer = setTimeout(() => {
          console.log(`[CALL] 30 second timeout - no answer received`);
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
        console.error('[CALL ERROR] Error initiating call:', error);
        setOutgoingCall(null);
      }
    },
    [socket, playRingbackTone, stopRingbackTone, toast, getMediaStream, stopMediaStream]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) {
      console.log('[CALL] Cannot accept call - missing socket or incoming call data');
      return;
    }

    try {
      console.log(`[CALL] Accepting incoming ${incomingCall.callType} call from ${incomingCall.callerName}`);
      
      // Get media stream based on call type
      console.log(`[CALL] Getting media stream for ${incomingCall.callType} call...`);
      await getMediaStream(incomingCall.callType);
      console.log(`[CALL] Media stream acquired`);

      // Clear any pending outgoing call timeout
      if (outgoingCallTimerRef.current) {
        clearTimeout(outgoingCallTimerRef.current);
        outgoingCallTimerRef.current = null;
      }

      socket.emit('accept-call', {
        callSessionId: incomingCall.callSessionId,
        recipientId: incomingCall.callerId,
      });
      console.log(`[CALL] Accept call event emitted`);

      stopRingtone();
    } catch (error) {
      console.error('[CALL ERROR] Error accepting call:', error);
    }
  }, [socket, incomingCall, stopRingtone, getMediaStream]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!socket || !incomingCall) return;

    console.log('[CALL] Rejecting incoming call');

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
    stopMediaStream();
  }, [socket, incomingCall, stopRingtone, stopMediaStream]);

  // Cancel outgoing call
  const cancelCall = useCallback(() => {
    if (!socket || !outgoingCall) return;

    console.log('[CALL] Cancelling outgoing call');

    socket.emit('cancel-call', {
      recipientId: outgoingCall.recipientId,
      callSessionId: outgoingCall.callSessionId,
    });

    setOutgoingCall(null);
    stopRingbackTone();
    stopMediaStream();

    if (outgoingCallTimerRef.current) {
      clearTimeout(outgoingCallTimerRef.current);
      outgoingCallTimerRef.current = null;
    }
  }, [socket, outgoingCall, stopRingbackTone, stopMediaStream]);

  // Create peer connection
  const createPeerConnection = useCallback(
    async (remoteSocketId: string, isInitiator: boolean) => {
      try {
        console.log(`[WebRTC] Creating peer connection with ${remoteSocketId}, isInitiator: ${isInitiator}`);
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });

        // Store remote socket ID on peer connection for later use
        (peerConnection as any).remoteSocketId = remoteSocketId;

        // Add local stream tracks
        if (localStream) {
          console.log(`[WebRTC] Adding local stream tracks (${localStream.getTracks().length} tracks) to peer connection`);
          localStream.getTracks().forEach(track => {
            console.log(`[WebRTC] Adding ${track.kind} track to peer connection`);
            peerConnection.addTrack(track, localStream);
          });
        } else {
          console.warn('[WebRTC] No local stream available to add tracks!');
        }

        // Handle incoming remote stream
        peerConnection.ontrack = (event) => {
          console.log(`[WebRTC] Remote track received from ${remoteSocketId}:`, event.track.kind);
          console.log('[WebRTC] Event streams:', event.streams);
          if (event.streams && event.streams[0]) {
            console.log(`[WebRTC] Setting remote stream with ${event.streams[0].getTracks().length} tracks`);
            setRemoteStreams(prev => {
              const newMap = new Map(prev);
              newMap.set(remoteSocketId, event.streams[0]);
              console.log('[WebRTC] Remote streams updated:', newMap.size);
              return newMap;
            });
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`[WebRTC] ICE candidate generated for ${remoteSocketId}`);
            if (socket) {
              socket.emit('ice-candidate', {
                candidate: event.candidate,
                to: remoteSocketId,
                from: socket.id,
                callSessionId: activeCall?.callSessionId
              });
            }
          }
        };

        // Monitor connection state
        peerConnection.onconnectionstatechange = () => {
          console.log(`[WebRTC] Connection state with ${remoteSocketId}: ${peerConnection.connectionState}`);
          if (peerConnection.connectionState === 'failed') {
            console.error('[WebRTC] Connection failed, restarting ICE');
            peerConnection.restartIce();
          }
        };

        peerConnectionsRef.current.set(remoteSocketId, peerConnection);
        console.log(`[WebRTC] Peer connection created and stored`);

        // If initiator, create and send offer
        if (isInitiator) {
          if (!socket || !activeCall) {
            console.warn('[WebRTC] Cannot create offer - missing socket or activeCall');
            return peerConnection;
          }
          
          console.log(`[WebRTC] Creating offer for ${remoteSocketId}`);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          console.log(`[WebRTC] Sending offer to ${remoteSocketId}`);
          socket.emit('offer', {
            offer,
            to: remoteSocketId,
            from: socket.id,
            callSessionId: activeCall.callSessionId
          });
          console.log(`[WebRTC] Offer sent to ${remoteSocketId}`);
        } else {
          console.log(`[WebRTC] Not an initiator, waiting for offer from ${remoteSocketId}`);
        }

        return peerConnection;
      } catch (err) {
        console.error('[WebRTC ERROR] Error creating peer connection:', err);
        throw err;
      }
    },
    [socket, activeCall, localStream, user]
  );

  // Handle WebRTC offer
  const handleWebRTCOffer = useCallback(
    async (offer: RTCSessionDescriptionInit, from: string) => {
      try {
        console.log(`[WebRTC] Handling offer from ${from}`);
        let peerConnection = peerConnectionsRef.current.get(from);

        if (!peerConnection) {
          console.log(`[WebRTC] No peer connection found, creating one for ${from}`);
          peerConnection = await createPeerConnection(from, false);
        }

        if (peerConnection) {
          console.log(`[WebRTC] Setting remote description (offer) for ${from}`);
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

          console.log(`[WebRTC] Creating answer for ${from}`);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          if (socket && activeCall) {
            console.log(`[WebRTC] Sending answer back to ${from}`);
            socket.emit('answer', {
              answer,
              to: from,
              from: socket.id,
              callSessionId: activeCall.callSessionId
            });
          }

          console.log(`[WebRTC] Answer sent to ${from}`);
        }
      } catch (err) {
        console.error('[WebRTC ERROR] Error handling WebRTC offer:', err);
      }
    },
    [socket, activeCall, createPeerConnection]
  );

  // Handle WebRTC answer
  const handleWebRTCAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit, from: string) => {
      try {
        console.log(`[WebRTC] Handling answer from ${from}`);
        const peerConnection = peerConnectionsRef.current.get(from);
        if (peerConnection) {
          console.log(`[WebRTC] Setting remote description (answer) for ${from}`);
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`[WebRTC] Remote description set for ${from}`);
        } else {
          console.warn(`[WebRTC] No peer connection found for ${from} when handling answer`);
        }
      } catch (err) {
        console.error('[WebRTC ERROR] Error handling WebRTC answer:', err);
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
          console.log(`[WebRTC] Adding ICE candidate from ${from}`);
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else if (!peerConnection) {
          console.warn(`[WebRTC] No peer connection found for ${from} when adding ICE candidate`);
        }
      } catch (err) {
        console.error('[WebRTC ERROR] Error adding ICE candidate:', err);
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

    console.log('[CALL] Ending call:', activeCall.callSessionId);

    // Clear any pending outgoing call timeout
    if (outgoingCallTimerRef.current) {
      clearTimeout(outgoingCallTimerRef.current);
      outgoingCallTimerRef.current = null;
    }

    // Clear active call state immediately
    setActiveCall(null);
    
    // Stop all sounds immediately
    stopAllSounds();
    
    // Cleanup media streams and peer connections immediately
    stopMediaStream();
    cleanupPeerConnections();

    // Emit end-call event to backend
    socket.emit('end-call', {
      callSessionId: activeCall.callSessionId,
    });

    // Re-register user to notify backend we're no longer in a call
    // This ensures the backend updates our presence state
    setTimeout(() => {
      if (user) {
        console.log('[CALL] Re-registering user after call end');
        socket.emit('register-user', {
          userId: user._id,
          userName: user.name,
          userType: user.role,
        });
      }
    }, 100);
    
    console.log('[CALL] Call ended and cleanup completed');
  }, [socket, activeCall, user, stopAllSounds, stopMediaStream, cleanupPeerConnections]);

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
