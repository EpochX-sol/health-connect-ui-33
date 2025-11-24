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
  Stethoscope,
  Wallet
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';

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

  const menuItems = [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/doctor/patients', icon: Users, label: 'Patients' },
    { to: '/doctor/prescriptions', icon: FileText, label: 'Prescriptions' },
    { to: '/doctor/payment', icon: Wallet, label: 'Payment' },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full flex">
        {/* Sidebar */}
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <div className="p-4 flex items-center gap-3  group-data-[collapsible=icon]:hidden border-b border-sidebar-border">
                <div className="p-2 rounded-lg bg-gradient-medical">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 group-data-[collapsible=icon]:hidden">
                  <h1 className="text-lg font-bold text-sidebar-foreground">TeleHealth</h1>
                  <p className="text-xs text-sidebar-foreground/70">Doctor Portal</p>
                </div>
              </div>
              <SidebarGroupContent>
                <SidebarMenu className="pt-4">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.to}
                          className="flex items-center gap-3"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col   from-background via-medical-50 to-medical-100">
          {/* Header */}
          <header className="bg-background/80 border-b border-border sticky top-0 z-40">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Dr. {user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NavLink
                  to="/doctor/profile"
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  activeClassName="bg-accent"
                >
                  <UserCircle className="h-5 w-5" />
                </NavLink>
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
          </header>

          {/* Page Content */}
          <main className="flex-1 p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DoctorLayout;
