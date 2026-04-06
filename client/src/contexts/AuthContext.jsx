import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  // Fetch user data if token exists
  const { isPending: fetchingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!token) return null;
      try {
        const { data } = await axios.get(`${API_BASE}/auth/protected`);
        const userData = data.data.user;
        setUser(userData);
        return userData;
      } catch (err) {
        setToken(null);
        setUser(null);
        throw err;
      }
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      return data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.data.user);
      queryClient.setQueryData(['user'], data.data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }) => {
      const { data } = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
      return data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.data.user);
      queryClient.setQueryData(['user'], data.data.user);
    },
  });

  const logout = () => {
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  const value = {
    token,
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
    fetchingUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
