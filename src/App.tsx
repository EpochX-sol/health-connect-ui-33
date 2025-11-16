import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import RegisterPatient from "./pages/RegisterPatient";
import RegisterDoctor from "./pages/RegisterDoctor";
import PatientLayout from "./components/patient/PatientLayout";
import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/Profile";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientMessages from "./pages/patient/Messages";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/patient" element={<RegisterPatient />} />
            <Route path="/register/doctor" element={<RegisterDoctor />} />
            
            <Route path="/patient" element={<PatientLayout />}>
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="profile" element={<PatientProfile />} />
              <Route path="appointments/book" element={<BookAppointment />} />
              <Route path="messages" element={<PatientMessages />} />
              <Route path="prescriptions" element={<PatientPrescriptions />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
