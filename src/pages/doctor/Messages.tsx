import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Send, MessageSquare, Clock, Stethoscope, Search, Phone, Video, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CallModal } from '@/components/CallModal';

const DoctorMessages = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [directMessageMode, setDirectMessageMode] = useState(false);
  const [directMessages, setDirectMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!token || !user) return;
    
    // Check if coming from appointment detail page
    const user1 = searchParams.get('user1');
    const user2 = searchParams.get('user2');
    
    if (user1 && user2) {
      // Load messages between two specific users
      setDirectMessageMode(true);
      setSelectedPatientId(user2);
      fetchMessagesBetweenUsers(user1, user2);
      fetchOtherUserInfo(user2);
    } else {
      // Default behavior - load all messages
      setDirectMessageMode(false);
      fetchAppointmentsAndPatients();
      fetchMessagesByUser();
    }
  }, [token, user, searchParams]);

  useEffect(() => {
    // Trigger scroll when messages update or conversation changes
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 0);
    return () => clearTimeout(timer);
  }, [messages, directMessages, selectedPatientId]);

  useEffect(() => {
    if (!token || !user) return;
    
    // Auto-refresh all messages every 2.5 seconds
    const interval = setInterval(() => {
      if (directMessageMode && selectedPatientId) {
        const user1 = searchParams.get('user1');
        const user2 = searchParams.get('user2');
        if (user1 && user2) {
          fetchMessagesBetweenUsers(user1, user2);
        }
      } else {
        fetchMessagesByUser();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [token, user, selectedPatientId, directMessageMode, searchParams]);

  const fetchAppointmentsAndPatients = async () => {
    try {
      const appointmentsData = await api.getAppointmentsForDoctor(user._id, token);
      setAppointments(appointmentsData);
      // Fetch patient names
      const patientIds = [...new Set(appointmentsData.map(a => a.patient_id).filter(Boolean))];
      const names: Record<string, string> = {};
      await Promise.all(patientIds.map(async (id: string) => {
        try {
          const userData = await api.getUser(id, token);
          names[id] = userData.name;
        } catch {
          names[id] = 'Unknown Patient';
        }
      }));
      setPatientNames(names);
    } catch (error) {
      toast({
        title: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesByUser = async () => {
    if (!token || !user) return;
    try {
      const messagesData = await api.getMessagesByUser(user._id, token);
      console.log('Fetched messages:', messagesData);
      setMessages(messagesData);
    } catch (error) {
      toast({
        title: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const fetchMessagesBetweenUsers = async (user1Id: string, user2Id: string) => {
    if (!token) return;
    try {
      const messagesData = await api.getMessagesBetweenUsers(user1Id, user2Id, token);
      setDirectMessages(messagesData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages between users:', error);
      setDirectMessages([]);
      setLoading(false);
    }
  };

  const fetchOtherUserInfo = async (userId: string) => {
    if (!token) return;
    try {
      const userData = await api.getUser(userId, token);
      setPatientNames(prev => ({ ...prev, [userId]: userData.name }));
    } catch (error) {
      console.error('Error fetching user info:', error);
      setPatientNames(prev => ({ ...prev, [userId]: 'Unknown User' }));
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      // Find the scroll viewport inside the ScrollArea
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPatientId || !user) return;
    setSending(true);
    try {
      const newMessage = await api.sendMessage(
        {
          sender_id: user._id,
          receiver_id: selectedPatientId,
          content: messageText,
        },
        token
      );
      if (directMessageMode) {
        setDirectMessages([...directMessages, newMessage]);
      } else {
        setMessages([...messages, newMessage]);
      }
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
 
  const patientIds = [...new Set(messages.map(m => m.receiver_id === user?._id ? m.sender_id : m.receiver_id))];
   
  const sortedPatientIds = patientIds.sort((id1, id2) => {
    const messages1 = messages.filter(m => (m.receiver_id === id1 || m.sender_id === id1));
    const messages2 = messages.filter(m => (m.receiver_id === id2 || m.sender_id === id2));
    
    const lastMessage1 = messages1[messages1.length - 1];
    const lastMessage2 = messages2[messages2.length - 1];
    
    const time1 = lastMessage1 ? new Date(lastMessage1.timestamp).getTime() : 0;
    const time2 = lastMessage2 ? new Date(lastMessage2.timestamp).getTime() : 0;
    
    return time2 - time1; // Latest first
  });
  
  const filteredPatientIds = sortedPatientIds.filter(id => patientNames[id]?.toLowerCase().includes(searchQuery.toLowerCase()));

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in"> 
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-150px)]">
        {/* Conversations List */}
        {!directMessageMode ? (
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
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
            ) : filteredPatientIds.length > 0 ? (
              <div className="p-2">
                {filteredPatientIds.map((patientId) => {
                  const patientName = patientNames[patientId] || 'Unknown Patient';
                  const patientMessages = messages.filter(m => (m.receiver_id === patientId || m.sender_id === patientId));
                  const lastMessage = patientMessages[patientMessages.length - 1];
                  const isSelected = selectedPatientId === patientId;
                  
                  return (
                    <button
                      key={patientId}
                      onClick={() => setSelectedPatientId(patientId)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all hover:bg-accent/50 mb-2",
                        isSelected && "bg-primary/10 border-2 border-primary/50"
                      )}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12 border-2 border-background">
                          <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                            {getInitials(patientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">
                              {patientName}
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
                <p className="text-sm text-muted-foreground">No conversations found</p>
              </div>
            )}
          </ScrollArea>
        </Card>
        ) : null}

        {/* Chat Area */}
        <Card className={cn("flex flex-col h-full overflow-hidden", directMessageMode ? "lg:col-span-3" : "lg:col-span-2")}>
          {selectedPatientId ? (
            <>
              <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-background">
                      <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                        {getInitials(patientNames[selectedPatientId] || 'P')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {patientNames[selectedPatientId] || 'Unknown Patient'}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Patient</p>
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
              </CardHeader>

              <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
                <div className="space-y-4 p-4">
                  {(directMessageMode ? directMessages : messages.filter(m => (m.receiver_id === selectedPatientId || m.sender_id === selectedPatientId))).length > 0 ? (
                    (directMessageMode ? directMessages : messages.filter(m => (m.receiver_id === selectedPatientId || m.sender_id === selectedPatientId))).map((message) => {
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
                                Pt
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
                        Start the conversation with your patient
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t flex-shrink-0">
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
                  Choose a patient to start messaging
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
        participantName={patientNames[selectedPatientId || ''] || 'Patient'}
        participantInitials={selectedPatientId
          ? getInitials(patientNames[selectedPatientId] || 'P')
          : 'P'}
      />
    </div>
  );
};

export default DoctorMessages;
