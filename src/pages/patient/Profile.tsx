import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { User, Mail, Phone, MapPin, Calendar, Shield, Save, Edit2, Activity } from 'lucide-react';
import { format } from 'date-fns';

const PatientProfile = () => {
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?._id && token) {
      fetchPrescriptions();
    }
  }, [user?._id, token]);

  const fetchPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      const data = await api.getAllPrescriptions(token, user!._id);
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updatedUser = await api.updateUser(user!._id, formData);
      updateUser(updatedUser);
      setIsEditing(false);
      toast({
        title: 'Profile updated successfully',
        description: 'Your information has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
      // Call API to change password
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
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteUser(user!._id, token);
      toast({ title: 'Account deleted', description: 'Your account has been permanently deleted.' });
      window.location.href = '/login';
    } catch (error) {
      toast({ title: 'Failed to delete account', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Profile Header */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 via-card to-secondary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarFallback className="text-3xl font-bold bg-gradient-primary text-primary-foreground">
                {getInitials(user?.name || 'U')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{user?.name}</h1>
                <Badge variant="secondary" className="w-fit mx-auto md:mx-0">
                  <Activity className="w-3 h-3 mr-1" />
                  Patient
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 justify-center md:justify-start">
                <Calendar className="w-4 h-4" />
                Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'N/A'}
              </p>
            </div>

            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className="gap-2"
            >
              {isEditing ? (
                <>Cancel</>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="personal" className="gap-2 py-3">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Personal Info</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="medical" className="gap-2 py-3">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Medical History</span>
            <span className="sm:hidden">Medical</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 py-3">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Manage your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing || loading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing || loading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Not set"
                      disabled
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="Not set"
                      disabled
                      className="h-11"
                    />
                  </div>
                </div>

                {isEditing && (
                  <>
                    <Separator />
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading} className="gap-2">
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>
                Your prescriptions and medical records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPrescriptions ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((prescription: any) => (
                    <div key={prescription._id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">Prescription ID: {prescription._id.slice(-8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(prescription.createdAt), 'MMMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Medications:</h4>
                        {prescription.medications && Array.isArray(prescription.medications) ? (
                          <ul className="space-y-2">
                            {prescription.medications.map((med: any, idx: number) => (
                              <li key={idx} className="text-sm text-muted-foreground pl-4 border-l-2 border-primary/30">
                                <span className="font-medium text-foreground">{med.name}</span>
                                {med.dosage && <span> - {med.dosage}</span>}
                                {med.instructions && <span className="text-xs block mt-1">Instructions: {med.instructions}</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No medications specified</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Activity className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No prescriptions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your prescriptions will appear here after consultations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-4">
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

                <Separator className="my-6" />

                <div className="flex justify-end">
                  <Button type="submit" disabled={changingPassword} className="gap-2">
                    <Save className="w-4 h-4" />
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
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
        </TabsContent>
      </Tabs>
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>Are you sure you want to delete your account? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="w-full" onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button className="w-full" onClick={confirmDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientProfile;
