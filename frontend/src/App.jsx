import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import FuncionariosPage from './features/funcionarios/FuncionariosPage';
import HerramientasPage from './features/herramientas/HerramientasPage';
import PrestamoWizardPage from './features/prestamos/PrestamoWizardPage';
import DevolucionesPage from './features/devoluciones/DevolucionesPage';
import ReportesPage from './features/reportes/ReportesPage';
import HistorialPage from './features/historial/HistorialPage';
import ConfiguracionPage from './features/configuracion/ConfiguracionPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prestamos/nuevo"
        element={
          <ProtectedRoute>
            <PrestamoWizardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/herramientas"
        element={
          <ProtectedRoute>
            <HerramientasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/funcionarios"
        element={
          <ProtectedRoute>
            <FuncionariosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/devoluciones"
        element={
          <ProtectedRoute>
            <DevolucionesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <ReportesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historial"
        element={
          <ProtectedRoute>
            <HistorialPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <ConfiguracionPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
