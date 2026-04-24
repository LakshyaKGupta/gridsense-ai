import Cursor from './components/ui/Cursor'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import DemoSection from './components/sections/DemoSection'
import Sections from './components/sections/Sections'
import ExtraSections from './components/sections/ExtraSections'

export default function App() {
  return (
    <>
      <Cursor />
      <Navbar />
      
      {/* 1. Hero — full screen video */}
      <Hero />

      {/* 2. Demo — immediately after hero */}
      <DemoSection />

      {/* 3. Trust + Problem/Solution + How It Works + Metrics + Use Cases + CTA */}
      <Sections />

      {/* 4. Three extra animated sections */}
      <ExtraSections />

      {/* 5. Footer with columns */}
      <Footer />
    </>
  )
}
