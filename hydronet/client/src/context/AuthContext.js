import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Set auth header for all requests
  useEffect(() => {
    const token = localStorage.getItem('hn_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async (token) => {
    try {
      const { data } = await axios.get('/api/auth/me');
      if (data.success) setUser(data.user);
    } catch {
      localStorage.removeItem('hn_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('hn_token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);
    }
    return data;
  };

  const register = async (formData) => {
    const { data } = await axios.post('/api/auth/register', formData);
    if (data.success) {
      localStorage.setItem('hn_token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('hn_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const isAdmin    = user?.role === 'admin';
  const isOfficer  = user?.role === 'municipal_officer' || isAdmin;
  const isNGO      = user?.role === 'ngo';
  const isCivilian = user?.role === 'citizen';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isOfficer, isNGO, isCivilian }}>
      {children}
    </AuthContext.Provider>
  );
};
