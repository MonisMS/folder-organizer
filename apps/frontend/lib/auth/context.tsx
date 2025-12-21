'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, type AuthResponse } from './api';
import { apiClient } from '../api/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'file_manager_token';
const USER_KEY = 'file_manager_user';

// Set to true to bypass authentication (for development)
const BYPASS_AUTH = true;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    // If auth is bypassed, set a mock user and skip API calls
    if (BYPASS_AUTH) {
      setUser({ id: 'dev-user', email: 'dev@example.com' });
      setToken('dev-token');
      setIsLoading(false);
      return;
    }

    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Set token in API client
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // If auth is bypassed, just set mock user and redirect
    if (BYPASS_AUTH) {
      setUser({ id: 'dev-user', email: email || 'dev@example.com' });
      setToken('dev-token');
      toast.success('Login successful! (Auth bypassed)');
      router.push('/dashboard');
      return;
    }

    try {
      const response = await authApi.login({ email, password });
      
      setToken(response.token);
      setUser(response.user);
      
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  }, [router]);

  const register = useCallback(async (email: string, password: string, confirmPassword: string) => {
    // If auth is bypassed, just set mock user and redirect
    if (BYPASS_AUTH) {
      setUser({ id: 'dev-user', email: email || 'dev@example.com' });
      setToken('dev-token');
      toast.success('Registration successful! (Auth bypassed)');
      router.push('/dashboard');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      throw new Error('Passwords do not match');
    }

    try {
      const response = await authApi.register({ email, password, confirmPassword });
      
      setToken(response.token);
      setUser(response.user);
      
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    // If auth is bypassed, just clear state and redirect
    if (BYPASS_AUTH) {
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully (Auth bypassed)');
      router.push('/');
      return;
    }

    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      delete apiClient.defaults.headers.common['Authorization'];
      toast.success('Logged out successfully');
      router.push('/');
    }
  }, [router]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    // If auth is bypassed, always return true for isAuthenticated
    isAuthenticated: BYPASS_AUTH ? true : !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

