import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { DoctorProfile } from '@/types';
import { Search, Stethoscope, Calendar as CalendarIcon, Clock, Star, Award, CheckCircle2, User, DollarSign } from 'lucide-react';
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
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
      console.log('Fetched Doctors:', data);
      const verified = data.filter((doc: DoctorProfile) => doc.isVerified);
      setDoctors(verified);
      setFilteredDoctors(verified);

      // Fetch doctor names by their user IDs
      const names: Record<string, string> = {};
      await Promise.all(verified.map(async (doc: DoctorProfile) => {
        try {
          const userData = await api.getUser(doc.user_id, token);
          console.log(`Fetched user for doctor ${doc._id}:`, userData);
          names[doc._id] = userData.name;
        } catch (error) {
          console.error(`Failed to fetch user ${doc.user_id}:`, error);
          names[doc._id] = 'Unknown Doctor';
        }
      }));
      console.log('Doctor names mapping:', names);
      setDoctorNames(names);
    } catch (error) {
      console.error('Error fetching doctors:', error);
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
        doctorNames[doc._id]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startInMin = startHour * 60 + startMin;
    const endInMin = endHour * 60 + endMin;
    return (endInMin - startInMin) / 60; // duration in hours
  };

  const calculateCost = () => {
    const duration = calculateDuration();
    const hourlyRate = selectedDoctor?.pricePerHour || 0;
    return duration * hourlyRate;
  };

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !startTime || !endTime) {
      toast({
        title: 'Missing information',
        description: 'Please select a doctor, date, start time, and end time',
        variant: 'destructive',
      });
      return;
    }

    if (calculateDuration() <= 0) {
      toast({
        title: 'Invalid time range',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }

    setShowPaymentModal(true);
  };

  const handleProceedToPayment = async () => {
    setBooking(true);
    try {
      const scheduledTime = new Date(selectedDate!);
      const [hours, minutes] = startTime.split(':');
      scheduledTime.setHours(parseInt(hours), parseInt(minutes));

      const hours_duration = calculateDuration();

      // Create appointment with hours field
      const response = await api.createAppointment({
        patient_id: user?._id!,
        doctor_id: selectedDoctor!.user_id,
        scheduled_time: scheduledTime.toISOString(),
        hours: hours_duration,
      } as any);

      const { appointment, payment } = response;

      toast({
        title: 'Processing payment',
        description: 'Redirecting to Chapa...',
      });

      // Calculate cost for Chapa
      const totalAmount = hours_duration * (selectedDoctor!.pricePerHour || 0);

      // Get the return URL for after payment
      const returnUrl = `${window.location.origin}/patient/payment-status?appointment_id=${appointment._id}`;

      // Initialize payment directly with Chapa
      const paymentResponse = await api.initializePayment({
        appointment_id: appointment._id,
        amount: totalAmount,
        currency: 'ETB',
        return_url: returnUrl,
      }, token);

      if (paymentResponse.checkout_url) {
        // Redirect directly to Chapa checkout
        setShowPaymentModal(false);
        window.location.href = paymentResponse.checkout_url;
      } else {
        throw new Error('Failed to get Chapa checkout URL');
      }
    } catch (error) {
      console.error('Error creating appointment or initializing payment:', error);
      toast({
        title: 'Failed to process',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
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
                              <Link
                                to={`/patient/doctor-profile/${doctor.user_id}`}
                                className="hover:text-primary transition-colors hover:underline"
                              >
                                Dr. {doctorNames[doctor._id] || 'Loading...'}
                              </Link>
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
                  <h3 className="font-semibold text-lg">Dr. {doctorNames[selectedDoctor._id] || '...'}</h3>
                  <Badge variant="secondary" className="mt-1">{selectedDoctor.specialty}</Badge>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/patient/doctor-profile/${selectedDoctor.user_id}`)}
                variant="outline"
                className="w-full gap-2"
              >
                <User className="h-4 w-4" />
                View Full Profile
              </Button>
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
                Book Your Appointment
              </CardTitle>
              <CardDescription>Select your preferred date and time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
 
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Select Date
                </label>

                <input
                  type="date"
                  value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="w-full h-14 px-4 rounded-xl border-2 border-muted 
                          bg-gradient-to-br from-background to-muted/30 
                          hover:border-primary/40 transition-all shadow-sm"
                /> 
              </div>
 
              {selectedDate && (
                <div className="space-y-10">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* START TIME */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        Start Time
                      </label>

                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger className="h-14 rounded-xl border-2 border-muted bg-gradient-to-br 
                        from-background to-muted/30 hover:border-primary/40 transition shadow-sm">
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-64">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
 
                    </div>

                    {/* END TIME */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        End Time
                      </label>

                      <Select
                        value={endTime}
                        onValueChange={setEndTime}
                        disabled={!startTime}
                      >
                        <SelectTrigger className="h-14 rounded-xl border-2 border-muted bg-gradient-to-br 
                        from-background to-muted/30 hover:border-primary/40 disabled:opacity-50 transition shadow-sm">
                          <SelectValue placeholder={startTime ? "Select end time" : "Select start time first"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-64">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
 
                    </div>

                  </div>

                  {/* ================== SUMMARY ================== */}
                  {startTime && endTime && calculateDuration() > 0 && (
                    <div className="space-y-6">

                      <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-4">

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-semibold text-sm">
                              {format(selectedDate, "MMM dd")}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-semibold text-sm">
                              {calculateDuration()} hour{calculateDuration() !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-primary/10 pt-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Time Slot</span>
                            <span className="text-sm font-semibold">
                              {startTime} - {endTime}
                            </span>
                          </div>

                          {selectedDoctor?.pricePerHour && (
                            <div className="flex justify-between border-t border-primary/10 pt-3">
                              <span className="text-sm text-muted-foreground">Rate</span>
                              <span className="text-sm font-semibold">
                                ${selectedDoctor.pricePerHour}/hr
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between border-t-2 border-primary/30 pt-4">
                          <span className="font-semibold">Total Cost</span>
                          <span className="text-2xl font-bold text-primary">
                            ${calculateCost().toFixed(2)}
                          </span>
                        </div>

                      </div>

                      <Button className="h-12 w-full text-base gap-2" onClick={handleBookAppointment}>
                        <CheckCircle2 className="h-5 w-5" />
                        Proceed to Book Appointment
                      </Button>

                    </div>
                  )}

                </div>
              )}
            </CardContent>

          </Card>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Appointment Summary
            </DialogTitle>
            <DialogDescription>
              Please review your appointment details before proceeding to payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Doctor</span>
                <span className="font-medium">Dr. {selectedDoctor && doctorNames[selectedDoctor._id]}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Specialty</span>
                <Badge variant="secondary">{selectedDoctor?.specialty}</Badge>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="font-medium">{selectedDate && format(selectedDate, 'PPP')}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="font-medium">{startTime} - {endTime}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-medium">{calculateDuration()} hour{calculateDuration() !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Rate</span>
                <span className="font-medium">${selectedDoctor?.pricePerHour}/hour</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-semibold">Total Cost</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">${calculateCost().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              disabled={booking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToPayment}
              disabled={booking}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              {booking ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookAppointment;