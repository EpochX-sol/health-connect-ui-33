import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Eye, Search, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types';

const DoctorAppointments = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && token) {
      fetchAppointments();
    }
  }, [user, token]);

  const fetchAppointments = async () => {
    if (!token || !user) return;
    
    try {
      const data = await api.getAppointmentsForDoctor(user._id, token);
      setAppointments(data);

      // Fetch patient names
      const patientIds = [...new Set(data.map((apt: Appointment) => apt.patient_id).filter(Boolean))] as string[];
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

  const getPatientName = (apt: Appointment) => {
    return patientNames[apt.patient_id || ''] || 'Unknown Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in-progress':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredAppointments = appointments.filter((apt) =>
    getPatientName(apt).toLowerCase().includes(searchQuery.toLowerCase()) ||
    format(new Date(apt.scheduled_time), 'MMM dd, yyyy').includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Appointments</h1>
        <p className="text-muted-foreground">Manage your appointments with patients</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => {
            const patientName = patientNames[appointment.patient_id || ''] || 'Unknown Patient';
            
            return (
              <Card
                key={appointment._id}
                className="hover:shadow-lg transition-all hover:border-primary/50"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {patientName}
                        </h3>
                        <Badge className={cn('px-2 py-1 text-xs', getStatusColor(appointment.status))}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(appointment.scheduled_time), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(appointment.scheduled_time), 'HH:mm')}
                        </div>
                        <div className="text-muted-foreground">
                          {appointment.type ? (appointment.type === 'video' ? '📹 Video Call' : '☎️ Audio Call') : 'Call'}
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col md:items-end w-full gap-2 md:w-auto">
                      <Button
                        onClick={() => navigate(`/doctor/appointment/${appointment._id}`)}
                        className="gap-2 md:w-auto w-full"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>

                      <Button
                        onClick={() => navigate(`/doctor/messages?user1=${user?._id}&user2=${appointment.patient_id}`)}
                        variant="outline"
                        className="gap-2 md:w-auto w-full"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No appointments found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search' : 'You have no upcoming appointments'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorAppointments;
