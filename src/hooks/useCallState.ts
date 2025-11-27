import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

  const outgoingCallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringbackRef = useRef<HTMLAudioElement | null>(null);

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
    };
  }, [socket, user, outgoingCall, incomingCall]);

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
    (recipientId: string, recipientName: string, callType: 'voice' | 'video') => {
      if (!socket) return;

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
        toast({
          title: 'No Answer',
          description: 'The call was not answered',
          variant: 'destructive',
        });
      }, 30000); // 30 seconds

      outgoingCallTimerRef.current = timer;
    },
    [socket, playRingbackTone, stopRingbackTone, toast]
  );

  // Accept incoming call
  const acceptCall = useCallback(() => {
    if (!socket || !incomingCall) return;

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
  }, [socket, incomingCall, stopRingtone]);

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
  }, [socket, activeCall, stopAllSounds]);

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
  };
};
