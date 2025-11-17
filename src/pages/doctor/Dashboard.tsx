import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, FileText, Clock, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { Appointment, DoctorProfile } from '@/types';

const DoctorDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) return;
      
      try {
        const [appointmentsData, profileData] = await Promise.all([
          api.getAppointments(token),
          api.getDoctorProfile(user._id, token)
        ]);
        
        setAppointments(appointmentsData);
        setDoctorProfile(profileData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  const upcomingAppointments = appointments.filter(
    apt => apt.status === 'booked' && new Date(apt.scheduled_time) > new Date()
  ).slice(0, 3);

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_time);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString() && apt.status === 'booked';
  });

  const completedCount = appointments.filter(apt => apt.status === 'completed').length;
  const totalPatients = new Set(appointments.map(apt => apt.patient_id)).size;

  const stats = [
    {
      title: 'Today\'s Appointments',
      value: todayAppointments.length,
      icon: Calendar,
      description: 'Scheduled for today',
      color: 'text-medical-600',
      bg: 'bg-medical-100'
    },
    {
      title: 'Total Patients',
      value: totalPatients,
      icon: Users,
      description: 'Active patients',
      color: 'text-accent-600',
      bg: 'bg-accent-100'
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: FileText,
      description: 'Appointments done',
      color: 'text-success-600',
      bg: 'bg-success-100'
    },
    {
      title: 'Verification',
      value: doctorProfile?.isVerified ? 'Verified' : 'Pending',
      icon: Activity,
      description: doctorProfile?.verificationStatus || 'Not started',
      color: doctorProfile?.isVerified ? 'text-success-600' : 'text-warning-600',
      bg: doctorProfile?.isVerified ? 'bg-success-100' : 'bg-warning-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-medical rounded-xl p-8 text-white shadow-elegant">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Dr. {user?.name}</h1>
            <p className="text-medical-100 text-lg">
              {doctorProfile?.specialty || 'Medical Professional'}
            </p>
            <p className="text-medical-200 mt-2">
              {todayAppointments.length > 0 
                ? `You have ${todayAppointments.length} appointment${todayAppointments.length > 1 ? 's' : ''} today`
                : 'No appointments scheduled for today'}
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-elegant hover:shadow-glow transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Status Alert */}
      {!doctorProfile?.isVerified && (
        <Card className="border-warning-200 bg-warning-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-warning-900">Account Verification Pending</h3>
                <p className="text-sm text-warning-700 mt-1">
                  Your account is currently under review. You'll be able to accept appointments once verified by our admin team.
                </p>
                {doctorProfile?.verificationNotes && (
                  <p className="text-sm text-warning-600 mt-2 italic">
                    Note: {doctorProfile.verificationNotes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your next scheduled consultations</CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/doctor/appointments')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-medical-300 hover:bg-medical-50/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/doctor/appointments`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-medical-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-medical-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {appointment.patient?.name || 'Patient'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appointment.scheduled_time), 'MMMM dd, yyyy • h:mm a')}
                      </p>
                      {appointment.type && (
                        <Badge variant="outline" className="mt-2">
                          {appointment.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary"
                    className="bg-medical-100 text-medical-700 hover:bg-medical-200"
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              onClick={() => navigate('/doctor/appointments')}
            >
              <Calendar className="h-6 w-6 text-medical-600" />
              <span className="font-medium">View Appointments</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              onClick={() => navigate('/doctor/patients')}
            >
              <Users className="h-6 w-6 text-accent-600" />
              <span className="font-medium">Manage Patients</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              onClick={() => navigate('/doctor/prescriptions')}
            >
              <FileText className="h-6 w-6 text-success-600" />
              <span className="font-medium">Create Prescription</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
