import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  Award,
  Mail
} from 'lucide-react';
import type { DoctorProfile, User as UserType } from '@/types';

const DoctorProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [doctorUser, setDoctorUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && token) {
      fetchDoctorProfile();
    }
  }, [id, token]);

  const fetchDoctorProfile = async () => {
    if (!id || !token) return;

    try {
      setLoading(true);
      
      // First, try to get doctor profile by ID (which might be user_id or doctor_id)
      try {
        const profile = await api.getDoctorProfile(id, token);
        setDoctorProfile(profile);
        
        // Get doctor user info
        if (profile.user_id) {
          const userId = typeof profile.user_id === 'string' ? profile.user_id : (profile.user_id as any)._id;
          const userInfo = await api.getUser(userId, token);
          setDoctorUser(userInfo);
        }
      } catch (error) {
        // If that fails, try to get the user directly and then find their doctor profile
        const userInfo = await api.getUser(id, token);
        setDoctorUser(userInfo);
        
        // Try to find doctor profile by user_id
        try {
          const allDoctors = await api.getAllDoctors(token);
          const profile = allDoctors.find((doc: DoctorProfile) => {
            const userId = typeof doc.user_id === 'string' ? doc.user_id : (doc.user_id as any)._id;
            return userId === id;
          });
          
          if (profile) {
            setDoctorProfile(profile);
          }
        } catch {
          // Doctor profile not found
        }
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast({
        title: 'Failed to load doctor profile',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    if (!id) return;
    navigate(`/patient/book-appointment?doctorId=${id}`);
  };

  const handleMessage = () => {
    // Navigate to messages with this doctor
    navigate(`/patient/messages?doctorId=${id}`);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
          <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!doctorUser) {
    return (
      <div className="space-y-6 animate-fade-in"> 
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Doctor profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getVerificationColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header Section */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                {getInitials(doctorUser.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dr. {doctorUser.name}</h1>
                  {doctorProfile && (
                    <p className="text-base text-muted-foreground mt-1">{doctorProfile.specialty}</p>
                  )}
                </div>
                {doctorProfile && (
                  <Badge className={`h-fit ${getVerificationColor(doctorProfile.verificationStatus)}`}>
                    {doctorProfile.isVerified ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {doctorProfile.verificationStatus || 'Not Verified'}
                      </div>
                    )}
                  </Badge>
                )}
              </div>

              {doctorProfile?.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{doctorProfile.bio}</p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleBookAppointment} className="gap-2">
              <Calendar className="h-4 w-4" />
              Book Appointment
            </Button>
            <Button onClick={handleMessage} variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground text-sm">{doctorUser.email}</p>
              </div>
            </div>
            {doctorProfile?.specialty && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Specialty</p>
                    <p className="font-medium text-foreground text-sm">{doctorProfile.specialty}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {doctorProfile?.medicalLicenseNumber && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">License Number</p>
                <p className="font-medium text-foreground">{doctorProfile.medicalLicenseNumber}</p>
              </div>
            )}
            {doctorProfile?.medicalLicenseNumber && (
              <Separator />
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Verification Status</p>
              <div className="flex items-center gap-2">
                {doctorProfile?.isVerified ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600 text-sm">Verified Professional</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-600 text-sm">
                      {doctorProfile?.verificationStatus || 'Pending'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {doctorProfile?.bio && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{doctorProfile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Availability */}
        {doctorProfile?.availability && doctorProfile.availability.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.isArray(doctorProfile.availability) ? (
                  doctorProfile.availability.map((time: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      {time}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Check availability when booking</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Notes (if any and status is not approved) */}
        {doctorProfile?.verificationNotes && doctorProfile.verificationStatus !== 'approved' && (
          <Card className="border-yellow-200 bg-yellow-50/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Verification Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-800">{doctorProfile.verificationNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No Doctor Profile Info */}
      {!doctorProfile && (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center text-sm">
              This doctor's detailed profile is not yet available, but you can still book an appointment or send a message.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorProfilePage;
