import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Calendar, User, Pill, X, Search, ArrowLeft, Stethoscope, ClipboardList, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import type { Prescription, Appointment, Medication } from '@/types';
import { PrescriptionPDF, printPrescription, downloadPrescriptionPDF } from '@/components/PrescriptionPDF';

const DoctorPrescriptions = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    appointment_id: '',
    patient_id: '',
    medications: [{ name: '', dosage: '', instructions: '' }] as Medication[]
  });

  useEffect(() => {
    fetchData();
  }, [token, user]);

  const fetchData = async () => {
    if (!token || !user) return;

    try {
      // Fetch prescriptions created by this doctor
      let prescData = [];
      try {
        prescData = await api.getAllPrescriptions(token);
        // Filter to only prescriptions created by this doctor
        prescData = prescData.filter((p: Prescription) => p.doctor_id === user._id);
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error);
      }

      // Fetch doctor's appointments
      let aptData = [];
      try {
        aptData = await api.getAppointmentsForDoctor(user._id, token);
      } catch (error) {
        console.error('getAppointmentsForDoctor failed, trying getAllAppointments:', error);
        const allApts = await api.getAppointments(token);
        aptData = allApts.filter((a: Appointment) => a.doctor_id === user._id);
      }

      setPrescriptions(prescData);
      setAppointments(aptData.filter((a: Appointment) => a.status === 'completed'));

      // Fetch patient names for all prescriptions
      const patientIds = [...new Set(prescData.map((p: Prescription) => p.patient_id))];
      if (patientIds.length > 0) {
        const names: Record<string, string> = {};
        await Promise.all(patientIds.map(async (patientId: string) => {
          try {
            const patientData = await api.getUser(patientId, token);
            names[patientId] = patientData.name;
          } catch (error) {
            console.error(`Failed to fetch patient ${patientId}:`, error);
            names[patientId] = 'Unknown Patient';
          }
        }));
        setPatientNames(names);
      }
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

  const handleDownload = (prescription: Prescription) => {
    downloadPrescriptionPDF();
    toast({
      title: 'Download started',
      description: `Prescription PDF is being generated and downloaded...`,
    });
  };

  const handlePrint = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setTimeout(() => {
      printPrescription();
    }, 300);
  };

  const filteredPrescriptions = prescriptions.filter((rx) =>
    rx.medications.some((med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    patientNames[rx.patient_id]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {!selectedPrescription ? (
        <>
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
                            {patientNames[apt.patient_id] || 'Unknown Patient'} - {format(new Date(apt.scheduled_time), 'MMM dd, yyyy')}
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

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions by patient or medication..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions List */}
          {filteredPrescriptions.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">
                  {searchQuery ? 'No prescriptions found' : 'No prescriptions yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search' : 'Create prescriptions for your completed appointments'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredPrescriptions.map((prescription) => (
                <Card
                  key={prescription._id}
                  className="hover:shadow-lg transition-all hover:border-primary/50 group"
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex gap-4 flex-1">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <FileText className="h-8 w-8 text-accent" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground mb-1">
                                Prescription #{prescription._id.slice(-6)}
                              </h3>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {patientNames[prescription.patient_id] || 'Unknown Patient'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Separator className="my-3" />
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                              <Pill className="h-4 w-4 text-primary" />
                              Medications ({prescription.medications.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {prescription.medications.slice(0, 3).map((med, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {med.name}
                                </Badge>
                              ))}
                              {prescription.medications.length > 3 && (
                                <Badge variant="outline">
                                  +{prescription.medications.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col gap-2 md:justify-center">
                        <Button
                          onClick={() => setSelectedPrescription(prescription)}
                          className="flex-1 md:flex-none gap-2"
                        >
                          <ClipboardList className="h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDownload(prescription)}
                          className="flex-1 md:flex-none gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <Button
            variant="outline"
            onClick={() => setSelectedPrescription(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Prescriptions
          </Button>

          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    Medical Prescription Document
                  </CardTitle>
                  <CardDescription className="flex flex-wrap gap-3 text-base">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedPrescription.createdAt), 'MMMM dd, yyyy')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Patient: {patientNames[selectedPrescription.patient_id] || 'Unknown Patient'}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePrint(selectedPrescription)} 
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button 
                    onClick={() => handleDownload(selectedPrescription)} 
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Render the prescription PDF component */}
              <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                <PrescriptionPDF 
                  prescription={selectedPrescription}
                  doctorName={user?.name || 'Doctor'}
                  patientName={patientNames[selectedPrescription.patient_id] || 'Patient'}
                />
              </div>

              {/* Additional Details Section */}
              <div className="mt-8 space-y-6">
                <Separator />
                
                {/* Patient Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Patient Details
                  </h3>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-gradient-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{patientNames[selectedPrescription.patient_id] || 'Unknown Patient'}</p>
                      <p className="text-sm text-muted-foreground">Patient ID: {selectedPrescription.patient_id.slice(-6)}</p>
                    </div>
                  </div>
                </div>

                {/* Medications Summary */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Medications ({selectedPrescription.medications.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedPrescription.medications.map((med, index) => (
                      <div key={index} className="p-4 bg-muted rounded-lg">
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Dosage:</strong> {med.dosage}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Instructions:</strong> {med.instructions}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Notice */}
                <Card className="bg-warning/10 border-warning/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-foreground">
                      <strong>Important:</strong> This prescription should be followed exactly as prescribed. 
                      Ensure the patient understands all instructions and contraindications.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptions;
