import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserCheck, FileText, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, DoctorProfile, Appointment } from '@/types';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, token]);

  const fetchData = async () => {
    if (!token) return;

    try {
      const [usersData, doctorsData, appointmentsData] = await Promise.all([
        api.getAllUsers(token),
        api.getAllDoctors(token),
        api.getAppointments(token)
      ]);

      setUsers(usersData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setPendingDoctors(doctorsData.filter((d: DoctorProfile) => d.verificationStatus === 'pending'));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId: string) => {
    if (!token) return;

    try {
      await api.updateDoctorProfile(doctorId, {
        isVerified: true,
        verificationStatus: 'approved'
      }, token);

      toast({
        title: 'Doctor Approved',
        description: 'The doctor has been verified and can now accept appointments',
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve doctor',
        variant: 'destructive',
      });
    }
  };

  const handleRejectDoctor = async (doctorId: string) => {
    if (!token) return;

    try {
      await api.updateDoctorProfile(doctorId, {
        isVerified: false,
        verificationStatus: 'rejected',
        verificationNotes: 'Application rejected by admin'
      }, token);

      toast({
        title: 'Doctor Rejected',
        description: 'The doctor application has been rejected',
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject doctor',
        variant: 'destructive',
      });
    }
  };

  const stats = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'text-medical-600',
      bg: 'bg-medical-100'
    },
    {
      title: 'Verified Doctors',
      value: doctors.filter(d => d.isVerified).length,
      icon: UserCheck,
      color: 'text-success-600',
      bg: 'bg-success-100'
    },
    {
      title: 'Pending Verification',
      value: pendingDoctors.length,
      icon: Clock,
      color: 'text-warning-600',
      bg: 'bg-warning-100'
    },
    {
      title: 'Total Appointments',
      value: appointments.length,
      icon: FileText,
      color: 'text-accent-600',
      bg: 'bg-accent-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-accent-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-medical rounded-xl p-8 text-white shadow-elegant">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-medical-100">Manage users, doctors, and appointments</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-elegant hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-4 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending Doctors ({pendingDoctors.length})</TabsTrigger>
            <TabsTrigger value="doctors">All Doctors ({doctors.length})</TabsTrigger>
            <TabsTrigger value="users">All Users ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingDoctors.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending doctor applications</p>
                </CardContent>
              </Card>
            ) : (
              pendingDoctors.map((doctor) => (
                <Card key={doctor._id} className="shadow-elegant">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-medical-100 text-medical-700">
                            {doctor.user?.name.charAt(0) || 'D'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{doctor.user?.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                          <p className="text-sm text-muted-foreground">{doctor.user?.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-warning-100 text-warning-700">
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Bio</h4>
                        <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">License Number</h4>
                        <p className="text-sm">{doctor.medicalLicenseNumber}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Price per Hour</h4>
                        <p className="text-sm">${doctor.pricePerHour || 50}/hour</p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApproveDoctor(doctor._id)}
                          className="flex-1 bg-success-600 hover:bg-success-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectDoctor(doctor._id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            {doctors.map((doctor) => (
              <Card key={doctor._id} className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-medical-100 text-medical-700">
                          {doctor.user?.name.charAt(0) || 'D'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{doctor.user?.name}</h3>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                        <p className="text-sm text-muted-foreground">${doctor.pricePerHour || 50}/hour</p>
                      </div>
                    </div>
                    <Badge
                      variant={doctor.isVerified ? 'default' : 'secondary'}
                      className={doctor.isVerified ? 'bg-success-100 text-success-700' : ''}
                    >
                      {doctor.verificationStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {users.map((usr) => (
              <Card key={usr._id} className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-accent-100 text-accent-700">
                          {usr.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{usr.name}</h3>
                        <p className="text-sm text-muted-foreground">{usr.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{usr.role}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
