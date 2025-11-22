import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DoctorProfile } from '@/types';
import { Search, Stethoscope, Calendar as CalendarIcon, Clock, Star, Award, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
];

const specialties = [
  'All Specialties',
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Psychiatry',
  'Orthopedics'
];

const BookAppointment = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDoctorUser, setSelectedDoctorUser] = useState<{ name: string } | null>(null);
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, selectedSpecialty]);

  const fetchDoctors = async () => {
    try {
      const data = await api.getAllDoctors();
      const verified = data.filter((doc: DoctorProfile) => doc.isVerified);
      setDoctors(verified);
      setFilteredDoctors(verified);

      // Fetch doctor names by their user IDs
      const names: Record<string, string> = {};
      await Promise.all(verified.map(async (doc: DoctorProfile) => {
        try {
          const userData = await api.getUser(doc.user_id);
          names[doc.user_id] = userData.name;
        } catch {
          names[doc.user_id] = 'Unknown Doctor';
        }
      }));
      setDoctorNames(names);
    } catch (error) {
      toast({
        title: 'Failed to load doctors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDoctorUser = async () => {
      if (selectedDoctor) {
        try {
          const userData = await api.getUser(selectedDoctor.user_id);
          setSelectedDoctorUser(userData);
        } catch {
          setSelectedDoctorUser(null);
        }
      } else {
        setSelectedDoctorUser(null);
      }
    };
    fetchDoctorUser();
  }, [selectedDoctor]);

  const filterDoctors = () => {
    let filtered = doctors;

    if (selectedSpecialty !== 'All Specialties') {
      filtered = filtered.filter((doc) => doc.specialty === selectedSpecialty);
    }

    if (searchQuery) {
      filtered = filtered.filter((doc) =>
        doc.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: 'Missing information',
        description: 'Please select a doctor, date, and time',
        variant: 'destructive',
      });
      return;
    }

    setBooking(true);
    try {
      const scheduledTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      scheduledTime.setHours(parseInt(hours), parseInt(minutes));

      const appointment = await api.createAppointment({
        patient_id: user?._id!,
        doctor_id: selectedDoctor.user_id,
        scheduled_time: scheduledTime.toISOString(),
      });

      toast({
        title: 'Appointment booked!',
        description: 'Your appointment has been scheduled successfully.',
      });
      
      navigate('/patient/appointments');
    } catch (error) {
      toast({
        title: 'Failed to book appointment',
        variant: 'destructive',
      });
    } finally {
      setBooking(false);
    }
  };
console.log('Selected Doctor:', selectedDoctor);
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Book an Appointment</h1>
        <p className="text-muted-foreground">Find and schedule a consultation with our verified doctors</p>
      </div>

      {!selectedDoctor ? (
        <div className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by doctor name or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="w-full md:w-[200px] h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Doctors List */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
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
          ) : filteredDoctors.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredDoctors.map((doctor) => (
                <Card
                  key={doctor._id}
                  className="hover:shadow-lg transition-all hover:border-primary/50 group cursor-pointer"
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-secondary flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                        <Stethoscope className="h-8 w-8 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-lg text-foreground">
                              Dr. {doctorNames[doctor.user_id] || doctor.user?.name || 'Unknown Doctor'}
                            </h3>
                            <Badge variant="secondary" className="mt-1">
                              {doctor.specialty}
                            </Badge>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {doctor.bio}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Award className="h-4 w-4" />
                            <span>License: {doctor.medicalLicenseNumber}</span>
                          </div>
                          {doctor.pricePerHour && (
                            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                              <span>${doctor.pricePerHour}</span>
                              <span className="text-xs text-muted-foreground font-normal">/hr</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Select Doctor
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No doctors found matching your criteria</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Doctor Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Selected Doctor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="h-16 w-16 rounded-full bg-gradient-secondary flex items-center justify-center shadow-md flex-shrink-0">
                  <Stethoscope className="h-8 w-8 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dr. {selectedDoctorUser?.name || selectedDoctor.user?.name || '...'}</h3>
                  <Badge variant="secondary" className="mt-1">{selectedDoctor.specialty}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{selectedDoctor.bio}</p>
              {selectedDoctor.pricePerHour && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Consultation Fee</p>
                  <p className="text-2xl font-bold text-primary">${selectedDoctor.pricePerHour}<span className="text-sm font-normal text-muted-foreground">/hour</span></p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedDoctor(null)}
              >
                Change Doctor
              </Button>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Select Date & Time
              </CardTitle>
              <CardDescription>Choose your preferred appointment slot</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="date" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="date" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Date
                  </TabsTrigger>
                  <TabsTrigger value="time" className="gap-2" disabled={!selectedDate}>
                    <Clock className="h-4 w-4" />
                    Time
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="date" className="space-y-4">
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>
                  {selectedDate && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Selected date:</p>
                      <p className="font-semibold text-lg">{format(selectedDate, 'PPP')}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="time" className="space-y-4">
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        className="h-12"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                  {selectedTime && (
                    <div className="text-center pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-4">
                        Appointment: {format(selectedDate!, 'PPP')} at {selectedTime}
                      </p>
                      <Button
                        size="lg"
                        onClick={handleBookAppointment}
                        disabled={booking}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        {booking ? 'Booking...' : 'Confirm Appointment'}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
