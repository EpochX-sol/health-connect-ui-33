import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const PaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the tx_ref from URL parameters (Chapa will redirect here with tx_ref)
        const tx_ref = searchParams.get('tx_ref');
        const appointment_id = searchParams.get('appointment_id');

        console.log('Payment status page - tx_ref:', tx_ref, 'appointment_id:', appointment_id);

        // If we have tx_ref, verify the payment
        if (tx_ref && tx_ref !== 'null') {
          // Validate the payment with the backend
          const result = await api.validatePayment(tx_ref, token);

          console.log('Validation result:', result);

          if (result.success || result.chapa?.status === 'success' || result.status === 'success') {
            setStatus('success');
            setMessage('Payment verified! Your appointment is confirmed.');
            
            toast({
              title: 'Payment Successful',
              description: 'Your appointment has been confirmed.',
            });

            // Redirect to appointments after 3 seconds
            setTimeout(() => {
              navigate('/patient/appointments');
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Payment verification failed. Please try again or contact support.');
            
            toast({
              title: 'Payment Verification Failed',
              description: 'Your payment could not be verified',
              variant: 'destructive',
            });
          }
        } else if (appointment_id && appointment_id !== 'null') {
          // Fallback: Check appointment status if no tx_ref
          try {
            const appointment = await api.getAppointmentById(appointment_id, token);
            
            console.log('Appointment data:', appointment);
            
            // Check if appointment is booked (payment successful) or has a payment_id
            if (appointment && (appointment.status === 'booked' || appointment.payment_id)) {
              setStatus('success');
              setMessage('Payment verified! Your appointment is confirmed.');
              
              toast({
                title: 'Payment Successful',
                description: 'Your appointment has been confirmed.',
              });

              // Redirect to appointments after 3 seconds
              setTimeout(() => {
                navigate('/patient/appointments');
              }, 3000);
            } else {
              setStatus('error');
              setMessage('Payment pending or not found. Please try the payment process again.');
              
              toast({
                title: 'Payment Status Unknown',
                description: 'Unable to verify payment status',
                variant: 'destructive',
              });
            }
          } catch (appointmentError) {
            console.error('Error fetching appointment:', appointmentError);
            setStatus('error');
            setMessage('Could not verify appointment. Please contact support.');
          }
        } else {
          setStatus('error');
          setMessage('No transaction reference or appointment found. Please contact support.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An error occurred while verifying your payment');
        
        toast({
          title: 'Error',
          description: 'Failed to verify payment',
          variant: 'destructive',
        });
      }
    };

    verifyPayment();
  }, [searchParams, token, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{message}</h2>
              <p className="text-muted-foreground">Please wait while we process your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">{message}</h2>
              <p className="text-muted-foreground">You will be redirected to your appointments shortly...</p>
              <Button 
                onClick={() => navigate('/patient/appointments')}
                className="w-full"
              >
                Go to Appointments
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-destructive">Payment Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/patient/book-appointment')}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/patient/appointments')}
                  className="w-full"
                >
                  Go to Appointments
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStatus;
