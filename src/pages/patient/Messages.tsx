import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCallSystem } from '@/contexts/CallSystemContext';
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

const PatientMessages = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { initiateCall } = useCallSystem();
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});
  const [directMessageMode, setDirectMessageMode] = useState(false);
  const [directMessages, setDirectMessages] = useState<Message[]>([]);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    if (!token || !user) return;
    
    // Check if coming from appointment detail page
    const user1 = searchParams.get('user1');
    const user2 = searchParams.get('user2');
    
    if (user1 && user2) {
      // Load messages between two specific users
      setDirectMessageMode(true);
      setSelectedDoctorId(user2);
      fetchMessagesBetweenUsers(user1, user2);
      fetchOtherUserInfo(user2);
    } else {
      // Default behavior - load all messages
      setDirectMessageMode(false);
      fetchAppointmentsAndDoctors();
      fetchMessagesByUser();
    }
  }, [token, user, searchParams]);

  useEffect(() => {
    // Trigger scroll when messages update or conversation changes
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 0);
    return () => clearTimeout(timer);
  }, [messages, directMessages, selectedDoctorId]);

  useEffect(() => {
    if (!token || !user) return;
    
    // Auto-refresh all messages every 2.5 seconds
    const interval = setInterval(() => {
      if (directMessageMode && selectedDoctorId) {
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
  }, [token, user, selectedDoctorId, directMessageMode, searchParams]);

  const fetchAppointmentsAndDoctors = async () => {
    try {
      const appointmentsData = await api.getAppointmentsForPatient(user._id, token);
      setAppointments(appointmentsData);
      // Fetch doctor names
      const doctorIds = [...new Set(appointmentsData.map(a => a.doctor_id).filter(Boolean))];
      const names: Record<string, string> = {};
      await Promise.all(doctorIds.map(async (id: string) => {
        try {
          const userData = await api.getUser(id, token);
          names[id] = userData.name;
        } catch {
          names[id] = 'Unknown Doctor';
        }
      }));
      setDoctorNames(names);
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
      setDoctorNames(prev => ({ ...prev, [userId]: userData.name }));
    } catch (error) {
      console.error('Error fetching user info:', error);
      setDoctorNames(prev => ({ ...prev, [userId]: 'Unknown User' }));
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
    if (!messageText.trim() || !selectedDoctorId || !user) return;
    setSending(true);
    try {
      const newMessage = await api.sendMessage(
        {
          sender_id: user._id,
          receiver_id: selectedDoctorId,
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
 
  const doctorIds = [...new Set(messages.map(m => m.receiver_id === user?._id ? m.sender_id : m.receiver_id))];
   
  const sortedDoctorIds = doctorIds.sort((id1, id2) => {
    const messages1 = messages.filter(m => (m.receiver_id === id1 || m.sender_id === id1));
    const messages2 = messages.filter(m => (m.receiver_id === id2 || m.sender_id === id2));
    
    const lastMessage1 = messages1[messages1.length - 1];
    const lastMessage2 = messages2[messages2.length - 1];
    
    const time1 = lastMessage1 ? new Date(lastMessage1.timestamp).getTime() : 0;
    const time2 = lastMessage2 ? new Date(lastMessage2.timestamp).getTime() : 0;
    
    return time2 - time1; // Latest first
  });
  
  const filteredDoctorIds = sortedDoctorIds.filter(id => doctorNames[id]?.toLowerCase().includes(searchQuery.toLowerCase()));

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in"> 

      <div className="hidden md:grid md:grid-cols-3 gap-6 h-[calc(100vh-150px)]">
        {/* Conversations List */}
        {!directMessageMode ? (
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
            ) : filteredDoctorIds.length > 0 ? (
              <div className="p-2">
                {filteredDoctorIds.map((doctorId) => {
                  const doctorName = doctorNames[doctorId] || 'Unknown Doctor';
                  const doctorMessages = messages.filter(m => (m.receiver_id === doctorId || m.sender_id === doctorId));
                  const lastMessage = doctorMessages[doctorMessages.length - 1];
                  const isSelected = selectedDoctorId === doctorId;
                  
                  return (
                    <button
                      key={doctorId}
                      onClick={() => setSelectedDoctorId(doctorId)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all hover:bg-accent/50 mb-2",
                        isSelected && "bg-primary/10 border-2 border-primary/50"
                      )}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12 border-2 border-background">
                          <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                            {getInitials(doctorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">
                              {doctorName}
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

        {/* Chat Area by Doctor */}
        <Card className={cn("flex flex-col h-full overflow-hidden", directMessageMode ? "lg:col-span-3" : "lg:col-span-2")}>
          {selectedDoctorId ? (
            <>
              <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-background">
                      <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                        {getInitials(doctorNames[selectedDoctorId] || 'D')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {doctorNames[selectedDoctorId] || 'Unknown Doctor'}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (selectedDoctorId) {
                          initiateCall(selectedDoctorId, doctorNames[selectedDoctorId] || 'Doctor', 'voice');
                        }
                      }}
                      className="hover:bg-primary hover:text-primary-foreground"
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (selectedDoctorId) {
                          initiateCall(selectedDoctorId, doctorNames[selectedDoctorId] || 'Doctor', 'video');
                        }
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
                  {(directMessageMode ? directMessages : messages.filter(m => (m.receiver_id === selectedDoctorId || m.sender_id === selectedDoctorId))).length > 0 ? (
                    (directMessageMode ? directMessages : messages.filter(m => (m.receiver_id === selectedDoctorId || m.sender_id === selectedDoctorId))).map((message) => {
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
                  Choose a doctor to start messaging
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Mobile view - Show conversation list */}
      <div className="md:hidden h-[calc(100vh-150px)]">
        {!showMobileChat ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
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
            <ScrollArea className="flex-1 min-h-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : doctorIds.filter(id => doctorNames[id]?.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                <div className="p-2">
                  {doctorIds
                    .sort((id1, id2) => {
                      const messages1 = messages.filter(m => (m.receiver_id === id1 || m.sender_id === id1));
                      const messages2 = messages.filter(m => (m.receiver_id === id2 || m.sender_id === id2));
                      
                      const lastMessage1 = messages1[messages1.length - 1];
                      const lastMessage2 = messages2[messages2.length - 1];
                      
                      const time1 = lastMessage1 ? new Date(lastMessage1.timestamp).getTime() : 0;
                      const time2 = lastMessage2 ? new Date(lastMessage2.timestamp).getTime() : 0;
                      
                      return time2 - time1;
                    })
                    .filter(id => doctorNames[id]?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((doctorId) => {
                      const doctorName = doctorNames[doctorId] || 'Unknown Doctor';
                      const doctorMessages = messages.filter(m => (m.receiver_id === doctorId || m.sender_id === doctorId));
                      const lastMessage = doctorMessages[doctorMessages.length - 1];
                      
                      return (
                        <button
                          key={doctorId}
                          onClick={() => {
                            setSelectedDoctorId(doctorId);
                            setShowMobileChat(true);
                          }}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all hover:bg-accent/50 mb-2",
                            "bg-primary/10 border border-primary/50"
                          )}
                        >
                          <div className="flex gap-3">
                            <Avatar className="h-12 w-12 border-2 border-background">
                              <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                                {getInitials(doctorName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-sm truncate">
                                  {doctorName}
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
        ) : (
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMobileChat(false)}
                  className="flex-shrink-0"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {doctorNames[selectedDoctorId || ''] || 'Doctor'}
                  </CardTitle>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (selectedDoctorId) {
                        initiateCall(selectedDoctorId, doctorNames[selectedDoctorId] || 'Doctor', 'voice');
                      }
                    }}
                    className="hover:bg-primary hover:text-primary-foreground"
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (selectedDoctorId) {
                        initiateCall(selectedDoctorId, doctorNames[selectedDoctorId] || 'Doctor', 'video');
                      }
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
                {(directMessageMode ? directMessages : messages.filter(m => (m.receiver_id === selectedDoctorId || m.sender_id === selectedDoctorId))).length > 0 ? (
                  (directMessageMode ? directMessages : messages.filter(m => (m.receiver_id === selectedDoctorId || m.sender_id === selectedDoctorId))).map((message) => {
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
                <Button type="submit" disabled={sending || !messageText.trim()} className="gap-2 px-3">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientMessages;
