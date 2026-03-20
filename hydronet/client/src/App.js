import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Common/Toast';
import Sidebar from './components/Common/Sidebar';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { LoadingScreen } from './pages/NotFoundPage';

// Pages
import { LoginPage, RegisterPage }    from './pages/AuthPages';
import { NotFoundPage }               from './pages/NotFoundPage';
import MapPage             from './pages/MapPage';
import StructuresPage      from './pages/StructuresPage';
import StructureDetailPage from './pages/StructureDetailPage';
import DashboardPage       from './pages/DashboardPage';
import ReportPage          from './pages/ReportPage';
import ValidationPage      from './pages/ValidationPage';
import LeaderboardPage     from './pages/LeaderboardPage';
import ImpactPage          from './pages/ImpactPage';
import ProfilePage         from './pages/ProfilePage';
import { MyReportsPage, AddStructurePage } from './pages/OtherPages';

// ── Guards ───────────────────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/map" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user)    return <Navigate to="/map" replace />;
  return children;
}

// ── Layout ───────────────────────────────────────────────────────────────────
function AppLayout({ children }) {
  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}

// ── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public auth */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* All authenticated users */}
      <Route path="/map"            element={<ProtectedRoute><AppLayout><MapPage /></AppLayout></ProtectedRoute>} />
      <Route path="/structures"     element={<ProtectedRoute><AppLayout><StructuresPage /></AppLayout></ProtectedRoute>} />
      <Route path="/structures/:id" element={<ProtectedRoute><AppLayout><StructureDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/report"         element={<ProtectedRoute><AppLayout><ReportPage /></AppLayout></ProtectedRoute>} />
      <Route path="/my-reports"     element={<ProtectedRoute><AppLayout><MyReportsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/leaderboard"    element={<ProtectedRoute><AppLayout><LeaderboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/impact"         element={<ProtectedRoute><AppLayout><ImpactPage /></AppLayout></ProtectedRoute>} />
      <Route path="/add-structure"  element={<ProtectedRoute><AppLayout><AddStructurePage /></AppLayout></ProtectedRoute>} />
      <Route path="/profile"        element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />

      {/* Officers + Admin */}
      <Route path="/dashboard"  element={<ProtectedRoute roles={['admin','municipal_officer','ngo']}><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/validation" element={<ProtectedRoute roles={['admin','municipal_officer']}><AppLayout><ValidationPage /></AppLayout></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/"   element={<Navigate to="/map"    replace />} />
      <Route path="*"   element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
