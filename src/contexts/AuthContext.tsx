import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { authStorage, AuthData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: AuthData) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const auth = authStorage.get();
    if (auth) {
      setUser(auth.user);
      setToken(auth.token);
    }
  }, []);

  const login = (data: AuthData) => {
    setUser(data.user);
    setToken(data.token);
    authStorage.set(data);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    authStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
