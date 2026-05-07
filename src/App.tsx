import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/sections/Hero';
import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProblemSolution = lazy(() => import('./components/sections/ProblemSolution'));
const HowItWorks = lazy(() => import('./components/sections/HowItWorks'));
const LiveDemo = lazy(() => import('./components/sections/LiveDemo'));
const ImpactMetrics = lazy(() => import('./components/sections/ImpactMetrics'));
const CTA = lazy(() => import('./components/sections/CTA'));
const Features = lazy(() => import('./components/sections/Features'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const OperatorDashboard = lazy(() => import('./pages/OperatorDashboard'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const FloatingCopilot = lazy(() => import('./components/ui/FloatingCopilot'));

function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Suspense fallback={<div />}><ProblemSolution /></Suspense>
      <Suspense fallback={<div />}><Features /></Suspense>
      <Suspense fallback={<div />}><HowItWorks /></Suspense>
      <Suspense fallback={<div />}><LiveDemo /></Suspense>
      <Suspense fallback={<div />}><ImpactMetrics /></Suspense>
      <Suspense fallback={<div />}><CTA /></Suspense>
      <Footer />
    </>
  );
}

function LoadingScreen() {
  return <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center text-slate-100">Loading...</div>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ expectedRole, children }: { expectedRole: 'operator' | 'user'; children: ReactNode }) {
  const { role, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (role !== expectedRole) {
    return <Navigate to={role === 'operator' ? '/dashboard/operator' : '/dashboard/user'} replace />;
  }
  return <>{children}</>;
}

function DashboardRedirect() {
  const { role, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'operator' ? '/dashboard/operator' : '/dashboard/user'} replace />;
}

function AppRoutes() {
  const { token, isLoading } = useAuth();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={!isLoading && token ? <DashboardRedirect /> : <Login />} />
        <Route path="/signup" element={<Navigate to="/login?mode=signup" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
        <Route path="/dashboard/operator" element={<ProtectedRoute><RoleRoute expectedRole="operator"><OperatorDashboard /></RoleRoute></ProtectedRoute>} />
        <Route path="/dashboard/user" element={<ProtectedRoute><RoleRoute expectedRole="user"><UserDashboard /></RoleRoute></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Suspense fallback={null}>
          <FloatingCopilot />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
