import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Calendar, User, Pill, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Prescription, Appointment, Medication } from '@/types';

const DoctorPrescriptions = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    appointment_id: '',
    patient_id: '',
    medications: [{ name: '', dosage: '', instructions: '' }] as Medication[]
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    if (!token || !user) return;

    try {
      const [prescData, aptData] = await Promise.all([
        api.getAllPrescriptions(token),
        api.getAppointments(token)
      ]);
      
      setPrescriptions(prescData);
      setAppointments(aptData.filter((a: Appointment) => a.status === 'completed'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', instructions: '' }]
    });
  };

  const handleRemoveMedication = (index: number) => {
    const newMeds = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications: newMeds });
  };

  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    const newMeds = [...formData.medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setFormData({ ...formData, medications: newMeds });
  };

  const handleAppointmentChange = (aptId: string) => {
    const apt = appointments.find(a => a._id === aptId);
    if (apt) {
      setFormData({
        ...formData,
        appointment_id: aptId,
        patient_id: apt.patient_id
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    // Validate medications
    const validMeds = formData.medications.filter(
      m => m.name && m.dosage && m.instructions
    );

    if (validMeds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one complete medication',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      await api.createPrescription(
        {
          ...formData,
          doctor_id: user._id,
          medications: validMeds
        },
        token
      );
      
      toast({
        title: 'Prescription Created',
        description: 'The prescription has been created successfully.',
      });
      
      setDialogOpen(false);
      setFormData({
        appointment_id: '',
        patient_id: '',
        medications: [{ name: '', dosage: '', instructions: '' }]
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create prescription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage patient prescriptions
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-medical hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Fill in the prescription details for your patient
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appointment">Select Appointment *</Label>
                <Select 
                  value={formData.appointment_id} 
                  onValueChange={handleAppointmentChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a completed appointment" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map((apt) => (
                      <SelectItem key={apt._id} value={apt._id}>
                        {apt.patient?.name} - {format(new Date(apt.scheduled_time), 'MMM dd, yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Medications *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMedication}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Medication
                  </Button>
                </div>

                {formData.medications.map((med, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Medication {index + 1}</h4>
                        {formData.medications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMedication(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Medication Name *</Label>
                        <Input
                          value={med.name}
                          onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                          placeholder="e.g., Aspirin"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Dosage *</Label>
                        <Input
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          placeholder="e.g., 100mg"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Instructions *</Label>
                        <Textarea
                          value={med.instructions}
                          onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                          placeholder="e.g., Take once daily with food"
                          rows={3}
                          required
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={creating}
                  className="bg-gradient-medical hover:opacity-90"
                >
                  {creating ? 'Creating...' : 'Create Prescription'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <Card className="shadow-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No prescriptions yet</p>
            <p className="text-sm text-muted-foreground">
              Create prescriptions for your completed appointments
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription._id} className="shadow-elegant">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-medical-100 rounded-lg">
                      <FileText className="h-5 w-5 text-medical-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Prescription for {prescription.patient?.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-medical-600" />
                    Medications
                  </h4>
                  <div className="space-y-3">
                    {prescription.medications.map((med, index) => (
                      <div key={index} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{med.name}</p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Dosage:</strong> {med.dosage}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Instructions:</strong> {med.instructions}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptions;
