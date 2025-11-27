import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
}

interface UseVideoCallProps {
  appointmentId?: string;
  doctorId?: string;
  patientId?: string;
  currentUserId: string;
  currentUserName: string;
  isVideoCall: boolean;
}

export const useVideoCall = ({
  appointmentId,
  doctorId,
  patientId,
  currentUserId,
  currentUserName,
  isVideoCall
}: UseVideoCallProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [useBackendSession, setUseBackendSession] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Setup Socket.io event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('existing-participants', async (existingParticipants: Participant[]) => {
      console.log('Existing participants:', existingParticipants);
      for (const participant of existingParticipants) {
        await createPeerConnection(participant.socketId, true);
      }
    });

    socket.on('user-joined', async ({ socketId, userId, userName }: Participant) => {
      console.log(`${userName} joined the call`);
      setParticipants(prev => [...prev, { socketId, userId, userName }]);
      await createPeerConnection(socketId, false);
    });

    socket.on('offer', async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log('Received offer from:', from);
      await handleOffer(offer, from);
    });

    socket.on('answer', async ({ answer, from }: { answer: RTCSessionDescriptionInit; from: string }) => {
      console.log('Received answer from:', from);
      await handleAnswer(answer, from);
    });

    socket.on('ice-candidate', async ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
      await handleIceCandidate(candidate, from);
    });

    socket.on('user-left', ({ socketId, userId }: { socketId: string; userId: string }) => {
      console.log(`User left: ${userId}`);
      handleUserLeft(socketId);
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    });

    return () => {
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
    };
  }, [socket]);

  // Create peer connection
  const createPeerConnection = useCallback(async (remoteSocketId: string, isInitiator: boolean) => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
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
            from: socket.id
          });
        }
      };

      // Monitor connection state
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${remoteSocketId}:`, peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'connected') {
          setIsConnecting(false);
        } else if (peerConnection.connectionState === 'failed') {
          console.error('Connection failed, attempting restart');
          peerConnection.restartIce();
        }
      };

      peerConnectionsRef.current.set(remoteSocketId, peerConnection);

      // If initiator, create and send offer
      if (isInitiator && socket) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('offer', {
          offer,
          to: remoteSocketId,
          from: socket.id
        });
        console.log('Offer sent to:', remoteSocketId);
      }
    } catch (err) {
      console.error('Error creating peer connection:', err);
    }
  }, [socket]);

  // Handle incoming offer
  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    try {
      let peerConnection = peerConnectionsRef.current.get(from);

      if (!peerConnection) {
        await createPeerConnection(from, false);
        peerConnection = peerConnectionsRef.current.get(from);
      }

      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        if (socket) {
          socket.emit('answer', {
            answer,
            to: from,
            from: socket.id
          });
        }

        console.log('Answer sent to:', from);
      }
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit, from: string) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set for:', from);
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  // Handle incoming ICE candidate
  const handleIceCandidate = async (candidate: RTCIceCandidateInit, from: string) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(from);
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  };

  // Handle user leaving
  const handleUserLeft = (socketId: string) => {
    const peerConnection = peerConnectionsRef.current.get(socketId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(socketId);
    }

    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(socketId);
      return newMap;
    });
  };

  // Start call
  const startCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall
      });

      localStreamRef.current = stream;

      // Try to start session on backend
      let roomId = '';
      let sessionId = '';
      let useBackend = false;

      try {
        const response = await fetch(`${BACKEND_URL}/api/video/sessions/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId,
            doctorId,
            patientId
          })
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.sessionId) {
            roomId = data.roomId;
            sessionId = data.sessionId; // This is the actual MongoDB ObjectId from backend
            useBackend = true;
            console.log('Backend session created:', { roomId, sessionId });
          } else {
            console.warn('Backend session start returned success:false, using generated IDs');
            // Generate IDs locally as fallback
            roomId = `room-${appointmentId || currentUserId}-${Date.now()}`;
            sessionId = `session-${currentUserId}-${Date.now()}`;
          }
        } else {
          console.warn('Backend returned status:', response.status);
          // Generate IDs locally as fallback
          roomId = `room-${appointmentId || currentUserId}-${Date.now()}`;
          sessionId = `session-${currentUserId}-${Date.now()}`;
        }
      } catch (fetchError) {
        console.warn('Backend not available, using generated IDs for local testing:', fetchError);
        // Generate IDs locally as fallback for development
        roomId = `room-${appointmentId || currentUserId}-${Date.now()}`;
        sessionId = `session-${currentUserId}-${Date.now()}`;
      }

      setRoomId(roomId);
      setSessionId(sessionId);
      setUseBackendSession(useBackend);

      // Join room via Socket.io
      if (socket) {
        socket.emit('join-room', {
          roomId,
          userId: currentUserId,
          userName: currentUserName
        });
      }

      setIsCallActive(true);
      console.log('Call started successfully');
    } catch (err: any) {
      console.error('Error starting call:', err);
      setError(err.message || 'Failed to start call');
      setIsConnecting(false);
    }
  };

  // End call
  const endCall = async () => {
    try {
      // Leave room
      if (socket && roomId) {
        socket.emit('leave-room', {
          roomId,
          userId: currentUserId
        });
      }

      // Close all peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Clear remote streams
      setRemoteStreams(new Map());

      // End session on backend only if we're using backend (optional - doesn't block if it fails)
      if (sessionId && useBackendSession) {
        try {
          await fetch(`${BACKEND_URL}/api/video/sessions/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          }).catch(err => console.warn('Backend session end failed:', err));
        } catch (err) {
          console.warn('Error notifying backend of session end:', err);
        }
      }

      setIsCallActive(false);
      setIsConnecting(false);
      setRoomId(null);
      setSessionId(null);
      setParticipants([]);

      console.log('Call ended');
    } catch (err) {
      console.error('Error ending call:', err);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  };

  return {
    localStream: localStreamRef.current,
    remoteStreams,
    isCallActive,
    isConnecting,
    error,
    participants,
    startCall,
    endCall,
    toggleMute,
    toggleVideo
  };
};
