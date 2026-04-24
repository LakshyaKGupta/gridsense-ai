import Cursor from './components/Cursor'
import Hero from './components/Hero'
import DemoSection from './components/DemoSection'
import Sections from './components/Sections'
import ExtraSections from './components/ExtraSections'


function Footer() {
  const cols = [
    { title:'Product', links:['Live Demo','Metrics','Use Cases','How It Works','ROI Calculator'] },
    { title:'Platform', links:['Demand Forecasting','Schedule Optimizer','Zone Intelligence','Infrastructure Scorer','API Reference'] },
    { title:'Company',  links:['About GridSense','Research','Blog','Careers','Contact Us'] },
    { title:'Legal',    links:['Privacy Policy','Terms of Service','Data Processing (DPA)','Cookie Policy','Security'] },
  ]
  return (
    <footer style={{
      borderTop:'1px solid rgba(255,255,255,0.06)',
      background:'#080c12',
      padding:'64px 6% 36px',
    }}>
      <div style={{ maxWidth:1240, margin:'0 auto' }}>
        {/* Top row */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr repeat(4,1fr)', gap:40, marginBottom:52 }}>
          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{
                width:34, height:34, borderRadius:10,
                background:'linear-gradient(135deg,#00E5A0,#00C8FF)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:900, fontSize:13, color:'#000',
                boxShadow:'0 0 18px rgba(0,229,160,0.3)',
              }}>GS</div>
              <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>
                Grid<span style={{ color:'#00E5A0' }}>Sense</span> AI
              </span>
            </div>
            <p style={{ fontSize:13, color:'#4A5568', lineHeight:1.7, maxWidth:220, marginBottom:20 }}>
              AI-powered EV charging optimization for modern cities. Zero hardware changes.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              {['𝕏','in','gh'].map(s => (
                <div key={s} style={{
                  width:32, height:32, borderRadius:8,
                  border:'1px solid rgba(255,255,255,0.08)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, color:'#4A5568', cursor:'none',
                  transition:'all 0.2s',
                }}>{s}</div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.4px', color:'#8A9BB0', marginBottom:16 }}>
                {col.title}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {col.links.map(l => (
                  <a key={l} href="#" style={{
                    fontSize:13, color:'#4A5568', textDecoration:'none',
                    cursor:'none', transition:'color 0.2s',
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.color='#CBD5E0')}
                    onMouseLeave={e=>(e.currentTarget.style.color='#4A5568')}
                  >{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop:'1px solid rgba(255,255,255,0.05)',
          paddingTop:24,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:12,
          fontSize:12, color:'#3A4A5E',
        }}>
          <span>© 2026 GridSense AI · BESCOM EV Track · v1.0 · Built for India</span>
          <div style={{ display:'flex', gap:20 }}>
            {['Privacy Policy','Terms','Data Processing','Cookies'].map(l => (
              <a key={l} href="#" style={{ color:'#3A4A5E', textDecoration:'none', cursor:'none', transition:'color 0.2s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#8A9BB0')}
                onMouseLeave={e=>(e.currentTarget.style.color='#3A4A5E')}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Cursor />

      {/* Navbar */}
      <nav className="nav" id="navbar">
        <a className="nav-logo" href="#" id="nav-home">
          <div className="nav-mark">GS</div>
          <span className="nav-name">Grid<span>Sense</span> AI</span>
        </a>
        <ul className="nav-links">
          <li><a href="#demo"     id="nav-demo">Live Demo</a></li>
          <li><a href="#problem"  id="nav-problem">Platform</a></li>
          <li><a href="#metrics"  id="nav-metrics">Metrics</a></li>
          <li><a href="#roi"      id="nav-roi">ROI</a></li>
          <li><a href="#usecases" id="nav-cases">Use Cases</a></li>
        </ul>
        <div className="nav-end">
          <a className="btn btn-outline btn-sm" href="#how" id="nav-how">How It Works</a>
          <a className="btn btn-green  btn-sm" href="#cta" id="nav-cta">Request Demo</a>
        </div>
      </nav>

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
