import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jansahay_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('jansahay_token') || null);
  const [loading, setLoading] = useState(false);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('jansahay_user', JSON.stringify(userData));
    localStorage.setItem('jansahay_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('jansahay_user');
    localStorage.removeItem('jansahay_token');
    localStorage.removeItem('jansahay_refresh_token');
  };

  const quickLogin = async (role = 'student') => {
    setLoading(true);
    try {
      const res = await authService.quickLogin(role);
      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        return res.data;
      }
    } catch (err) {
      console.error('Quick login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    quickLogin,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
