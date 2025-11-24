import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Lock, CheckCircle2, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const PatientPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { appointmentId, amount, paymentId, doctorName, appointmentTime } = location.state || {};

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

  const handleProceedToChapa = async () => {
    if (!appointmentId || !amount || !token) {
      setError('Missing payment information');
      return;
    }

    setProcessing(true);
    setError(null);
    
    try {
      // Get the current location URL for return_url
      const returnUrl = `${window.location.origin}/patient/payment-status?appointment_id=${appointmentId}`;

      // Initialize payment with Chapa
      const paymentResponse = await api.initializePayment({
        appointment_id: appointmentId,
        amount: amount,
        currency: 'ETB',
        return_url: returnUrl,
      }, token);

      if (paymentResponse.checkout_url) {
        // Redirect to Chapa checkout
        window.location.href = paymentResponse.checkout_url;
      } else {
        throw new Error('Failed to get checkout URL');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
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
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {doctorName && (
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium">Dr. {doctorName}</span>
              </div>
            )}
            
            {appointmentTime && (
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-muted-foreground">Appointment Date & Time</span>
                <span className="font-medium">{format(new Date(appointmentTime), 'PPp')}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground">Consultation Fee</span>
              <span className="text-2xl font-bold text-primary">{amount ? `${amount.toFixed(2)} ETB` : 'Loading...'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <Lock className="h-4 w-4" />
              <span>Your payment is processed securely through Chapa</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payment Method
          </CardTitle>
          <CardDescription>Pay securely using Chapa payment gateway</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h3 className="font-semibold text-foreground">Supported Payment Methods</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Bank transfer</li>
              <li>• Card payment</li>
              <li>• Mobile money (Telebirr)</li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleProceedToChapa}
              disabled={processing || !appointmentId || !amount}
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Proceed to Payment
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/patient/book-appointment')}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-blue-900">
            <p className="font-semibold">ℹ️ Payment Information</p>
            <p>You will be redirected to our secure payment provider Chapa where you can choose your preferred payment method.</p>
            <p>After successful payment, you will be redirected back to confirm your appointment.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientPayment;
