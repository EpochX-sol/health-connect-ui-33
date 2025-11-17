import { User } from '@/types';

const AUTH_STORAGE_KEY = 'telehealth_auth';

export interface AuthData {
  user: User;
  token: string;
}

export const authStorage = {
  set: (data: AuthData) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  },

  get: (): AuthData | null => {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  clear: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};

export const isAuthenticated = (): boolean => {
  return authStorage.get() !== null;
};

export const requireAuth = (): AuthData => {
  const auth = authStorage.get();
  if (!auth) {
    throw new Error('Not authenticated');
  }
  return auth;
};

export const getAuthData = (): AuthData | null => {
  return authStorage.get();
};
