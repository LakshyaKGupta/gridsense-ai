import Cursor from './components/ui/Cursor'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

const ProblemSolution = lazy(() => import('./components/sections/ProblemSolution'))
const HowItWorks = lazy(() => import('./components/sections/HowItWorks'))
const LiveDemo = lazy(() => import('./components/sections/LiveDemo'))
const ImpactMetrics = lazy(() => import('./components/sections/ImpactMetrics'))
const CTA = lazy(() => import('./components/sections/CTA'))

function Landing() {
  return (
    <>
      <Cursor />
      <Navbar />
      
      {/* 1. Hero — epic full screen */}
      <Hero />

      {/* 2. Problem & Solution */}
      <Suspense fallback={<div>Loading...</div>}>
        <ProblemSolution />
      </Suspense>

      {/* 3. How It Works */}
      <Suspense fallback={<div>Loading...</div>}>
        <HowItWorks />
      </Suspense>

      {/* 4. Live Demo */}
      <Suspense fallback={<div>Loading...</div>}>
        <LiveDemo />
      </Suspense>

      {/* 5. Impact Metrics */}
      <Suspense fallback={<div>Loading...</div>}>
        <ImpactMetrics />
      </Suspense>

      {/* 6. CTA & Footer */}
      <Suspense fallback={<div>Loading...</div>}>
        <CTA />
      </Suspense>
      <Footer />
    </>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>
  }
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { token, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>
  }
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={<Navigate to="/login?mode=signup" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
