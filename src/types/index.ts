export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  createdAt: string;
}

export interface DoctorProfile {
  _id: string;
  user_id: string;
  specialty: string;
  bio: string;
  availability: string[];
  medicalLicenseNumber: string;
  documents: {
    idCard: string;
    certificate: string;
  };
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
  createdAt: string;
  user?: User;
}

export interface Appointment {
  _id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_time: string;
  status: 'booked' | 'completed' | 'cancelled';
  roomName: string;
  createdAt: string;
  patient?: User;
  doctor?: User;
  doctorProfile?: DoctorProfile;
}

export interface Message {
  _id: string;
  sender_id: string;
  receiver_id: string;
  appointment_id: string;
  content: string;
  timestamp: string;
  sender?: User;
  receiver?: User;
}

export interface Prescription {
  _id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  medications: Medication[];
  createdAt: string;
  doctor?: User;
  patient?: User;
}

export interface Medication {
  name: string;
  dosage: string;
  instructions: string;
}

export interface Payment {
  _id: string;
  appointment_id: string;
  amount: number;
  currency: string;
  status: string;
  checkout_url?: string;
  createdAt: string;
}
