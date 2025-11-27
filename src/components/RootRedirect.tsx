import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '@/lib/auth';

const RootRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = authStorage.get();

    if (auth && auth.user && auth.token) {
      // User is logged in, redirect based on role
      const userRole = auth.user.role;

      if (userRole === 'patient') {
        navigate('/patient/dashboard', { replace: true });
      } else if (userRole === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
    // If no session found, stay on index (landing page)
  }, [navigate]);

  return null;
};

export default RootRedirect;
