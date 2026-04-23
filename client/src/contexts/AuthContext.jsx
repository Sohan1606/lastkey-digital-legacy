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
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token');
    // Set axios header synchronously during initialization
    if (t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    return t || null;
  });
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [fetchingUser, setFetchingUser] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setFetchingUser(false);
        return; // No token - not logged in, that is fine
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        const response = await axios.get(`${API_BASE}/auth/protected`);

        const userData = response.data.data?.user || response.data.user || response.data.data;

        if (userData) {
          setUser(userData);
          setToken(storedToken);
          localStorage.setItem('user', JSON.stringify(userData));
        }

      } catch (error) {
        // Token invalid or expired - clean up silently
        // Do NOT console.error here (causes console noise)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
      } finally {
        setFetchingUser(false);
      }
    };

    initAuth();
  }, []);

  // Keep axios header in sync when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Keep user in localStorage in sync
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      return data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      queryClient.setQueryData(['user'], data.data.user);
    },
  });

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
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
