import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Wallet, Building2, Phone } from 'lucide-react';
import type { Appointment, DoctorProfile } from '@/types';

const ETHIOPIAN_BANKS = [
  { value: 'cbe', label: 'Commercial Bank of Ethiopia' },
  { value: 'awash', label: 'Awash International Bank' },
  { value: 'dashen', label: 'Dashen Bank' },
  { value: 'abyssinia', label: 'Bank of Abyssinia' },
  { value: 'coop', label: 'Cooperative Bank of Oromia' },
  { value: 'telebirr', label: 'Telebirr' },
];

const DoctorPayment = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [hourlyRate, setHourlyRate] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) return;
      try {
        const [appointmentsData, profileData] = await Promise.all([
          api.getAppointments(token),
          api.getDoctorProfile(user._id, token)
        ]);
        
        setAppointments(appointmentsData);
        setDoctorProfile(profileData);
        setHourlyRate(profileData.pricePerHour?.toString() || '');
        
        // Pre-fill existing bank details if available
        if (profileData.paymentDetails) {
          setSelectedBank(profileData.paymentDetails.bank || '');
          setAccountNumber(profileData.paymentDetails.accountNumber || '');
          setAccountHolderName(profileData.paymentDetails.accountHolderName || '');
          setPhoneNumber(profileData.paymentDetails.phoneNumber || '');
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user, toast]);

  const availableBalance = doctorProfile?.availableBalance || 0;
  const completedAppointmentsCount = appointments.filter(apt => apt.status === 'completed').length;

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hourlyRate || !token || !user) return;
    
    try {
      await api.updateDoctorProfile(user._id, {
        pricePerHour: parseFloat(hourlyRate),
      }, token);
      
      toast({
        title: 'Rate Updated',
        description: `Your hourly rate has been updated to ${hourlyRate} ETB`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update rate',
        variant: 'destructive',
      });
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount);
    
    if (amount > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'Withdrawal amount exceeds available balance',
        variant: 'destructive',
      });
      return;
    }

    try {
      // API call to request withdrawal would go here
      toast({
        title: 'Withdrawal Requested',
        description: `Your withdrawal request for ${withdrawalAmount} ETB has been submitted`,
      });
      setWithdrawalAmount('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process withdrawal request',
        variant: 'destructive',
      });
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBank || !accountHolderName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (selectedBank === 'telebirr' && !phoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your Telebirr phone number',
        variant: 'destructive',
      });
      return;
    }

    if (selectedBank !== 'telebirr' && !accountNumber) {
      toast({
        title: 'Account Number Required',
        description: 'Please enter your bank account number',
        variant: 'destructive',
      });
      return;
    }

    if (!token || !user) return;

    try {
      const paymentDetails = {
        bank: selectedBank,
        accountNumber: selectedBank === 'telebirr' ? undefined : accountNumber,
        accountHolderName,
        phoneNumber: selectedBank === 'telebirr' ? phoneNumber : undefined,
      };

      await api.updateDoctorProfile(user._id, { paymentDetails }, token);
      
      toast({
        title: 'Bank Details Saved',
        description: 'Your payment information has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save bank details',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your earnings, rates, and payment information
        </p>
      </div>

      {/* Available Balance Card */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-900 mb-2">Available Balance</p>
              <p className="text-5xl font-bold text-emerald-600">{availableBalance.toFixed(2)} ETB</p>
              <p className="text-sm text-emerald-700 mt-2">
                From {completedAppointmentsCount} completed appointments
              </p>
            </div>
            <div className="p-4 bg-white/60 rounded-lg">
              <Wallet className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Update Hourly Rate */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Hourly Rate</CardTitle>
                <CardDescription>Update your consultation rate (ETB)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateRate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Rate per Hour (ETB)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter hourly rate"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">This is the amount patients will pay per hour for consultation</p>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Update Rate
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal Request */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Request Withdrawal</CardTitle>
                <CardDescription>Withdraw your earnings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdrawalRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawalAmount">Amount (ETB)</Label>
                <Input
                  id="withdrawalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available balance: {availableBalance.toFixed(2)} ETB
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={availableBalance === 0}
              >
                Request Withdrawal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account Details */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Manage your bank account details for withdrawals</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBankDetails} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Select Bank</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Choose a bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETHIOPIAN_BANKS.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolder">Account Holder Name</Label>
                <Input
                  id="accountHolder"
                  placeholder="Full name"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                />
              </div>
            </div>

            {selectedBank === 'telebirr' ? (
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </div>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="e.g., +251912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            ) : selectedBank ? (
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
            ) : null}

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={!selectedBank}
            >
              Save Payment Information
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorPayment;
