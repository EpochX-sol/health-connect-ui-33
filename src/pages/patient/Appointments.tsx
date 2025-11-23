import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';
import { Calendar, Clock, Eye, Search, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PatientAppointments = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && token) {
      loadAppointments();
    }
  }, [user, token]);

  const loadAppointments = async () => {
    try {
      if (!user) return;
      const data = await api.getAppointmentsForPatient(user._id, token);
      setAppointments(data);

      // Fetch doctor names
      const doctorIds = [...new Set(data.map((apt: Appointment) => {
        const id = typeof apt.doctor_id === 'string' ? apt.doctor_id : apt.doctor_id?._id;
        return id;
      }).filter(Boolean))] as string[];

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

  const getDoctorName = (apt: Appointment) => {
    const doctorId = typeof apt.doctor_id === 'string' ? apt.doctor_id : apt.doctor_id?._id;
    return doctorNames[doctorId || ''] || 'Unknown Doctor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
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
    getDoctorName(apt).toLowerCase().includes(searchQuery.toLowerCase()) ||
    format(new Date(apt.scheduled_time), 'MMM dd, yyyy').includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">My Appointments</h1>
        <p className="text-muted-foreground">View and manage your appointments with doctors</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by doctor name or date..."
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
            const doctorId = typeof appointment.doctor_id === 'string' 
              ? appointment.doctor_id 
              : appointment.doctor_id?._id;
            const doctorName = doctorNames[doctorId || ''] || 'Unknown Doctor';
            
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
                          <Link 
                            to={`/patient/doctor-profile/${doctorId}`}
                            className="hover:text-primary transition-colors hover:underline"
                          >
                            Dr. {doctorName}
                          </Link>
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

                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/patient/doctor-profile/${doctorId}`)}
                        className="gap-2"
                      >
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Doctor</span>
                      </Button>
                      <Button
                        onClick={() => navigate(`/patient/appointment/${appointment._id}`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
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
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search' : 'Book your first appointment with a doctor'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/patient/book-appointment')}>
                  Book Appointment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientAppointments;
