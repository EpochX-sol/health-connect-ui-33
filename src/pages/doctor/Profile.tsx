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
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both password fields match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      await api.updateUser(user!._id, {
        password: passwordData.newPassword,
        currentPassword: passwordData.currentPassword,
      }, token);

      toast({
        title: 'Password changed successfully',
        description: 'Your password has been updated.',
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Failed to change password',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteUser(user!._id, token);
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: 'Failed to delete account',
        variant: 'destructive',
      });
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

      {/* Security Settings */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-shield-100 rounded-lg">
              <Shield className="h-5 w-5 text-shield-600" />
            </div>
            <div>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  className="h-11 mt-2"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  disabled={changingPassword}
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  className="h-11 mt-2"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  disabled={changingPassword}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  className="h-11 mt-2"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  disabled={changingPassword}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={changingPassword} className="gap-2">
                <Shield className="w-4 h-4" />
                {changingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button 
            variant="destructive" 
            className="gap-2"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorProfilePage;
