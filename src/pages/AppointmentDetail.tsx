import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Appointment, Prescription } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Video,
  FileText,
  Download,
  Edit2,
  Save,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Plus,
  Pill,
  User,
} from 'lucide-react';
import { format, isPast, isWithinInterval, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (id && token && user) {
      fetchAppointmentDetail();
    }
  }, [id, token, user]);

  const fetchAppointmentDetail = async () => {
    try {
      const apt = await api.getAppointmentById(id!, token!);
      setAppointment(apt);

      // Fetch doctor info
      if (apt.doctor_id) {
        const doctorId = typeof apt.doctor_id === 'string' ? apt.doctor_id : apt.doctor_id._id;
        const doctorData = await api.getUser(doctorId, token!);
        setDoctorInfo(doctorData);
      }

      // Fetch patient info if user is doctor
      if (user?.role === 'doctor' && apt.patient_id) {
        const patientData = await api.getUser(apt.patient_id, token!);
        setPatientInfo(patientData);
      }

      // Fetch prescriptions
      if (apt._id) {
        try {
          const prescsData = await api.getPrescriptionsByAppointment(apt._id, token!);
          setPrescriptions(prescsData);
        } catch {
          // No prescriptions yet
        }
      }

      setNotes(apt.notes || '');
    } catch (error) {
      toast({
        title: 'Failed to load appointment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!appointment) return;
    setSavingNotes(true);
    try {
      // Update appointment notes
      await api.updateAppointmentNotes(appointment._id, notes, token!);
      toast({
        title: 'Notes saved successfully',
      });
      setIsEditingNotes(false);
    } catch (error) {
      toast({
        title: 'Failed to save notes',
        variant: 'destructive',
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await api.cancelAppointment(appointment._id, token!);
      toast({
        title: 'Appointment cancelled',
      });
      navigate(user?.role === 'patient' ? '/patient/appointments' : '/doctor/appointments');
    } catch (error) {
      toast({
        title: 'Failed to cancel appointment',
        variant: 'destructive',
      });
    }
  };

  const handleMarkCompleted = async () => {
    if (!appointment) return;
    try {
      await api.completeAppointment(appointment._id, token!);
      toast({
        title: 'Appointment marked as completed',
      });
      setAppointment({ ...appointment, status: 'completed' });
    } catch (error) {
      toast({
        title: 'Failed to complete appointment',
        variant: 'destructive',
      });
    }
  };

  const canJoinCall = () => {
    if (!appointment) return false;
    const appointmentTime = new Date(appointment.scheduled_time);
    const now = new Date();
    const fiveMinutesBefore = addMinutes(appointmentTime, -5);
    return !isPast(appointmentTime) && (now >= fiveMinutesBefore || isPast(appointmentTime));
  };

  const canShowJoinButtons = () => {
    if (!appointment) return false;
    const appointmentTime = new Date(appointment.scheduled_time);
    return !isPast(appointmentTime);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <Phone className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Appointment not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      {/* Top Section: Appointment Overview */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">Appointment #{appointment._id.slice(-6)}</CardTitle>
              <CardDescription className="text-base">
                {format(new Date(appointment.scheduled_time), 'EEEE, MMMM dd, yyyy')}
              </CardDescription>
            </div>
            <Badge className={cn('px-4 py-2 text-sm', getStatusColor(appointment.status))}>
              <span className="flex items-center gap-2">
                {getStatusIcon(appointment.status)}
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="font-semibold">{format(new Date(appointment.scheduled_time), 'HH:mm')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
              <p className="font-semibold">~30 mins</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
              <div className="flex items-center gap-2">
                {appointment.type === 'video' ? (
                  <Video className="h-4 w-4 text-primary" />
                ) : (
                  <Phone className="h-4 w-4 text-primary" />
                )}
                <p className="font-semibold capitalize">{appointment.type || 'audio'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">ID</p>
              <p className="font-semibold text-sm">{appointment._id.slice(0, 8)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {user?.role === 'patient' ? 'Doctor Information' : 'Doctor Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {doctorInfo ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {getInitials(doctorInfo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-lg font-semibold">Dr. {doctorInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{doctorInfo.email}</p>
                      {appointment.doctorProfile?.specialty && (
                        <p className="text-sm font-medium mt-1">{appointment.doctorProfile.specialty}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/patient/doctor-profile/${doctorInfo._id}`)}
                  >
                    View Doctor Profile
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Loading doctor information...</p>
              )}
            </CardContent>
          </Card>

          {/* Patient Info (if doctor) */}
          {user?.role === 'doctor' && patientInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                        {getInitials(patientInfo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-lg font-semibold">{patientInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{patientInfo.email}</p>
                      {appointment.notes && (
                        <p className="text-sm font-medium mt-1">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prescriptions Section */}
          {prescriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <Card key={prescription._id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">Prescription #{prescription._id.slice(-6)}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Medications:</p>
                            <div className="space-y-1">
                              {prescription.medications.map((med, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{med.name}</span> - {med.dosage}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {user?.role === 'patient' ? 'Doctor Notes' : 'Consultation Notes'}
                </CardTitle>
                {user?.role === 'doctor' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes && user?.role === 'doctor' ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add consultation notes..."
                    className="min-h-32"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Notes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingNotes(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={cn('text-sm', !notes && 'text-muted-foreground')}>
                  {notes || 'No notes yet'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Call Buttons */}
          {canShowJoinButtons() && appointment.status !== 'cancelled' && (
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Join Appointment</CardTitle>
                {!canJoinCall() && (
                  <CardDescription className="text-xs">
                    You can join 5 minutes before appointment
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {appointment.type === 'video' && (
                  <Button
                    className="w-full gap-2"
                    disabled={!canJoinCall()}
                    size="lg"
                  >
                    <Video className="h-5 w-5" />
                    Join Video Call
                  </Button>
                )}
                <Button
                  variant={appointment.type === 'video' ? 'outline' : 'default'}
                  className="w-full gap-2"
                  disabled={!canJoinCall()}
                  size="lg"
                >
                  <Phone className="h-5 w-5" />
                  Join Audio Call
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Appointment Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user?.role === 'patient' && appointment.status === 'booked' && (
                <>
                  <Button variant="outline" className="w-full" disabled>
                    Reschedule
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelAppointment}
                  >
                    Cancel Appointment
                  </Button>
                </>
              )}

              {user?.role === 'doctor' && appointment.status === 'in-progress' && (
                <Button className="w-full" onClick={handleMarkCompleted}>
                  Mark as Completed
                </Button>
              )}

              {appointment.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    const otherUserId = user?.role === 'patient' ? appointment.doctor_id : appointment.patient_id;
                    if (user?.role === 'doctor') {
                      navigate(`/doctor/messages?user1=${user?._id}&user2=${otherUserId}`);
                    } else {
                      navigate(`/patient/messages?user1=${user?._id}&user2=${otherUserId}`);
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Message {user?.role === 'patient' ? 'Doctor' : 'Patient'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Appointment Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                {appointment.status === 'completed' && (
                  <div className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Appointment Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appointment.scheduled_time), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
                {appointment.status === 'cancelled' && (
                  <div className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Appointment Cancelled</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;
