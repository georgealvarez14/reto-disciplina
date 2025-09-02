import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { authAPI } from './utils/api.ts';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';

// Components
import Layout from './components/Layout/Layout.tsx';
import LoadingSpinner from './components/UI/LoadingSpinner.tsx';
import MentorMessage from './components/UI/MentorMessage.tsx';

// Pages
import LoginPage from './pages/Auth/LoginPage.tsx';
import RegisterPage from './pages/Auth/RegisterPage.tsx';
import DashboardPage from './pages/Dashboard/DashboardPage.tsx';
import BankrollsPage from './pages/Bankrolls/BankrollsPage.tsx';
import WagersPage from './pages/Wagers/WagersPage.tsx';
import AnalyticsPage from './pages/Analytics/AnalyticsPage.tsx';
import SimulatorPage from './pages/Simulator/SimulatorPage.tsx';
import SettingsPage from './pages/Settings/SettingsPage.tsx';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Component
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bankrolls" element={<BankrollsPage />} />
        <Route path="wagers" element={<WagersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="simulator" element={<SimulatorPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

// App Component with Auth Provider
const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
