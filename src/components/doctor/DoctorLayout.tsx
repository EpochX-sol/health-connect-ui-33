import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare, 
  UserCircle,
  LogOut,
  Stethoscope
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const DoctorLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'doctor') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated || user?.role !== 'doctor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-medical-50 to-medical-100">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-lg border-b border-border shadow-elegant sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-medical">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TeleHealth</h1>
                <p className="text-sm text-muted-foreground">Doctor Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Dr. {user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-background/60 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <NavLink
              to="/doctor/dashboard"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-medical-500"
              activeClassName="text-medical-600 border-medical-500"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink
              to="/doctor/profile"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-medical-500"
              activeClassName="text-medical-600 border-medical-500"
            >
              <UserCircle className="h-4 w-4" />
              Profile
            </NavLink>
            <NavLink
              to="/doctor/appointments"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-medical-500"
              activeClassName="text-medical-600 border-medical-500"
            >
              <Calendar className="h-4 w-4" />
              Appointments
            </NavLink>
            <NavLink
              to="/doctor/patients"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-medical-500"
              activeClassName="text-medical-600 border-medical-500"
            >
              <Users className="h-4 w-4" />
              Patients
            </NavLink>
            <NavLink
              to="/doctor/prescriptions"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-medical-500"
              activeClassName="text-medical-600 border-medical-500"
            >
              <FileText className="h-4 w-4" />
              Prescriptions
            </NavLink>
            <NavLink
              to="/doctor/messages"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-medical-500"
              activeClassName="text-medical-600 border-medical-500"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorLayout;
