import Cursor from './components/ui/Cursor'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import { lazy, Suspense } from 'react'

const DemoSection = lazy(() => import('./components/sections/DemoSection'))
const Sections = lazy(() => import('./components/sections/Sections'))
const ExtraSections = lazy(() => import('./components/sections/ExtraSections'))

export default function App() {
  return (
    <>
      <Cursor />
      <Navbar />
      
      {/* 1. Hero — full screen video */}
      <Hero />

      {/* 2. Demo — immediately after hero */}
      <Suspense fallback={<div>Loading...</div>}>
        <DemoSection />
      </Suspense>

      {/* 3. Trust + Problem/Solution + How It Works + Metrics + Use Cases + CTA */}
      <Suspense fallback={<div>Loading...</div>}>
        <Sections />
      </Suspense>

      {/* 4. Three extra animated sections */}
      <Suspense fallback={<div>Loading...</div>}>
        <ExtraSections />
      </Suspense>

      {/* 5. Footer with columns */}
      <Footer />
    </>
  )
}
