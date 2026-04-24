import { motion } from 'framer-motion'
import HeroVideo from './components/HeroVideo'
import DemoSection from './components/DemoSection'
import StatsZones from './components/StatsZones'

const fade = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

export default function App() {
  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="nav" id="navbar">
        <a className="nav-logo" href="#" id="nav-home">
          <div className="nav-logo-mark">GS</div>
          <span className="nav-logo-text">Grid<em>Sense</em> AI</span>
        </a>
        <ul className="nav-links">
          <li><a href="#demo"    id="nav-demo">Live Demo</a></li>
          <li><a href="#metrics" id="nav-metrics">Metrics</a></li>
          <li><a href="#zones"   id="nav-zones">Zones</a></li>
          <li><a href="#how"     id="nav-how">How It Works</a></li>
        </ul>
        <div className="nav-end">
          <a className="btn btn-ghost btn-sm" href="#how" id="nav-docs">Docs</a>
          <a className="btn btn-primary btn-sm" href="#cta" id="nav-cta">Request Pilot</a>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="hero" id="hero" aria-label="GridSense AI Hero">
        <HeroVideo />
        {/* Gradient masks + VEO logo blocker */}
        <div className="hero-mask" aria-hidden="true" />
        <div className="hero-logo-blocker" aria-hidden="true" />

        {/* Floating stat cards — visible desktop only */}
        <div className="hero-floats" id="hero-floats" aria-hidden="true">
          <div className="fcard red">
            <div className="fcard-label">Grid Status</div>
            <div className="fcard-val">96%</div>
            <div className="fcard-sub">Feeder load · BTM Zone · 8 PM</div>
          </div>
          <div className="fcard green">
            <div className="fcard-label">After AI Optimization</div>
            <div className="fcard-val">−23 kW</div>
            <div className="fcard-sub">Peak shifted to 11 PM window</div>
          </div>
          <div className="fcard blue">
            <div className="fcard-label">Forecast Accuracy</div>
            <div className="fcard-val">≤15%</div>
            <div className="fcard-sub">MAPE · 24h horizon</div>
          </div>
        </div>

        {/* Hero content — bottom-left over video */}
        <motion.div
          className="hero-content"
          id="hero-content"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fade} className="hero-eyebrow" id="hero-badge">
            <span className="pulse-dot" />
            BESCOM EV Pilot · Bengaluru 2026
          </motion.div>

          <motion.h1 variants={fade} className="hero-title" id="hero-title">
            Stop Guessing.<br />
            <span className="g">Predict. Optimize.</span><br />
            Balance the Grid.
          </motion.h1>

          <motion.p variants={fade} className="hero-sub" id="hero-sub">
            GridSense AI cuts EV charging congestion across Bengaluru with zero
            infrastructure changes — predicting demand spikes before they happen
            and shifting load automatically.
          </motion.p>

          <motion.div variants={fade} className="hero-btns">
            <a className="btn btn-primary" href="#demo" id="hero-demo-btn">
              See Live Demo ↓
            </a>
            <a className="btn btn-ghost" href="#how" id="hero-how-btn">
              How It Works
            </a>
          </motion.div>

          <motion.div variants={fade} className="hero-stats">
            {[
              { num: '85%+', label: 'Forecast Accuracy' },
              { num: '≥20%', label: 'Peak Load Reduction' },
              { num: '0',    label: 'Hardware Changes' },
              { num: '198',  label: 'BBMP Wards Covered' },
            ].map(s => (
              <div key={s.label} id={`hstat-${s.label.replace(/\s/g,'-')}`}>
                <div className="hstat-num">{s.num}</div>
                <div className="hstat-label">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section id="how" style={{ padding: '90px 0', background: 'var(--c-surface)' }}>
        <div className="wrap">
          <span className="sec-label">How It Works</span>
          <h2 className="sec-title">Three Steps.<br />Zero Infrastructure Changes.</h2>
          <p className="sec-body">
            A pure software overlay on existing BESCOM systems. No SCADA access,
            no charger hardware, no PII — just smarter decisions.
          </p>

          <div className="steps">
            {[
              {
                num: '01', icon: '🔮', badge: 'green', badgeText: 'ML Model',
                title: 'Predict Demand',
                body: 'Hybrid Prophet + LSTM forecasts EV charging load per ward zone at 1-hour granularity, 24 hours ahead — accounting for time-of-day, weather, and adoption growth.',
              },
              {
                num: '02', icon: '⚡', badge: 'blue', badgeText: 'LP Optimizer',
                title: 'Optimize Schedules',
                body: 'A linear program shifts charging sessions to off-peak windows while respecting feeder capacity limits and ±3h user convenience constraints. Peak load drops ≥20%.',
              },
              {
                num: '03', icon: '📍', badge: 'orange', badgeText: 'Spatial AI',
                title: 'Guide Infrastructure',
                body: 'K-Means + DBSCAN clusters high-demand zones. A weighted scoring model ranks candidate sites by grid headroom, accessibility, and demand growth trajectory.',
              },
            ].map(s => (
              <div className="step" key={s.num} id={`step-${s.num}`}>
                <div className="step-num">STEP {s.num}</div>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <div className="step-line">
                  <span className={`step-badge ${s.badge}`}>{s.badgeText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ──────────────────────────────────────────── */}
      <DemoSection />

      {/* ── Metrics + Zones ────────────────────────────────────── */}
      <StatsZones />

      {/* ── CTA ────────────────────────────────────────────────── */}
      <div className="cta" id="cta">
        <div>
          <h2>Ready to Run a Pilot<br />with BESCOM?</h2>
          <p>Deploy on any cloud or local VM in under 2 hours. No hardware. No risk.</p>
        </div>
        <div className="cta-btns">
          <a className="btn btn-primary" href="#demo" id="cta-primary">See the Demo</a>
          <a className="btn btn-ghost"   href="#how"  id="cta-docs">Read Docs</a>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer id="footer">
        <div>
          <strong style={{ color: '#fff' }}>GridSense AI</strong> · BESCOM EV Track · v1.0 · April 2026
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#demo"    id="footer-demo">Demo</a>
          <a href="#metrics" id="footer-metrics">Metrics</a>
          <a href="#zones"   id="footer-zones">Zones</a>
          <a href="#how"     id="footer-how">How It Works</a>
        </div>
      </footer>
    </>
  )
}
