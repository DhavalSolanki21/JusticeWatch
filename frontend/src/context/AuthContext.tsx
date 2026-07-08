import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (formData: any) => Promise<boolean>;
  clearError: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await api.get('/auth/me/');
        setUser(response.data);
      } catch (err: any) {
        console.error("Token restore failed:", err);
        logout();
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await fetchUser();
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { access, refresh, user: userDetails } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(userDetails);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Login failed:", err);
      // Retrieve the backend error message if available
      const errMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Invalid username or password.";
      setError(errMsg);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const register = async (formData: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register/', formData);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Registration failed:", err);
      const errMsg = err.response?.data ? Object.values(err.response.data).flat().join(" ") : "Registration failed.";
      setError(errMsg);
      setLoading(false);
      return false;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, register, clearError, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
