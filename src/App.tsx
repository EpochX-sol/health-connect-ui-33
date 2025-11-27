import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CallSystemProvider, useCallSystem } from "./contexts/CallSystemContext";
import IncomingCallModal from "./components/IncomingCallModal";
import OutgoingCallModal from "./components/OutgoingCallModal";
import ActiveCallModal from "./components/ActiveCallModal";
import VideoCallModal from "./components/VideoCallModal";
import RootRedirect from "./components/RootRedirect";
import Index from "./pages/Index";
import Login from "./pages/Login";
import RegisterPatient from "./pages/RegisterPatient";
import RegisterDoctor from "./pages/RegisterDoctor";
import PatientLayout from "./components/patient/PatientLayout";
import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/Profile";
import PatientAppointments from "./pages/patient/Appointments";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientPayment from "./pages/patient/Payment";
import PatientPaymentStatus from "./pages/patient/PaymentStatus";
import PatientMessages from "./pages/patient/Messages";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import DoctorLayout from "./components/doctor/DoctorLayout";
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorProfile from "./pages/doctor/Profile";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorPrescriptions from "./pages/doctor/Prescriptions";
import DoctorMessages from "./pages/doctor/Messages";
import DoctorPayment from "./pages/doctor/Payment";
import NotFound from "./pages/NotFound";
import AppointmentDetail from "./pages/AppointmentDetail";
import DoctorProfilePage from "./pages/DoctorProfile";
import { RequireRole } from "@/components/RequireRole";

const queryClient = new QueryClient();

// Component to show call modals
const AppContent = () => {
  const { incomingCall, outgoingCall, activeCall, acceptCall, rejectCall, cancelCall, endCall, localStream, remoteStreams } = useCallSystem();

  return (
    <>
      <IncomingCallModal incomingCall={incomingCall} onAccept={acceptCall} onReject={rejectCall} />
      <OutgoingCallModal outgoingCall={outgoingCall} onCancel={cancelCall} />
      {activeCall && activeCall.callType === 'video' ? (
        <VideoCallModal 
          activeCall={activeCall} 
          localStream={localStream}
          remoteStream={remoteStreams.size > 0 ? Array.from(remoteStreams.values())[0] : null}
          onEndCall={endCall} 
        />
      ) : (
        activeCall && (
          <ActiveCallModal 
            activeCall={activeCall} 
            localStream={localStream}
            remoteStreams={remoteStreams}
            onEndCall={endCall} 
          />
        )
      )}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<><RootRedirect /><Index /></>} />
          <Route path="/login" element={<Login />} />
        <Route path="/register/patient" element={<RegisterPatient />} />
        <Route path="/register/doctor" element={<RegisterDoctor />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index path="dashboard" element={<AdminDashboard />} />
        </Route>
          
          <Route path="/patient" element={
            <RequireRole role="patient">
              <PatientLayout />
            </RequireRole>
          }>
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="appointment/:id" element={<AppointmentDetail />} />
            <Route path="doctor-profile/:id" element={<DoctorProfilePage />} />
            <Route path="book-appointment" element={<BookAppointment />} />
            <Route path="payment" element={<PatientPayment />} />
            <Route path="payment-status" element={<PatientPaymentStatus />} />
            <Route path="messages" element={<PatientMessages />} />
            <Route path="prescriptions" element={<PatientPrescriptions />} />
          </Route>

          <Route path="/doctor" element={
            <RequireRole role="doctor">
              <DoctorLayout />
            </RequireRole>
          }>
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="profile" element={<DoctorProfile />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="appointment/:id" element={<AppointmentDetail />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="prescriptions" element={<DoctorPrescriptions />} />
            <Route path="messages" element={<DoctorMessages />} />
            <Route path="payment" element={<DoctorPayment />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CallSystemProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </CallSystemProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
