import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAuthData } from '@/lib/auth';
import { Appointment } from '@/types';
import { Calendar, Clock, Video, MapPin, Phone, Mail, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const authData = getAuthData();
      if (!authData) {
        navigate('/login');
        return;
      }

      const data = await api.getAppointments(authData.token);
      setAppointments(data);
    } catch (error) {
      toast({
        title: 'Failed to load appointments',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      const authData = getAuthData();
      if (!authData) return;

      await api.cancelAppointment(id, authData.token);
      toast({
        title: 'Appointment cancelled',
        description: 'Your appointment has been cancelled successfully.',
      });
      loadAppointments();
    } catch (error) {
      toast({
        title: 'Failed to cancel appointment',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      booked: { variant: 'default', icon: Clock },
      completed: { variant: 'secondary', icon: CheckCircle2 },
      cancelled: { variant: 'destructive', icon: X },
      'in-progress': { variant: 'default', icon: Video },
    };

    const config = variants[status] || variants.booked;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filterAppointments = (appointments: Appointment[]) => {
    const now = new Date();
    
    switch (selectedFilter) {
      case 'upcoming':
        return appointments.filter(
          (apt) => {
            const aptTime = apt.dateTime || apt.scheduled_time;
            return apt.status === 'booked' && new Date(aptTime) > now;
          }
        );
      case 'completed':
        return appointments.filter((apt) => apt.status === 'completed');
      case 'cancelled':
        return appointments.filter((apt) => apt.status === 'cancelled');
      default:
        return appointments;
    }
  };

  const filteredAppointments = filterAppointments(appointments);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Appointments</h1>
          <p className="text-muted-foreground">Manage your upcoming and past appointments</p>
        </div>
        <Button onClick={() => navigate('/patient/appointments/book')} size="lg">
          <Calendar className="w-5 h-5 mr-2" />
          Book New Appointment
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedFilter}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <AppointmentsList
            appointments={filteredAppointments}
            onCancel={setCancelingId}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-6">
          <AppointmentsList
            appointments={filteredAppointments}
            onCancel={setCancelingId}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <AppointmentsList
            appointments={filteredAppointments}
            onCancel={setCancelingId}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6">
          <AppointmentsList
            appointments={filteredAppointments}
            onCancel={setCancelingId}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!cancelingId} onOpenChange={() => setCancelingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelingId && handleCancelAppointment(cancelingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface AppointmentsListProps {
  appointments: Appointment[];
  onCancel: (id: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AppointmentsList = ({ appointments, onCancel, getStatusBadge }: AppointmentsListProps) => {
  if (appointments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
          <p className="text-muted-foreground text-center mb-4">
            You don't have any appointments in this category yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {appointments.map((appointment) => {
        const doctorData = typeof appointment.doctor_id === 'object' ? appointment.doctor_id : null;
        const doctorName = doctorData?.user_id?.name || 'Unknown Doctor';
        const isVerified = doctorData?.isVerified || false;
        const specialty = doctorData?.specialty || 'General Practice';
        const appointmentTime = appointment.dateTime || appointment.scheduled_time;
        const consultationType = appointment.type || 'video';
        
        return (
          <Card key={appointment._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    Dr. {doctorName}
                    {isVerified && (
                      <CheckCircle2 className="w-5 h-5 text-medical-success" />
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {specialty}
                  </CardDescription>
                </div>
                {getStatusBadge(appointment.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-muted-foreground">
                      {format(new Date(appointmentTime), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-muted-foreground">
                      {format(new Date(appointmentTime), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-full bg-medical-accent/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-medical-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Consultation Type</p>
                    <p className="text-muted-foreground capitalize">{consultationType}</p>
                  </div>
                </div>
                {appointment.payment_id && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-full bg-medical-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-medical-success" />
                    </div>
                    <div>
                      <p className="font-medium">Payment</p>
                      <p className="text-muted-foreground">
                        ETB {appointment.payment_id.amount}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {appointment.status === 'booked' && new Date(appointmentTime) > new Date() && (
                  <>
                    <Button variant="default" size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Join Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Doctor
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onCancel(appointment._id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
                {appointment.status === 'completed' && (
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    View Prescription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Appointments;
