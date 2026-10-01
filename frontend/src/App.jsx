import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CatalogPage } from './pages/CatalogPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLoansPage } from './pages/AdminLoansPage';
import { StudentHistoryPage } from './pages/StudentHistoryPage';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const GuestRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'pengurus' ? '/admin' : '/catalog'} replace />;
  }

  return children;
};

const HomeRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  return <Navigate to={isAuthenticated ? (user?.role === 'pengurus' ? '/admin' : '/catalog') : '/login'} replace />;
};

const AppShell = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

const AppRoutes = () => (
  <>
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route
        path="/catalog"
        element={<ProtectedRoute allowedRole="mahasiswa"><AppShell><CatalogPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/my-loans"
        element={<ProtectedRoute allowedRole="mahasiswa"><AppShell><StudentHistoryPage /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/admin"
        element={<ProtectedRoute allowedRole="pengurus"><AppShell><AdminDashboard /></AppShell></ProtectedRoute>}
      />
      <Route
        path="/admin/loans"
        element={<ProtectedRoute allowedRole="pengurus"><AppShell><AdminLoansPage /></AppShell></ProtectedRoute>}
      />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
    <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
  </>
);

export const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);