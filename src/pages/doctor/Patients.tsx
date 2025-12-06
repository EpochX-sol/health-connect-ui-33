import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, User, Calendar, FileText, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Appointment, User as UserType } from '@/types';

interface PatientData {
  patientId: string;
  patient: UserType;
  totalAppointments: number;
  completedAppointments: number;
  lastAppointment?: string;
}

const DoctorPatients = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [token, user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPatients(
        patients.filter(
          (p) =>
            p.patient.name.toLowerCase().includes(query) ||
            p.patient.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    if (!token || !user) return;

    try {
      // Fetch doctor's appointments
      let appointmentsData = [];
      try {
        appointmentsData = await api.getAppointmentsForDoctor(user._id, token);
      } catch (error) {
        console.error('getAppointmentsForDoctor failed, trying getAllAppointments:', error);
        // Fallback to getting all appointments and filtering by doctor_id
        const allAppointments = await api.getAppointments(token);
        appointmentsData = allAppointments.filter((apt: Appointment) => apt.doctor_id === user._id);
      }

      console.log('Doctor appointments:', appointmentsData);

      // Group appointments by patient and fetch patient details
      const patientMap = new Map<string, PatientData>();
      
      // Get unique patient IDs
      const patientIds = [...new Set(appointmentsData.map((apt: Appointment) => apt.patient_id))];
      
      // Fetch all patient data
      const patientDataMap: Record<string, UserType> = {};
      await Promise.all(patientIds.map(async (patientId: string) => {
        try {
          const userData = await api.getUser(patientId, token);
          patientDataMap[patientId] = userData;
        } catch (error) {
          console.error(`Failed to fetch patient ${patientId}:`, error);
          // Create a placeholder user object
          patientDataMap[patientId] = {
            _id: patientId,
            name: 'Unknown Patient',
            email: 'unknown@example.com',
            role: 'patient',
            createdAt: new Date().toISOString()
          };
        }
      }));

      console.log('Patient data map:', patientDataMap);

      // Now group appointments by patient
      appointmentsData.forEach((apt: Appointment) => {
        const patientId = apt.patient_id;
        const patientInfo = patientDataMap[patientId];
        
        if (!patientInfo) return;
        
        const existing = patientMap.get(patientId);
        
        if (existing) {
          existing.totalAppointments++;
          if (apt.status === 'completed') existing.completedAppointments++;
          
          const aptDate = new Date(apt.scheduled_time);
          const lastDate = existing.lastAppointment ? new Date(existing.lastAppointment) : null;
          if (!lastDate || aptDate > lastDate) {
            existing.lastAppointment = apt.scheduled_time;
          }
        } else {
          patientMap.set(patientId, {
            patientId,
            patient: patientInfo,
            totalAppointments: 1,
            completedAppointments: apt.status === 'completed' ? 1 : 0,
            lastAppointment: apt.scheduled_time
          });
        }
      });
      
      const patientsArray = Array.from(patientMap.values());
      console.log('Processed patients:', patientsArray);
      setPatients(patientsArray);
      setFilteredPatients(patientsArray);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Patients</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your patient records
        </p>
      </div>

      {/* Search */}
      <Card className="shadow-elegant">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search patients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-medical-100 rounded-lg">
                <User className="h-6 w-6 text-medical-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold text-foreground">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-100 rounded-lg">
                <Calendar className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold text-foreground">
                  {patients.reduce((sum, p) => sum + p.totalAppointments, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success-100 rounded-lg">
                <FileText className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {patients.reduce((sum, p) => sum + p.completedAppointments, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <Card className="shadow-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Patients will appear here after appointments'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patientData) => (
            <Card key={patientData.patientId} className="shadow-elegant hover:shadow-glow transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-medical-100 rounded-lg">
                      <User className="h-8 w-8 text-medical-600" />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">
                          {patientData.patient.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {patientData.patient.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {patientData.totalAppointments} appointment{patientData.totalAppointments !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {patientData.lastAppointment && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Last visit: {format(new Date(patientData.lastAppointment), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-success-100 text-success-700">
                          {patientData.completedAppointments} Completed
                        </Badge>
                        <Badge variant="outline" className="border-medical-200 text-medical-700">
                          {patientData.patient.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {user?._id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => navigate(`/doctor/messages?user1=${user._id}&user2=${patientData.patientId}`)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => navigate('/doctor/prescriptions')}
                    >
                      <FileText className="h-4 w-4" />
                      Records
                    </Button>
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

export default DoctorPatients;
