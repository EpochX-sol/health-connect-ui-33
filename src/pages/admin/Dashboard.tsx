import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, UserCheck, FileText, Activity, CheckCircle, XCircle, Clock, 
  DollarSign, TrendingUp, Calendar, AlertCircle, Edit, Trash2,
  BarChart3, PieChart, Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, DoctorProfile, Appointment } from '@/types';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart as RechartPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  totalPayments: number;
  totalRevenue: number;
  pendingDoctors: number;
  appointmentsByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDoctorDialog, setEditDoctorDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [editRate, setEditRate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [appointmentStatusDialog, setAppointmentStatusDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<'booked' | 'completed' | 'cancelled'>('booked');
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
   
    fetchData();
  }, [user, token]);

  const fetchData = async () => {
  if (!token) return;
  setLoading(true);

  try {
    const statsData = await api.getAdminStats(token);
    const usersData = await api.getAdminUsers(token);
    const doctorsData = await api.getAllDoctorProfiles(token);
    const appointmentsData = await api.getAppointments(token);
    const paymentsData = await api.getPayments(token);

    console.log('Fetched stats:', statsData, usersData, doctorsData, appointmentsData, paymentsData);

    setStats(statsData);
    setUsers(usersData);
    setDoctors(doctorsData);
    setAppointments(appointmentsData);
    setPayments(paymentsData);

    setPendingDoctors(
      doctorsData.filter((d: DoctorProfile) => d.verificationStatus === "pending")
    );
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to load dashboard data",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  const handleApproveDoctor = async (doctorId: string) => {
    if (!token) return;

    try {
      await api.approveDoctor(doctorId, 'Approved by admin', token);
      toast({
        title: 'Success',
        description: 'Doctor has been approved successfully',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve doctor',
        variant: 'destructive',
      });
    }
  };

  const handleRejectDoctor = async (doctorId: string) => {
    if (!token) return;

    try {
      await api.rejectDoctor(doctorId, 'Application rejected by admin', token);
      toast({
        title: 'Success',
        description: 'Doctor application has been rejected',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject doctor',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDoctorRate = async () => {
    if (!token || !selectedDoctor || !editRate) return;

    try {
      await api.setDoctorRate(selectedDoctor._id, parseFloat(editRate), token);
      toast({
        title: 'Success',
        description: 'Doctor rate updated successfully',
      });
      setEditDoctorDialog(false);
      setSelectedDoctor(null);
      setEditRate('');
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update doctor rate',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token || !confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.deleteAdminUser(userId, token);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAppointmentStatus = async () => {
    if (!token || !selectedAppointment) return;

    try {
      await api.updateAppointmentStatus(selectedAppointment._id, newStatus, token);
      toast({
        title: 'Success',
        description: `Appointment status updated to ${newStatus}`,
      });
      setAppointmentStatusDialog(false);
      setSelectedAppointment(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update appointment status',
        variant: 'destructive',
      });
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Generate appointments by status from the appointments array
  const generateAppointmentsByStatus = () => {
    const statusCounts: Record<string, number> = {};
    
    appointments.forEach((apt) => {
      const status = apt.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));
  };

  // Generate revenue by month from appointments (preferred) or payments
  const generateRevenueByMonth = () => {
    const revenueByMonth: Record<string, number> = {};
    
    // Try to calculate from appointments first (more reliable)
    if (appointments && appointments.length > 0) {
      appointments.forEach((apt) => {
        // Count only completed appointments with amount > 0
        if (apt.status === 'completed' && apt.totalAmount > 0) {
          try {
            const date = new Date(apt.scheduled_time);
            const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            revenueByMonth[month] = (revenueByMonth[month] || 0) + apt.totalAmount;
          } catch {
            // Skip if date parsing fails
          }
        }
      });
    }

    // Fall back to payments if no revenue from appointments
    if (Object.keys(revenueByMonth).length === 0 && payments && payments.length > 0) {
      payments.forEach((payment) => {
        if (payment.status === 'paid' && payment.amount > 0) {
          try {
            const date = new Date(payment.createdAt);
            const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            revenueByMonth[month] = (revenueByMonth[month] || 0) + payment.amount;
          } catch {
            // Skip if date parsing fails
          }
        }
      });
    }

    // Sort by month and return as array
    return Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => {
        try {
          return new Date(a.month).getTime() - new Date(b.month).getTime();
        } catch {
          return 0;
        }
      });
  };

  // Calculate total revenue
  const calculateTotalRevenue = () => {
    // Prefer calculating from payments when available, otherwise fall back to server stats
    if (payments && payments.length > 0) {
      return payments.reduce((total, payment) => {
        if (payment.status === 'paid' && payment.amount > 0) {
          return total + payment.amount;
        }
        return total;
      }, 0);
    }

    if (stats && typeof stats.totalRevenue === 'number') {
      return stats.totalRevenue;
    }

    return 0;
  };

  // Fallback function to get user by ID from the user list
  const getUserName = (id: string) => {
    const user = users.find((u) => u._id === id);
    return user ? user.name : id;
  };

  const getUserEmail = (id: string) => {
    const user = users.find((u) => u._id === id);
    return user ? user.email : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-medical-50 to-accent-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-medical-600 mx-auto"></div>
          <p className="mt-4 text-lg text-medical-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const fallbackAppointmentsByStatus = stats?.appointmentsByStatus || [];
  const fallbackRevenueByMonth = stats?.revenueByMonth || [];
  const fallbackPendingDoctors = stats?.pendingDoctors ?? pendingDoctors.length;
  const totalRevenue = calculateTotalRevenue();
  
  // Patch statCards to use fallbacks
  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: '+12%'
    },
    {
      title: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-100',
      trend: '+8%'
    },
    {
      title: 'Pending Approvals',
      value: fallbackPendingDoctors || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      trend: '-3%'
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: '+23%'
    },
    {
      title: 'Total Appointments',
      value: stats?.totalAppointments || 0,
      icon: Calendar,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
      trend: '+15%'
    },
    {
      title: 'Completed',
      value: stats?.completedAppointments || 0,
      icon: CheckCircle,
      color: 'text-teal-600',
      bg: 'bg-teal-100',
      trend: '+10%'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-6">
        {/* Header */}
        

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, idx) => (
            <Card key={stat.title} className=" border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bg} p-4 rounded-xl`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-md rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg">
              <Clock className="h-4 w-4 mr-2" />
              Pending ({pendingDoctors.length})
            </TabsTrigger>
            <TabsTrigger value="doctors" className="rounded-lg">
              <UserCheck className="h-4 w-4 mr-2" />
              Doctors ({doctors.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg">
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="appointments" className="rounded-lg">
              <Calendar className="h-4 w-4 mr-2" />
              Appointments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointments by Status */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Appointments by Status</CardTitle>
                  <CardDescription>Distribution of appointment statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {generateAppointmentsByStatus().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartPie>
                        <Pie
                          data={generateAppointmentsByStatus()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, count }) => `${status}: ${count}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {generateAppointmentsByStatus().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No appointment data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue by Month */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {generateRevenueByMonth().length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={generateRevenueByMonth()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>Latest appointments on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.slice(0, 5).map((appointment) => {
                    // Defensive: patient_id is string or object {name}
                    let patientName = '';
                    if (typeof appointment.patient_id === 'object' && appointment.patient_id !== null && 'name' in (appointment.patient_id as object)) {
                      patientName = String((appointment.patient_id as { name?: string }).name ?? '');
                    } else if (typeof appointment.patient_id === 'string') {
                      patientName = getUserName(appointment.patient_id);
                    } else {
                      patientName = 'Unknown Patient';
                    }
                    // doctor_id could be string, or { user: { name }, user_id }
                    let doctorName = '';
                    if (typeof appointment.doctor_id === 'object' && appointment.doctor_id !== null) {
                      if ('user' in (appointment.doctor_id as object) && (appointment.doctor_id as any).user && typeof (appointment.doctor_id as any).user === 'object' && 'name' in (appointment.doctor_id as any).user) {
                        doctorName = String((appointment.doctor_id as any).user.name ?? '');
                      } else if ('user_id' in (appointment.doctor_id as object)) {
                        const userId = (appointment.doctor_id as any).user_id;
                        if (typeof userId === 'string') {
                          doctorName = getUserName(userId);
                        } else if (userId && typeof userId === 'object' && '_id' in userId) {
                          doctorName = getUserName(userId._id);
                        } else {
                          doctorName = 'Unknown Doctor';
                        }
                      } else {
                        doctorName = 'Unknown Doctor';
                      }
                    } else if (typeof appointment.doctor_id === 'string') {
                      doctorName = getUserName(appointment.doctor_id);
                    } else {
                      doctorName = 'Unknown Doctor';
                    }
                    return (
                      <div key={appointment._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-medical-100 text-medical-700">
                              {(patientName || 'P').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{patientName || 'Unknown Patient'}</p>
                            <p className="text-sm text-muted-foreground">
                              Dr. {doctorName || 'Unknown Doctor'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            appointment.status === 'completed' ? 'default' :
                            appointment.status === 'cancelled' ? 'destructive' :
                            'secondary'
                          }>
                            {appointment.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(appointment.scheduled_time), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Doctors Tab */}
          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingDoctors.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-muted-foreground">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-2">No pending doctor applications</p>
                </CardContent>
              </Card>
            ) : (
              pendingDoctors.map((doctor) => (
                <Card key={doctor._id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-gradient-to-br from-medical-100 to-accent-100 text-medical-700 text-xl">
                            {(doctor.user?.name || getUserName(doctor.user_id) || 'D').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl">{doctor.user?.name || getUserName(doctor.user_id)}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{doctor.specialty}</p>
                          <p className="text-sm text-muted-foreground">{doctor.user?.email || getUserEmail(doctor.user_id)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">License Number</Label>
                          <p className="font-semibold">{doctor.medicalLicenseNumber}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Proposed Rate</Label>
                          <p className="font-semibold">${doctor.pricePerHour || 50}/hour</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Bio</Label>
                        <p className="text-sm mt-1">{doctor.bio}</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleApproveDoctor(doctor._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
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

          {/* All Doctors Tab */}
          <TabsContent value="doctors" className="space-y-4 mt-6">
            {doctors.map((doctor) => (
              <Card key={doctor._id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-gradient-to-br from-medical-100 to-accent-100 text-medical-700 text-lg">
                          {(doctor.user?.name || getUserName(doctor.user_id) || 'D').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{doctor.user?.name || getUserName(doctor.user_id)}</h3>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                        <p className="text-sm font-medium text-medical-600">${doctor.pricePerHour || 50}/hour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={doctor.isVerified ? 'default' : 'secondary'}
                        className={doctor.isVerified ? 'bg-green-100 text-green-700' : ''}
                      >
                        {doctor.verificationStatus}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setEditRate(doctor.pricePerHour?.toString() || '50');
                          setEditDoctorDialog(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            {users.map((usr) => (
              <Card key={usr._id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 text-lg">
                          {usr.name?.charAt?.(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{usr.name}</h3>
                        <p className="text-sm text-muted-foreground">{usr.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">{usr.role}</Badge>
                      {usr.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(usr._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4 mt-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>Complete list of platform appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appointments.map((appointment) => {
                    let patientName = '';
                    if (
                      typeof appointment.patient_id === 'object' &&
                      appointment.patient_id !== null &&
                      'name' in (appointment.patient_id as object)
                    ) {
                      patientName = String((appointment.patient_id as { name?: string }).name ?? '');
                    } else if (typeof appointment.patient_id === 'string') {
                      patientName = getUserName(appointment.patient_id);
                    } else {
                      patientName = 'Unknown';
                    }
                    let doctorName = '';
                    if (typeof appointment.doctor_id === 'object' && appointment.doctor_id !== null) {
                      if ('user' in (appointment.doctor_id as object) && (appointment.doctor_id as any).user && typeof (appointment.doctor_id as any).user === 'object' && 'name' in (appointment.doctor_id as any).user) {
                        doctorName = String((appointment.doctor_id as any).user.name ?? '');
                      } else if ('user_id' in (appointment.doctor_id as object)) {
                        const userId = (appointment.doctor_id as any).user_id;
                        if (typeof userId === 'string') {
                          doctorName = getUserName(userId);
                        } else if (userId && typeof userId === 'object' && '_id' in userId) {
                          doctorName = getUserName(userId._id);
                        } else {
                          doctorName = 'Unknown';
                        }
                      } else {
                        doctorName = 'Unknown';
                      }
                    } else if (typeof appointment.doctor_id === 'string') {
                      doctorName = getUserName(appointment.doctor_id);
                    } else {
                      doctorName = 'Unknown';
                    }
                    return (
                      <div key={appointment._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <Calendar className="h-10 w-10 text-medical-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{patientName || 'Unknown'} → Dr. {doctorName || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(appointment.scheduled_time), 'PPP p')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={
                            appointment.status === 'completed' ? 'default' :
                            appointment.status === 'cancelled' ? 'destructive' :
                            'secondary'
                          }>
                            {appointment.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setNewStatus(appointment.status as 'booked' | 'completed' | 'cancelled');
                              setAppointmentStatusDialog(true);
                            }}
                            className="ml-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Doctor Rate Dialog */}
      <Dialog open={editDoctorDialog} onOpenChange={setEditDoctorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Doctor Rate</DialogTitle>
            <DialogDescription>
              Update the hourly rate for Dr. {selectedDoctor?.user?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
                placeholder="Enter rate"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoctorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDoctorRate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Appointment Status Dialog */}
      <Dialog open={appointmentStatusDialog} onOpenChange={setAppointmentStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Appointment Status</DialogTitle>
            <DialogDescription>
              Change the status for this appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'booked' | 'completed' | 'cancelled')}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {selectedAppointment && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Current Status:</strong> {selectedAppointment.status}</p>
                <p><strong>Scheduled:</strong> {format(new Date(selectedAppointment.scheduled_time), 'PPP p')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAppointmentStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;