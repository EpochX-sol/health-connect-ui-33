import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageSquare, User, Phone, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Message, Appointment } from '@/types';
import { CallModal } from '@/components/CallModal';

interface Conversation {
  appointment: Appointment;
  messages: Message[];
  lastMessage?: Message;
}

const DoctorMessages = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    if (!token || !user) return;

    try {
      const [messages, appointments]: [Message[], Appointment[]] = await Promise.all([
        api.getMessages(token),
        api.getAppointments(token)
      ]);

      // Group messages by appointment
      const convMap = new Map<string, Conversation>();
      
      appointments.forEach(apt => {
        if (apt.patient) {
          convMap.set(apt._id, {
            appointment: apt,
            messages: [],
            lastMessage: undefined
          });
        }
      });

      messages.forEach(msg => {
        const conv = convMap.get(msg.appointment_id);
        if (conv) {
          conv.messages.push(msg);
          if (!conv.lastMessage || new Date(msg.timestamp) > new Date(conv.lastMessage.timestamp)) {
            conv.lastMessage = msg;
          }
        }
      });

      // Sort messages within conversations
      convMap.forEach(conv => {
        conv.messages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      const convArray = Array.from(convMap.values())
        .filter(c => c.messages.length > 0)
        .sort((a, b) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
          return bTime - aTime;
        });

      setConversations(convArray);
      if (convArray.length > 0 && !selectedConversation) {
        setSelectedConversation(convArray[0]);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !token || !user) return;

    setSending(true);
    try {
      await api.sendMessage({
        sender_id: user._id,
        receiver_id: selectedConversation.appointment.patient_id,
        appointment_id: selectedConversation.appointment._id,
        content: messageText
      }, token);

      setMessageText('');
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with your patients
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card className="shadow-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">
              Messages from patients will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="shadow-elegant md:col-span-1">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.appointment._id}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedConversation?.appointment._id === conv.appointment._id
                        ? 'bg-medical-100 border-2 border-medical-300'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-medical-200 text-medical-700">
                          {conv.appointment.patient?.name ? getInitials(conv.appointment.patient.name) : 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {conv.appointment.patient?.name || 'Patient'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.content || 'No messages'}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(conv.lastMessage.timestamp), 'MMM dd, h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="shadow-elegant md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-medical-200 text-medical-700">
                          {selectedConversation.appointment.patient?.name 
                            ? getInitials(selectedConversation.appointment.patient.name) 
                            : 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">
                          {selectedConversation.appointment.patient?.name || 'Patient'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.appointment.patient?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setCallType('voice');
                          setIsCallOpen(true);
                        }}
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setCallType('video');
                          setIsCallOpen(true);
                        }}
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        <Video className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message) => {
                      const isSentByMe = message.sender_id === user?._id;
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isSentByMe
                                ? 'bg-gradient-medical text-white'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isSentByMe ? 'text-medical-100' : 'text-muted-foreground'
                            }`}>
                              {format(new Date(message.timestamp), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      disabled={sending}
                    />
                    <Button 
                      type="submit" 
                      disabled={sending || !messageText.trim()}
                      className="bg-gradient-medical hover:opacity-90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      <CallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        isVideoCall={callType === 'video'}
        participantName={selectedConversation?.appointment.patient?.name || 'Patient'}
        participantInitials={selectedConversation?.appointment.patient?.name 
          ? getInitials(selectedConversation.appointment.patient.name) 
          : 'P'}
      />
    </div>
  );
};

export default DoctorMessages;
