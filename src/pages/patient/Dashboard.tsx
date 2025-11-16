import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Appointment } from '@/types';
import { Calendar, Video, MessageSquare, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const PatientDashboard = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchAppointments();
    }
  }, [token]);

  const fetchAppointments = async () => {
    try {
      const data = await api.getAppointments(token!);
      setAppointments(data.filter((apt: Appointment) => apt.status === 'booked'));
    } catch (error) {
      toast({
        title: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.scheduled_time) > new Date())
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Manage your appointments and health records</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-primary text-primary-foreground border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/80">Upcoming</CardDescription>
            <CardTitle className="text-3xl">{upcomingAppointments.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-primary-foreground/80">Appointments scheduled</p>
          </CardContent>
        </Card>

        <Link to="/patient/appointments/book" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription>Quick Action</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Book Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Schedule a new appointment</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/patient/messages" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription>Communication</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Chat with your doctors</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/patient/prescriptions" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription>Medical Records</CardDescription>
              <CardTitle className="text-2xl">Rx</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View prescriptions</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your scheduled consultations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {appointment.doctor?.name || 'Doctor'}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(appointment.scheduled_time), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{appointment.status}</Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/patient/appointments/${appointment._id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {appointments.length > 3 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/patient/appointments">View All Appointments</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                <Button asChild>
                  <Link to="/patient/appointments/book">
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/patient/appointments/book">
                <Plus className="w-4 h-4 mr-2" />
                Book Appointment
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/patient/messages">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link to="/patient/profile">
                <Calendar className="w-4 h-4 mr-2" />
                Update Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
