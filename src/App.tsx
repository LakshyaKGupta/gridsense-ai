import Cursor from './components/ui/Cursor'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import { lazy, Suspense } from 'react'

const ProblemSolution = lazy(() => import('./components/sections/ProblemSolution'))
const HowItWorks = lazy(() => import('./components/sections/HowItWorks'))
const LiveDemo = lazy(() => import('./components/sections/LiveDemo'))
const ImpactMetrics = lazy(() => import('./components/sections/ImpactMetrics'))
const CTA = lazy(() => import('./components/sections/CTA'))

export default function App() {
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
