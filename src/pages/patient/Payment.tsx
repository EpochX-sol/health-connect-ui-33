import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Lock, CheckCircle2, DollarSign } from 'lucide-react';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  
  const { appointmentId, amount } = location.state || {};

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    if (!appointmentId || !amount) {
      toast({
        title: 'Invalid payment session',
        description: 'Please book an appointment first',
        variant: 'destructive',
      });
      navigate('/patient/book-appointment');
    }
  }, [appointmentId, amount, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentDetails.cardNumber || !paymentDetails.cardName || !paymentDetails.expiryDate || !paymentDetails.cvv) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all payment details',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: 'Payment successful!',
        description: 'Your appointment has been confirmed.',
      });
      setProcessing(false);
      navigate('/patient/appointments');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Complete Payment</h1>
        <p className="text-muted-foreground">Secure payment processing for your appointment</p>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">Consultation Fee</span>
              <span className="text-2xl font-bold text-primary">${amount?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Details
          </CardTitle>
          <CardDescription>Enter your card information to complete the payment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentDetails.cardNumber}
                onChange={handleInputChange}
                maxLength={19}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                name="cardName"
                placeholder="John Doe"
                value={paymentDetails.cardName}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={paymentDetails.expiryDate}
                  onChange={handleInputChange}
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  name="cvv"
                  type="password"
                  placeholder="123"
                  value={paymentDetails.cvv}
                  onChange={handleInputChange}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={processing}
              >
                <CheckCircle2 className="h-5 w-5" />
                {processing ? 'Processing Payment...' : `Pay $${amount?.toFixed(2)}`}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/patient/book-appointment')}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
