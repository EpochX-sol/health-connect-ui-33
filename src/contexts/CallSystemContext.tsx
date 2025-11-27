import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallState, IncomingCallData, OutgoingCallData, ActiveCallData, OnlineUser } from '@/hooks/useCallState';

interface CallContextType {
  socket: Socket | null;
  incomingCall: IncomingCallData | null;
  outgoingCall: OutgoingCallData | null;
  activeCall: ActiveCallData | null;
  onlineUsers: OnlineUser[];
  isUserOnline: boolean;
  initiateCall: (recipientId: string, recipientName: string, callType: 'voice' | 'video') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
  stopAllSounds: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallSystemProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001', {
      auth: {
        token,
        userId: user._id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket.io connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const callState = useCallState(socket);

  return (
    <CallContext.Provider value={{ socket, ...callState }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCallSystem = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCallSystem must be used within CallSystemProvider');
  }
  return context;
};
