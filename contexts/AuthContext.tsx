'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '@/services/auth.service';
import type { AdminSession, AdminRole } from '@/types';

interface AuthContextType {
  user: AdminSession | null;
  role: AdminRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; secret: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string; targetUsername?: string }) => Promise<string>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  changePassword: async () => '',
  refreshSession: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const verified = await AuthService.verifySession();
      setUser(verified);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    const handleUnauthorized = () => {
      AuthService.clearSession();
      setUser(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }
  }, []);

  const login = async (credentials: { username: string; secret: string; role?: string }) => {
    const res = await AuthService.login(credentials);
    setUser(res.user);
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string; targetUsername?: string }) => {
    return await AuthService.changePassword(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
