import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, User, Stethoscope, FileText, Shield } from 'lucide-react';
import type { DoctorProfile } from '@/types';

const DoctorProfilePage = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  
  const [formData, setFormData] = useState({
    specialty: '',
    bio: '',
    medicalLicenseNumber: '',
    availability: [] as string[]
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || !user) return;
      
      try {
        const data = await api.getDoctorProfile(user._id, token);
        setProfile(data);
        setFormData({
          specialty: data.specialty || '',
          bio: data.bio || '',
          medicalLicenseNumber: data.medicalLicenseNumber || '',
          availability: data.availability || []
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !profile) return;

    setSaving(true);
    try {
      await api.updateDoctorProfile(profile._id, formData, token);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getVerificationBadge = () => {
    if (!profile) return null;

    if (profile.isVerified) {
      return (
        <Badge className="bg-success-100 text-success-700 hover:bg-success-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }

    if (profile.verificationStatus === 'rejected') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }

    return (
      <Badge className="bg-warning-100 text-warning-700 hover:bg-warning-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending Verification
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Doctor Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your professional information and credentials
        </p>
      </div>

      {/* Verification Status */}
      <Card className="shadow-elegant">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-medical-100 rounded-lg">
                <Shield className="h-6 w-6 text-medical-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verification Status</h3>
                <p className="text-sm text-muted-foreground">
                  {profile?.isVerified 
                    ? 'Your account is verified and active' 
                    : 'Your account is awaiting admin verification'}
                </p>
              </div>
            </div>
            {getVerificationBadge()}
          </div>
          {profile?.verificationNotes && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Admin Notes:</strong> {profile.verificationNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-medical-100 rounded-lg">
              <User className="h-5 w-5 text-medical-600" />
            </div>
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="font-medium text-foreground mt-1">{user?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email Address</Label>
              <p className="font-medium text-foreground mt-1">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-medical-100 rounded-lg">
              <Stethoscope className="h-5 w-5 text-medical-600" />
            </div>
            <div>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Your medical credentials and expertise</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="specialty">Medical Specialty *</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="e.g., Cardiology, Pediatrics, General Practice"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">Medical License Number *</Label>
              <Input
                id="license"
                value={formData.medicalLicenseNumber}
                onChange={(e) => setFormData({ ...formData, medicalLicenseNumber: e.target.value })}
                placeholder="Enter your medical license number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell patients about your experience, specializations, and approach to care..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This will be visible to patients when they book appointments
              </p>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-gradient-medical hover:opacity-90"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-medical-100 rounded-lg">
              <FileText className="h-5 w-5 text-medical-600" />
            </div>
            <div>
              <CardTitle>Verification Documents</CardTitle>
              <CardDescription>Documents submitted during registration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile?.documents ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">ID Card</p>
                  <p className="text-sm text-muted-foreground">Government-issued identification</p>
                </div>
                <Badge variant="outline">Submitted</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Medical Certificate</p>
                  <p className="text-sm text-muted-foreground">Professional certification</p>
                </div>
                <Badge variant="outline">Submitted</Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No documents found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorProfilePage;
