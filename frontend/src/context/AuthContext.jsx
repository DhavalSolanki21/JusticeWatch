import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';













const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await api.get('/auth/me/');
        setUser(response.data);
      } catch (err) {
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

  const login = async (username, password) => {
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
    } catch (err) {
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

  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register/', formData);
      setLoading(false);
      return true;
    } catch (err) {
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
    </AuthContext.Provider>);

};
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};