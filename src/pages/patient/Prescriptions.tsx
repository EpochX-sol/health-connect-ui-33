import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Prescription } from '@/types';
import { FileText, Download, Printer, Search, Pill, Calendar, User, Stethoscope, ClipboardList, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { PrescriptionPDF, printPrescription, downloadPrescriptionPDF } from '@/components/PrescriptionPDF';

const PatientPrescriptions = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPrescriptions();
  }, [token, user]); 

  const fetchPrescriptions = async () => {
    if (!token || !user) return;

    try {
      const data = await api.getAllPrescriptions(token, user._id);
      setPrescriptions(data);

      // Fetch doctor names for all prescriptions
      const doctorIds = [...new Set(data.map((rx: Prescription) => rx.doctor_id))];
      if (doctorIds.length > 0) {
        const doctorPromises = doctorIds.map(doctorId => 
          api.getUser(String(doctorId), token)
        );
        const doctorResults = await Promise.all(doctorPromises);
        const names: Record<string, string> = {};
        doctorResults.forEach((doc) => {
          names[doc._id] = doc.name;
        });
        setDoctorNames(names);
      }
    } catch (error) {
      toast({
        title: 'Failed to load prescriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) =>
    rx.medications.some((med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    rx.doctor?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (prescription: Prescription) => {
    const doctorName = doctorNames[prescription.doctor_id] || 'Unknown';
    downloadPrescriptionPDF(prescription, doctorName, user?.name || 'Patient');
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Prescriptions</h1>
        <p className="text-muted-foreground">View and manage your medical prescriptions</p>
      </div>

      {!selectedPrescription ? (
        <div className="space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions by medication or doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions List */}
          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPrescriptions.length > 0 ? (
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
                                  <Stethoscope className="h-3 w-3" />
                                  <Link 
                                    to={`/patient/doctor-profile/${prescription.doctor_id}`}
                                    className="hover:text-primary transition-colors hover:underline"
                                  >
                                    Dr. {doctorNames[prescription.doctor_id] || 'Unknown Doctor'}
                                  </Link>
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
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No prescriptions found</p>
                  <p className="text-sm text-muted-foreground">
                    Your prescriptions will appear here after consultations
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
                      <Stethoscope className="h-4 w-4" />
                      Dr. {doctorNames[selectedPrescription.doctor_id] || 'Unknown'}
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
                  doctorName={doctorNames[selectedPrescription.doctor_id] || 'Doctor'}
                  patientName={user?.name || 'Patient'}
                />
              </div>

              {/* Additional Details Section */}
              <div className="mt-8 space-y-6">
                <Separator />
                
                {/* Doctor Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Prescribing Physician Details
                  </h3>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-gradient-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Dr. {doctorNames[selectedPrescription.doctor_id] || selectedPrescription.doctor?.name || 'Unknown Doctor'}</p>
                      <p className="text-sm text-muted-foreground">{selectedPrescription.doctor?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <Card className="bg-warning/10 border-warning/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-foreground">
                      <strong>Important:</strong> Please follow the prescribed dosage and instructions carefully. 
                      If you experience any adverse effects, contact your doctor immediately.
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

export default PatientPrescriptions;
