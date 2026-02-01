import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Appointment, Prescription } from '@/types';
import { 
  Calendar, 
  Video, 
  MessageSquare, 
  Clock, 
  Plus, 
  Activity, 
  FileText, 
  Stethoscope,
  Pill,
  Heart
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const PatientDashboard = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (token && user?._id) {
      fetchData();
    }
  }, [token, user?._id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for user:', user?._id);
      console.log('Token:', token);

      const [appointmentsData, prescriptionsData] = await Promise.all([
        api.getAppointmentsForPatient(user!._id, token!),
        api.getAllPrescriptions(token!, user!._id)
      ]);

      console.log('Appointments received:', appointmentsData);
      console.log('Prescriptions received:', prescriptionsData);

      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);

      // Fetch doctor names for all appointments
      const appointmentList = Array.isArray(appointmentsData) ? appointmentsData : [];
      const doctorIds = [...new Set(appointmentList.map((apt: Appointment) => {
        return typeof apt.doctor_id === 'string' ? apt.doctor_id : apt.doctor_id?._id;
      }).filter(Boolean))] as string[];
      
      if (doctorIds.length > 0) {
        const doctorPromises = doctorIds.map(doctorId => 
          api.getUser(String(doctorId), token!)
        );
        const doctorResults = await Promise.all(doctorPromises);
        const names: Record<string, string> = {};
        doctorResults.forEach((doc) => {
          names[doc._id] = doc.name;
        });
        setDoctorNames(names);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Failed to load data',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      setAppointments([]);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = appointments
    .filter((apt) => {
      try {
        return apt.status === 'booked' && new Date(apt.scheduled_time) > new Date();
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
      } catch {
        return 0;
      }
    });

  const recentAppointments = upcomingAppointments.slice(0, 3);
  const completedCount = appointments.filter((apt) => apt.status === 'completed').length;
  const nextAppointment = upcomingAppointments[0];

  const getAppointmentTimeLabel = (date: Date) => {
    try {
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'MMM dd');
    } catch {
      return 'Scheduled';
    }
  };

  const getDoctorName = (appointment: Appointment) => {
    const doctorId = typeof appointment.doctor_id === 'string' 
      ? appointment.doctor_id 
      : appointment.doctor_id?._id;
    return doctorNames[doctorId || ''] || 'Doctor';
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="h-32 bg-muted rounded-2xl animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-primary-foreground/90 text-lg">Your health journey at a glance</p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-card hover:shadow-lg transition-all hover:-translate-y-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Upcoming</CardDescription>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{upcomingAppointments.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Appointments scheduled</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-card hover:shadow-lg transition-all hover:-translate-y-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Completed</CardDescription>
              <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{completedCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Total consultations</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-card hover:shadow-lg transition-all hover:-translate-y-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Prescriptions</CardDescription>
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Pill className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{prescriptions.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Active prescriptions</p>
          </CardContent>
        </Card>

        <Link to="/patient/book-appointment" className="block group">
          <Card className="h-full border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <CardHeader className="pb-3">
              <CardDescription className="group-hover:text-primary transition-colors">Quick Action</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:scale-110 transition-all">
                <Plus className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <p className="font-semibold text-foreground">Book Appointment</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {nextAppointment && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Next Appointment</CardTitle>
              <Badge className="ml-auto">
                {getAppointmentTimeLabel(new Date(nextAppointment.scheduled_time))}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-secondary flex items-center justify-center shadow-md">
                  <Stethoscope className="h-8 w-8 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-foreground">Dr. {getDoctorName(nextAppointment)}</p>
                  <p className="text-sm text-muted-foreground">Licensed Medical Professional</p>
                  <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(nextAppointment.scheduled_time), 'PPp')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="lg" className="gap-2" asChild>
                  <Link to={`/patient/appointment/${nextAppointment._id}`}>
                    <Video className="h-4 w-4" />
                    View Details
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link to={`/patient/doctor-profile/${typeof nextAppointment.doctor_id === 'string' ? nextAppointment.doctor_id : nextAppointment.doctor_id?._id}`}>
                    <Stethoscope className="h-4 w-4" />
                    Doctor Profile
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Appointments
                </CardTitle>
                <CardDescription>Your scheduled consultations</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/patient/appointments">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div key={appointment._id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-secondary flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Stethoscope className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          <Link 
                            to={`/patient/doctor-profile/${typeof appointment.doctor_id === 'string' ? appointment.doctor_id : appointment.doctor_id?._id}`}
                            className="hover:text-primary transition-colors"
                          >
                            Dr. {getDoctorName(appointment)}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">Medical Consultation</p>
                        <p className="text-sm text-foreground mt-1 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-primary" />
                          {format(new Date(appointment.scheduled_time), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{appointment.status}</Badge>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/patient/appointment/${appointment._id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4 font-medium">No upcoming appointments</p>
                <Button asChild className="gap-2">
                  <Link to="/patient/book-appointment">
                    <Plus className="w-4 h-4" />
                    Book Your First Appointment
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start gap-3 h-auto py-3" variant="outline" asChild>
                <Link to="/patient/book-appointment">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Book Appointment</p>
                    <p className="text-xs text-muted-foreground">Schedule consultation</p>
                  </div>
                </Link>
              </Button>
              <Button className="w-full justify-start gap-3 h-auto py-3" variant="outline" asChild>
                <Link to="/patient/messages">
                  <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Messages</p>
                    <p className="text-xs text-muted-foreground">Chat with doctors</p>
                  </div>
                </Link>
              </Button>
              <Button className="w-full justify-start gap-3 h-auto py-3" variant="outline" asChild>
                <Link to="/patient/prescriptions">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">Prescriptions</p>
                    <p className="text-xs text-muted-foreground">View medications</p>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-secondary" />
                <CardTitle className="text-lg">Health Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Stay hydrated! Aim to drink at least 8 glasses of water daily to maintain optimal health.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;