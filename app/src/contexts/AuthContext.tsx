import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Tokens } from '@/types';
import { authApi } from '@/api/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isDoctor: boolean;
  isPatient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<Tokens | null>(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getCurrentUser(),
    enabled: !!tokens,
    retry: false,
  });

  useEffect(() => {
    if (userData?.user) {
      setCurrentUser(userData.user);
    }
  }, [userData]);

  const user = currentUser || userData?.user || null;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      const { accessToken, refreshToken } = data.tokens;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setTokens({ accessToken, refreshToken });
      setCurrentUser(data.user);
      queryClient.setQueryData(['currentUser'], data);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      const { accessToken, refreshToken } = data.tokens;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setTokens({ accessToken, refreshToken });
      setCurrentUser(data.user);
      queryClient.setQueryData(['currentUser'], data);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    },
    onSettled: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setTokens(null);
      setCurrentUser(null);
      queryClient.clear();
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginMutation.mutateAsync({ email, password });
      return response.user;
    },
    [loginMutation]
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      const response = await registerMutation.mutateAsync(data);
      return response.user;
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const hasRole = useCallback(
    (roles: string[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user ? ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST_ASSISTANT', 'DENTIST', 'SPECIALIST'].includes(user.role) : false;
  const isDoctor = user ? ['ADMIN', 'DOCTOR', 'DENTIST', 'SPECIALIST'].includes(user.role) : false;
  const isPatient = user?.role === 'PATIENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        isAdmin,
        isStaff,
        isDoctor,
        isPatient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
