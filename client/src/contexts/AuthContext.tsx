import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { authAPI } from '../utils/api';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, currency: string, riskProfile: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated on mount
  const { data: userData, isLoading: userLoading } = useQuery(
    'user',
    async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await authAPI.getMe();
      return response.user;
    },
    {
      retry: false,
      enabled: !!localStorage.getItem('token'),
      onSuccess: (data) => {
        setUser(data);
      },
      onError: () => {
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      },
      onSettled: () => {
        setLoading(false);
      },
    }
  );

  // Initialize user from localStorage if available
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && !user) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    
    if (!localStorage.getItem('token')) {
      setLoading(false);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authAPI.login({ email, password });
      
      // Save token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Update state
      setUser(response.user);
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries('user');
      
      // Show mentor message if available
      if (response.mentorMessage) {
        // You can show this message using a toast or notification system
        console.log('Mentor Message:', response.mentorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, currency: string, riskProfile: string) => {
    try {
      const response: AuthResponse = await authAPI.register({
        email,
        password,
        currency,
        riskProfile,
      });
      
      // Save token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Update state
      setUser(response.user);
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries('user');
      
      // Show mentor message if available
      if (response.mentorMessage) {
        console.log('Mentor Message:', response.mentorMessage);
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear user state
    setUser(null);
    
    // Clear all queries
    queryClient.clear();
    
    // Call logout API (optional, for server-side cleanup)
    authAPI.logout().catch(console.error);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    loading: loading || userLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
