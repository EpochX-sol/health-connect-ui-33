import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, Video, CheckCircle, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Appointment } from '@/types';

const DoctorAppointments = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const fetchAppointments = async () => {
    if (!token) return;
    
    try {
      const data = await api.getAppointments(token);
      setAppointments(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    if (!token) return;

    try {
      await api.updateAppointment(id, { status: 'completed' }, token);
      toast({
        title: 'Appointment Completed',
        description: 'The appointment has been marked as completed.',
      });
      fetchAppointments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete appointment',
        variant: 'destructive',
      });
    }
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return appointments.filter(
          apt => apt.status === 'booked' && new Date(apt.scheduled_time) > now
        );
      case 'completed':
        return appointments.filter(apt => apt.status === 'completed');
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'cancelled');
      default:
        return appointments;
    }
  };

  const filteredAppointments = getFilteredAppointments();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      booked: { variant: 'default', className: 'bg-medical-100 text-medical-700 hover:bg-medical-200' },
      completed: { variant: 'default', className: 'bg-success-100 text-success-700 hover:bg-success-200' },
      cancelled: { variant: 'destructive', className: '' },
      'in-progress': { variant: 'default', className: 'bg-accent-100 text-accent-700 hover:bg-accent-200' }
    };
    
    const config = variants[status] || variants.booked;
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {status}
      </Badge>
    );
  };

  const isAppointmentToday = (date: string) => {
    const aptDate = new Date(date);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your patient consultations
          </p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 gap-2">
          <TabsTrigger value="all">
            All ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({appointments.filter(a => a.status === 'booked' && new Date(a.scheduled_time) > new Date()).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({appointments.filter(a => a.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({appointments.filter(a => a.status === 'cancelled').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6 space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No appointments found</p>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all' 
                    ? 'You have no appointments scheduled yet' 
                    : `No ${filter} appointments`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <Card 
                  key={appointment._id} 
                  className={`shadow-elegant hover:shadow-glow transition-all ${
                    isAppointmentToday(appointment.scheduled_time) && appointment.status === 'booked'
                      ? 'border-medical-300 bg-medical-50/30'
                      : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-medical-100 rounded-lg">
                          <User className="h-6 w-6 text-medical-600" />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg text-foreground">
                                {appointment.patient?.name || 'Patient'}
                              </h3>
                              {isAppointmentToday(appointment.scheduled_time) && appointment.status === 'booked' && (
                                <Badge className="bg-accent-100 text-accent-700">Today</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {appointment.patient?.email || 'No email'}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(appointment.scheduled_time), 'MMMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {format(new Date(appointment.scheduled_time), 'h:mm a')}
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm text-foreground">
                                <strong>Notes:</strong> {appointment.notes}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {getStatusBadge(appointment.status)}
                            {appointment.type && (
                              <Badge variant="outline">{appointment.type}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {appointment.status === 'booked' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleCompleteAppointment(appointment._id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => navigate('/doctor/prescriptions')}
                            >
                              <FileText className="h-4 w-4" />
                              Prescribe
                            </Button>
                          </>
                        )}
                        {appointment.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => navigate('/doctor/prescriptions')}
                          >
                            <FileText className="h-4 w-4" />
                            View Records
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorAppointments;
