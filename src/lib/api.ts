const API_BASE_URL = 'https://proj-babi.onrender.com/api';

export const api = {
  register: async (data: { name: string; email: string; password: string; role: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Registration failed');
    const result = await response.json();
    console.log('register:', result);
    return result;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Login failed');
    const result = await response.json();
    console.log('login:', result);
    return result;
  },

  forgotPassword: async (data: { email: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send reset link');
    const result = await response.json();
    console.log('forgotPassword:', result);
    return result;
  },

  resetPassword: async (data: { token: string; newPassword: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to reset password');
    const result = await response.json();
    console.log('resetPassword:', result);
    return result;
  },

  getUser: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch user');
    const result = await response.json();
    console.log('getUser:', result);
    return result;
  },

  getAllUsers: async (token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/users`, { headers });
    if (!response.ok) throw new Error('Failed to fetch users');
    const result = await response.json();
    console.log('getAllUsers:', result);
    return result;
  },

  updateUser: async (id: string, data: any, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    const result = await response.json();
    console.log('updateUser:', result);
    return result;
  },

  deleteUser: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete user');
    const result = await response.json();
    console.log('deleteUser:', result);
    return result;
  },

  createDoctorProfile: async (data: any, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create doctor profile');
    const result = await response.json();
    console.log('createDoctorProfile:', result);
    return result;
  },

  getAllDoctors: async (token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/doctors`, { headers });
    if (!response.ok) throw new Error('Failed to fetch doctors');
    const result = await response.json();
    console.log('getAllDoctors:', result);
    return result;
  },

  getDoctorProfile: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch doctor profile');
    const result = await response.json();
    console.log('getDoctorProfile:', result);
    return result;
  },

  updateDoctorProfile: async (id: string, data: any, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update doctor profile');
    const result = await response.json();
    console.log('updateDoctorProfile:', result);
    return result;
  },

  deleteDoctorProfile: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete doctor profile');
    const result = await response.json();
    console.log('deleteDoctorProfile:', result);
    return result;
  },

  createAppointment: async (data: {
    patient_id: string;
    doctor_id: string;
    scheduled_time: string;
    roomName?: string;
  }, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create appointment');
    const result = await response.json();
    console.log('createAppointment:', result);
    return result;
  },

  getAppointmentById: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch appointment');
    const result = await response.json();
    console.log('getAppointmentById:', result);
    return result;
  },

  getAppointmentsForPatient: async (patientId: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/appointments/patient/${patientId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch patient appointments');
    const result = await response.json();
    console.log('getAppointmentsForPatient:', result);
    return result;
  },

  getAppointmentsForDoctor: async (doctorId: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch doctor appointments');
    const result = await response.json();
    console.log('getAppointmentsForDoctor:', result);
    return result;
  },

  updateAppointment: async (id: string, data: any, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update appointment');
    const result = await response.json();
    console.log('updateAppointment:', result);
    return result;
  },

  deleteAppointment: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete appointment');
    const result = await response.json();
    console.log('deleteAppointment:', result);
    return result;
  },

  sendMessage: async (data: {
    sender_id: string;
    receiver_id: string;
    appointment_id?: string;
    content: string;
  }, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send message');
    const result = await response.json();
    console.log('sendMessage:', result);
    return result;
  },

  getMessagesByAppointment: async (appointmentId: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/messages/appointment/${appointmentId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch messages');
    const result = await response.json();
    console.log('getMessagesByAppointment:', result);
    return result;
  },

  getMessagesBetweenUsers: async (user1: string, user2: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/messages/between/${user1}/${user2}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch messages');
    const result = await response.json();
    console.log('getMessagesBetweenUsers:', result);
    return result;
  },

  deleteMessage: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete message');
    const result = await response.json();
    console.log('deleteMessage:', result);
    return result;
  },

  createPrescription: async (data: {
    appointment_id: string;
    doctor_id: string;
    patient_id: string;
    medications: any[];
  }, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/prescriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create prescription');
    const result = await response.json();
    console.log('createPrescription:', result);
    return result;
  },

  getPrescriptionById: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch prescription');
    const result = await response.json();
    console.log('getPrescriptionById:', result);
    return result;
  },

  getAllPrescriptions: async (token?: string, patientId?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    let url = `${API_BASE_URL}/prescriptions`;
    if (patientId) url += `/patient/${patientId}`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch prescriptions');
    const result = await response.json();
    console.log('getAllPrescriptions:', result);
    return result;
  },

  updatePrescription: async (id: string, data: any, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update prescription');
    const result = await response.json();
    console.log('updatePrescription:', result);
    return result;
  },

  deletePrescription: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete prescription');
    const result = await response.json();
    console.log('deletePrescription:', result);
    return result;
  },

  initializePayment: async (data: {
    appointment_id: string;
    amount: number;
    currency?: string;
    return_url: string;
  }, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to initialize payment');
    const result = await response.json();
    console.log('initializePayment:', result);
    return result;
  },

  validatePayment: async (tx_ref: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/payments/validate?tx_ref=${tx_ref}`, { headers });
    if (!response.ok) throw new Error('Failed to validate payment');
    const result = await response.json();
    console.log('validatePayment:', result);
    return result;
  },

  getPaymentById: async (id: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch payment');
    const result = await response.json();
    console.log('getPaymentById:', result);
    return result;
  },

  getVideoToken: async (data: { identity: string; room: string }, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/video/token`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to get video token');
    const result = await response.json();
    console.log('getVideoToken:', result);
    return result;
  },

  getVideoRoomInfo: async (roomName: string, token?: string) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/video/room/${roomName}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch room info');
    const result = await response.json();
    console.log('getVideoRoomInfo:', result);
    return result;
  },

  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (!response.ok) throw new Error('Server health check failed');
    const result = await response.json();
    console.log('healthCheck:', result);
    return result;
  },
};