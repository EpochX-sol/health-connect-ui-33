import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PhoneOff } from 'lucide-react';
import { OutgoingCallData } from '@/hooks/useCallState';

interface OutgoingCallModalProps {
  outgoingCall: OutgoingCallData | null;
  onCancel: () => void;
}

export const OutgoingCallModal = ({ outgoingCall, onCancel }: OutgoingCallModalProps) => {
  const [duration, setDuration] = useState(0);
  const [dots, setDots] = useState('.');

  useEffect(() => {
    if (!outgoingCall) return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [outgoingCall]);

  useEffect(() => {
    if (!outgoingCall) return;

    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '.';
      });
    }, 600);

    return () => clearInterval(dotsInterval);
  }, [outgoingCall]);

  if (!outgoingCall) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const callTypeText = outgoingCall.callType === 'video' ? 'Video Call' : 'Voice Call';

  return (
    <Dialog open={!!outgoingCall} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm rounded-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold">Calling {outgoingCall.recipientName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* Recipient Avatar */}
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 text-white">
              {getInitials(outgoingCall.recipientName)}
            </AvatarFallback>
          </Avatar>

          {/* Recipient Name and Call Type */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{outgoingCall.recipientName}</h2>
            <p className="text-sm text-muted-foreground mt-1">{callTypeText}</p>
          </div>

          {/* Calling Status */}
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Calling<span className="inline-block w-6 text-left">{dots}</span>
            </p>
            {duration > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Ringing for {duration} {duration === 1 ? 'second' : 'seconds'}
              </p>
            )}
          </div>

          {/* Call Type Indicator */}
          <div className="text-xs text-muted-foreground">
            {outgoingCall.callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
          </div>

          {/* Cancel Button */}
          <Button
            onClick={onCancel}
            size="lg"
            className="w-full bg-red-500 hover:bg-red-600 text-white gap-2"
          >
            <PhoneOff className="h-5 w-5" />
            Cancel Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OutgoingCallModal;
