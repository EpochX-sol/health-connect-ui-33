import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, PhoneOff } from 'lucide-react';
import { IncomingCallData } from '@/hooks/useCallState';

interface IncomingCallModalProps {
  incomingCall: IncomingCallData | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal = ({ incomingCall, onAccept, onReject }: IncomingCallModalProps) => {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    if (incomingCall) {
      setIsRinging(true);
      // Pulse animation
      const interval = setInterval(() => {
        setIsRinging((prev) => !prev);
      }, 600);

      return () => clearInterval(interval);
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const callTypeText = incomingCall.callType === 'video' ? 'Video Call' : 'Voice Call';

  return (
    <Dialog open={!!incomingCall} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm rounded-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold">Incoming {callTypeText}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* Caller Avatar with pulse animation */}
          <div className={`transition-transform duration-300 ${isRinging ? 'scale-105' : 'scale-100'}`}>
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                {getInitials(incomingCall.callerName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Name and Call Type */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{incomingCall.callerName}</h2>
            <p className="text-sm text-muted-foreground mt-1">{callTypeText}</p>
          </div>

          {/* Ringing indicator */}
          <div className="flex gap-2">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Ringing...</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full">
            {/* Reject Button */}
            <Button
              onClick={onReject}
              size="lg"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white gap-2"
            >
              <PhoneOff className="h-5 w-5" />
              Decline
            </Button>

            {/* Accept Button */}
            <Button
              onClick={onAccept}
              size="lg"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
            >
              <Phone className="h-5 w-5" />
              Accept
            </Button>
          </div>

          {/* Call Type Indicator */}
          <div className="text-xs text-muted-foreground text-center">
            {incomingCall.callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallModal;
