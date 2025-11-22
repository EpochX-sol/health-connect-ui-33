import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Message, Appointment } from '@/types';
import { Send, MessageSquare, Clock, Stethoscope, Search, Phone, Video } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CallModal } from '@/components/CallModal';

const PatientMessages = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (selectedAppointment) {
      scrollToBottom();
    }
  }, [messages, selectedAppointment]);

  const fetchData = async () => {
    try {
      const [appointmentsData, messagesData] = await Promise.all([
        api.getAppointments(token!),
        api.getMessages(token!)
      ]);
      setAppointments(appointmentsData);
      setMessages(messagesData);
    } catch (error) {
      toast({
        title: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedAppointment) return;

    setSending(true);
    try {
      const doctorId = typeof selectedAppointment.doctor_id === 'string' 
        ? selectedAppointment.doctor_id 
        : selectedAppointment.doctor_id._id;
      
      const newMessage = await api.sendMessage(
        {
          sender_id: user!._id,
          receiver_id: doctorId,
          appointment_id: selectedAppointment._id,
          content: messageText,
        },
        token!
      );
      
      setMessages([...messages, newMessage]);
      setMessageText('');
    } catch (error) {
      toast({
        title: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getAppointmentMessages = () => {
    if (!selectedAppointment) return [];
    return messages.filter((msg) => msg.appointment_id === selectedAppointment._id);
  };

  const getLastMessage = (appointmentId: string) => {
    const msgs = messages.filter((msg) => msg.appointment_id === appointmentId);
    return msgs[msgs.length - 1];
  };

  const filteredAppointments = appointments.filter((apt) =>
    apt.doctor?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
        <p className="text-muted-foreground">Communicate with your doctors</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="h-[calc(100%-120px)]">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="p-2">
                {filteredAppointments.map((appointment) => {
                  const lastMessage = getLastMessage(appointment._id);
                  const isSelected = selectedAppointment?._id === appointment._id;
                  
                  return (
                    <button
                      key={appointment._id}
                      onClick={() => setSelectedAppointment(appointment)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all hover:bg-accent/50 mb-2",
                        isSelected && "bg-primary/10 border-2 border-primary/50"
                      )}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12 border-2 border-background">
                          <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                            {getInitials(appointment.doctor?.name || 'D')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">
                              Dr. {appointment.doctor?.name}
                            </p>
                            {lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(lastMessage.timestamp), 'MMM dd')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No appointments found</p>
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedAppointment ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-background">
                      <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                        {getInitials(selectedAppointment.doctor?.name || 'D')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Dr. {selectedAppointment.doctor?.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" />
                        {selectedAppointment.doctorProfile?.specialty || 'Doctor'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {format(new Date(selectedAppointment.scheduled_time), 'MMM dd, yyyy')}
                    </Badge>
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
              </CardHeader>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {getAppointmentMessages().length > 0 ? (
                    getAppointmentMessages().map((message) => {
                      const isOwn = message.sender_id === user?._id;
                      return (
                        <div
                          key={message._id}
                          className={cn(
                            "flex gap-3",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-secondary text-secondary-foreground text-xs">
                                Dr
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2",
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(message.timestamp), 'HH:mm')}
                            </p>
                          </div>
                          {isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                                {getInitials(user?.name || 'U')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start the conversation with your doctor
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !messageText.trim()} className="gap-2">
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">Select a conversation</p>
                <p className="text-sm text-muted-foreground">
                  Choose an appointment to start messaging
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <CallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        isVideoCall={callType === 'video'}
        participantName={selectedAppointment?.doctor?.name || 'Doctor'}
        participantInitials={selectedAppointment?.doctor?.name 
          ? getInitials(selectedAppointment.doctor.name) 
          : 'D'}
      />
    </div>
  );
};

export default PatientMessages;
