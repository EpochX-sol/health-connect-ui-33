import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { authStorage, AuthData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: AuthData) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on app load
    const auth = authStorage.get();
    if (auth) {
      setUser(auth.user);
      setToken(auth.token);
    }
    setIsLoading(false);
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

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (token) {
      authStorage.set({ user: updatedUser, token });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user && !!token,
        isLoading,
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
