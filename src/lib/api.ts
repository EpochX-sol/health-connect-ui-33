const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // User endpoints
  register: async (data: { name: string; email: string; password: string; role: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  login: async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  getUser: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  updateUser: async (id: string, data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  // Doctor endpoints
  createDoctorProfile: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create doctor profile');
    return response.json();
  },

  getDoctors: async (token?: string) => {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE_URL}/doctors`, { headers });
    if (!response.ok) throw new Error('Failed to fetch doctors');
    return response.json();
  },

  getDoctorProfile: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch doctor profile');
    return response.json();
  },

  // Appointment endpoints
  createAppointment: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create appointment');
    return response.json();
  },

  getAppointments: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },

  getAppointment: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch appointment');
    return response.json();
  },

  updateAppointment: async (id: string, data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update appointment');
    return response.json();
  },

  cancelAppointment: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to cancel appointment');
    return response.json();
  },

  // Message endpoints
  sendMessage: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  getMessages: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  // Prescription endpoints
  getPrescriptions: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/prescriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch prescriptions');
    return response.json();
  },

  getPrescription: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch prescription');
    return response.json();
  },

  // Payment endpoints
  initializePayment: async (data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to initialize payment');
    return response.json();
  },

  getPayment: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch payment');
    return response.json();
  },

  // Video endpoints
  getVideoToken: async (data: { identity: string; room: string }, token: string) => {
    const response = await fetch(`${API_BASE_URL}/video/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to get video token');
    return response.json();
  },
};
