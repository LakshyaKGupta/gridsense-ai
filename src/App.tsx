import React, { useEffect, useRef, useState } from 'react'

/* ── Inline SVG Icons (no external deps) ─────────────────────────── */
const Icon = {
  Activity:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Zap:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Brain:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.7 3 3 0 0 1 .95-5.58 2.5 2.5 0 0 1 1.58-5.26Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.7 3 3 0 0 0-.95-5.58 2.5 2.5 0 0 0-1.58-5.26Z"/></svg>,
  Map:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>,
  Shield:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  TrendDown:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  Clock:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ChevronRight:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ExternalLink:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>,
  Layers:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  BarChart:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>,
  FileText:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
}

/* ── Animated Counter ─────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = () => {
        start += target / 60
        if (start >= target) { setCount(target); return }
        setCount(Math.floor(start))
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

/* ── Floating Stat Card (video overlay) ──────────────────────────── */
function StatCard({
  label, value, unit, color, delay, style
}: {
  label: string; value: string; unit?: string; color: string; delay: string; style?: React.CSSProperties
}) {
  return (
    <div className={`ui-card ${color} anim-up`} style={{ animationDelay: delay, ...style }}>
      <div className="ui-card-label" style={{
        color: color === 'green' ? '#34d399' : color === 'red' ? '#f87171' : '#22d3ee'
      }}>{label}</div>
      <div className="ui-card-value" style={{
        color: color === 'green' ? '#34d399' : color === 'red' ? '#f87171' : '#22d3ee'
      }}>{value}</div>
      {unit && <div className="ui-card-sub">{unit}</div>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════ */
export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  // Ensure video plays muted & looped
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = true
    vid.playsInline = true
    vid.loop = true
    vid.play().catch(() => {})
  }, [])

  return (
    <>
      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="navbar" id="navbar">
        <a className="nav-logo" href="#" aria-label="GridSense AI Home">
          <div className="nav-logo-icon">GS</div>
          <span className="nav-logo-text">Grid<span>Sense</span> AI</span>
        </a>

        <ul className="nav-links">
          <li><a href="#features" id="nav-features">Platform</a></li>
          <li><a href="#architecture" id="nav-arch">Architecture</a></li>
          <li><a href="#metrics" id="nav-metrics">Metrics</a></li>
          <li><a href="#roadmap" id="nav-roadmap">Roadmap</a></li>
        </ul>

        <div className="nav-cta">
          <a className="btn-ghost" href="#architecture" id="nav-docs">Read PRD</a>
          <a className="btn-primary" href="#cta" id="nav-demo">
            Request Pilot
            <span style={{ width: 14, height: 14 }}><Icon.ChevronRight /></span>
          </a>
        </div>
      </nav>

      {/* ── Hero: Full-Screen Video ──────────────────────────────── */}
      <section className="hero-video-wrapper" id="hero" aria-label="GridSense AI Hero">
        {/* The video element — muted, looped, zoomed via CSS */}
        <video
          ref={videoRef}
          id="hero-video"
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoReady(true)}
          aria-hidden="true"
          style={{ opacity: videoReady ? 1 : 0, transition: 'opacity 0.8s ease' }}
        />

        {/* Dark gradient masks: cinematic vignette + logo blocker */}
        <div className="hero-video-mask" aria-hidden="true" />

        {/* Floating stat cards — right side */}
        <div className="video-overlay-cards" id="video-stats" aria-hidden="true">
          <StatCard label="Grid Load" value="98%" color="red" delay="0.6s" />
          <StatCard label="AI Optimized" value="−23%" unit="peak kW saved" color="green" delay="0.8s" />
          <StatCard label="Forecast MAPE" value="≤15%" unit="±confidence" color="cyan" delay="1.0s" />
        </div>

        {/* Hero copy — bottom left */}
        <div className="hero-content" id="hero-content">
          <div className="live-badge anim-up" id="hero-badge">
            <span className="live-dot" />
            BESCOM Ready · Bengaluru 2026
          </div>

          <h1 className="hero-title anim-up delay-100" id="hero-title">
            AI-Powered EV Grid<br />
            <span className="gradient-text">Optimization.</span>
          </h1>

          <p className="hero-subtitle anim-up delay-200" id="hero-subtitle">
            GridSense AI predicts EV charging demand, recommends optimal scheduling,
            and prevents grid overload — without touching a single wire.
          </p>

          <div className="hero-actions anim-up delay-300">
            <a className="btn-primary" href="#features" id="hero-cta-primary">
              Explore Platform
              <span style={{ width: 14, height: 14 }}><Icon.ChevronRight /></span>
            </a>
            <a className="btn-ghost" href="#cta" id="hero-cta-secondary">
              <span style={{ width: 14, height: 14 }}><Icon.ExternalLink /></span>
              Request Pilot
            </a>
          </div>

          <div className="stats-strip anim-up delay-400">
            <div className="stat-item" id="stat-accuracy">
              <div className="stat-num">85%+</div>
              <div className="stat-label">Forecast Accuracy</div>
            </div>
            <div className="stat-item" id="stat-peak">
              <div className="stat-num">≥20%</div>
              <div className="stat-label">Peak Load Reduction</div>
            </div>
            <div className="stat-item" id="stat-hw">
              <div className="stat-num">0</div>
              <div className="stat-label">Hardware Changes</div>
            </div>
            <div className="stat-item" id="stat-zones">
              <div className="stat-num">198</div>
              <div className="stat-label">BBMP Wards Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem Statement ────────────────────────────────────── */}
      <section id="problem" aria-labelledby="problem-heading">
        <div className="section">
          <span className="section-label">The Problem</span>
          <h2 className="section-title" id="problem-heading">
            Bengaluru's Grid Can't Keep Up<br />With EV Growth
          </h2>
          <p className="section-body">
            Evening charging spikes cause localized transformer stress, unmanaged demand
            wastes capacity, and infrastructure decisions lack data. GridSense AI fixes
            all of this without modifying a single substation.
          </p>

          <div className="problem-grid" style={{ marginTop: 48 }}>
            {[
              { icon: '⚡', cls: 'red',    title: 'Peak Hour Overload',      body: 'Evening charging spikes (6–10 PM) in residential zones cause localized grid overload and transformer stress.' },
              { icon: '📊', cls: 'orange', title: 'No Demand Forecasting',   body: 'Unmanaged EV charging leads to reactive grid management and poor resource allocation for operators.' },
              { icon: '📍', cls: 'yellow', title: 'Blind Infrastructure',    body: 'Infrastructure decisions are not data-driven, resulting in over or under-provisioning of charging stations.' },
              { icon: '📱', cls: 'blue',   title: 'No User Guidance',        body: 'EV users receive no real-time load-aware guidance, missing the opportunity to shift demand to off-peak windows.' },
            ].map((item, i) => (
              <div className="problem-cell" key={i} id={`problem-cell-${i}`}>
                <div className={`problem-icon ${item.cls}`}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features / Modules ──────────────────────────────────── */}
      <section id="features" aria-labelledby="features-heading">
        <div className="section">
          <span className="section-label">Platform Modules</span>
          <h2 className="section-title" id="features-heading">
            Two Integrated AI Modules.<br />One Unified Platform.
          </h2>
          <p className="section-body">
            Module A handles demand prediction and smart scheduling. Module B handles
            infrastructure location intelligence. Both work without modifying existing
            BESCOM systems.
          </p>

          <div className="features-grid">
            {[
              {
                num: '01',
                icon: <Icon.BarChart />,
                title: 'Demand Forecasting',
                body: 'Hybrid Prophet + LSTM model predicts EV charging load at 1-hour granularity across all 198 BBMP ward zones, 24 hours ahead.',
                tag: 'Module A · FR-A1',
              },
              {
                num: '02',
                icon: <Icon.Clock />,
                title: 'Smart Scheduling',
                body: 'Linear programming optimizer recommends 2–3 optimal charging windows per zone, reducing peak load by ≥20% vs. unmanaged baseline.',
                tag: 'Module A · FR-A2',
              },
              {
                num: '03',
                icon: <Icon.Map />,
                title: 'Infrastructure Planner',
                body: 'K-Means + DBSCAN clustering identifies high-demand zones and ranks the top-3 candidate locations for new charging stations with explainable rationale.',
                tag: 'Module B · FR-B1',
              },
              {
                num: '04',
                icon: <Icon.Brain />,
                title: 'AI-Powered Insights',
                body: 'All model outputs include plain-language rationale captions so non-technical IAS planners can act on recommendations without data science expertise.',
                tag: 'Explainability',
              },
              {
                num: '05',
                icon: <Icon.Layers />,
                title: 'Interactive Dashboard',
                body: 'Operator-grade React dashboard with Leaflet choropleth maps, Recharts forecast charts, zone drill-down cards, and one-click PDF report export.',
                tag: 'Frontend · T5',
              },
              {
                num: '06',
                icon: <Icon.Shield />,
                title: 'Zero Infrastructure Modification',
                body: 'Operates as a pure decision-support overlay — no SCADA integration, no hardware changes, no PII. Fully containerized and deployable on any cloud or local VM.',
                tag: 'Non-Invasive · T6',
              },
            ].map((f, i) => (
              <div className="feature-card" key={i} id={`feature-card-${i}`}>
                <div className="feature-number">{f.num}</div>
                <div className="feature-icon-wrap">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                <span className="feature-tag">{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics ─────────────────────────────────────────────── */}
      <section id="metrics" aria-labelledby="metrics-heading">
        <div className="section">
          <span className="section-label">Success Metrics</span>
          <h2 className="section-title" id="metrics-heading">
            Measurable Outcomes.<br />Every Single Time.
          </h2>
          <p className="section-body">
            All targets are verifiable through backtesting, simulation, and expert
            validation — not projections.
          </p>

          <div className="metrics-row">
            {[
              { num: 15,  suffix: '%',  label: 'Max MAPE', sub: 'Demand Forecast Error' },
              { num: 20,  suffix: '%+', label: 'Peak Reduction', sub: 'vs. Unmanaged Baseline' },
              { num: 90,  suffix: '%',  label: 'Peak Hour Detection', sub: 'Scheduling Effectiveness' },
              { num: 500, suffix: 'ms', label: 'Forecast Latency', sub: 'Per Zone, Real-Time' },
              { num: 99,  suffix: '%+', label: 'Demo Uptime', sub: 'During Evaluation Window' },
            ].map((m, i) => (
              <div className="metric-cell" key={i} id={`metric-${i}`}>
                <div className="metric-num">
                  <AnimatedCounter target={m.num} suffix={m.suffix} />
                </div>
                <div className="metric-label">{m.label}</div>
                <div className="metric-sub">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture ─────────────────────────────────────────── */}
      <section id="architecture" aria-labelledby="arch-heading">
        <div className="section">
          <span className="section-label">Technical Architecture</span>
          <h2 className="section-title" id="arch-heading">
            Modular. API-First.<br />Containerized.
          </h2>
          <p className="section-body">
            Each layer is independently deployable and communicates via REST APIs.
            Zero external database required in Phase 1.
          </p>

          <div className="arch-grid">
            {[
              {
                tag: 'Layer 01 — Data',
                title: 'Synthetic + Public Data Pipeline',
                desc: 'Timestamped charging event logs, BBMP ward GeoJSON, SMEV EV adoption rates, Open-Meteo weather, and proxy transformer capacity — all in-memory.',
                tech: ['Python', 'Pandas', 'GeoPandas', 'NumPy', 'Open-Meteo'],
              },
              {
                tag: 'Layer 02 — ML Pipeline',
                title: 'Hybrid Forecasting & Clustering',
                desc: 'Facebook Prophet handles seasonality + trend decomposition. LSTM captures non-linear short-term dependencies. K-Means + DBSCAN for spatial hotspot identification.',
                tech: ['Prophet', 'PyTorch', 'scikit-learn', 'DBSCAN', 'K-Means'],
              },
              {
                tag: 'Layer 03 — Optimization',
                title: 'LP Scheduler & Site Scorer',
                desc: 'PuLP linear program minimizes peak deviation subject to feeder capacity constraints. Multi-criteria weighted scoring (demand 35%, grid 30%, accessibility 20%, land 15%).',
                tech: ['PuLP', 'OR-Tools', 'FastAPI', 'Pydantic', 'Uvicorn'],
              },
              {
                tag: 'Layer 04 — Frontend',
                title: 'Operator Dashboard',
                desc: 'React 18 + Vite SPA. Leaflet choropleth maps, Recharts/D3 forecast charts, Zustand state, React Query caching, jsPDF export. No login required in demo mode.',
                tech: ['React 18', 'Vite', 'Leaflet', 'Recharts', 'Tailwind'],
              },
            ].map((l, i) => (
              <div className="arch-layer" key={i} id={`arch-layer-${i}`}>
                <div className="arch-layer-tag">{l.tag}</div>
                <h4>{l.title}</h4>
                <p>{l.desc}</p>
                <div className="arch-tech-pills">
                  {l.tech.map(t => <span className="tech-pill" key={t}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roadmap ──────────────────────────────────────────────── */}
      <section id="roadmap" aria-labelledby="roadmap-heading">
        <div className="section">
          <span className="section-label">Implementation Roadmap</span>
          <h2 className="section-title" id="roadmap-heading">
            5-Week Sprint to<br />Production Demo.
          </h2>
          <p className="section-body">
            Each phase has a concrete, verifiable deliverable. The system is demo-ready
            by Week 5 with pre-computed cached forecasts for zero-latency jury presentation.
          </p>

          <div className="roadmap-list" id="roadmap-list">
            {[
              { week: 'Week 1', badge: 'data', badgeLabel: 'Data', title: 'Data Generation & EDA', body: 'Synthetic Bengaluru EV dataset across 198 BBMP wards, zone grid generation, feature engineering pipeline.' },
              { week: 'Week 2', badge: 'ml',   badgeLabel: 'ML',   title: 'Demand Forecasting Model', body: 'Hybrid Prophet + LSTM training, 80/10/10 train/val/test split, MAPE backtesting on 30-day held-out window.' },
              { week: 'Wk 2–3', badge: 'ml',  badgeLabel: 'Optim',title: 'Scheduling Optimizer', body: 'LP/heuristic scheduler with feeder capacity constraints, load shift simulation vs. unmanaged baseline.' },
              { week: 'Week 3', badge: 'ml',   badgeLabel: 'Infra', title: 'Infrastructure Location Engine', body: 'K-Means zone clustering, DBSCAN hotspot detection, multi-criteria site scoring, ranked recommendation output.' },
              { week: 'Week 4', badge: 'ui',   badgeLabel: 'UI',   title: 'Dashboard & Frontend', body: 'React dashboard with Leaflet heatmaps, Recharts forecasts, zone drill-down, PDF export for IAS stakeholders.' },
              { week: 'Week 5', badge: 'ops',  badgeLabel: 'Demo', title: 'Integration & Demo Prep', body: 'End-to-end demo, DEMO=true cached forecast mode, Docker containerization, jury presentation deck.' },
            ].map((r, i) => (
              <div className="roadmap-item" key={i} id={`roadmap-${i}`}>
                <div className="roadmap-week">{r.week}</div>
                <div className="roadmap-line">
                  <div className="roadmap-dot" />
                  {i < 5 && <div className="roadmap-connector" />}
                </div>
                <div className="roadmap-body">
                  <h4>{r.title}</h4>
                  <p>{r.body}</p>
                  <span className={`roadmap-badge ${r.badge}`}>{r.badgeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <div className="cta-banner" id="cta">
        <div>
          <h2>Ready to Optimize Bengaluru's Grid?</h2>
          <p>GridSense AI is fully containerized, demo-ready, and deployable without modifying any existing BESCOM infrastructure.</p>
        </div>
        <div className="cta-actions">
          <a className="btn-primary" href="#hero" id="cta-pilot">
            Start Pilot
            <span style={{ width: 14, height: 14 }}><Icon.ChevronRight /></span>
          </a>
          <a className="btn-ghost" href="#architecture" id="cta-docs">
            <span style={{ width: 14, height: 14 }}><Icon.FileText /></span>
            Read Full TRD
          </a>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer id="footer">
        <div>
          <strong style={{ color: '#fff' }}>GridSense AI</strong> — BESCOM EV Charging Optimization
          <br />
          <span style={{ fontSize: 12 }}>v1.0 · April 2026 · BESCOM EV Track · Confidential</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <a href="#features" id="footer-platform">Platform</a>
          <a href="#architecture" id="footer-arch">Architecture</a>
          <a href="#metrics" id="footer-metrics">Metrics</a>
          <a href="#roadmap" id="footer-roadmap">Roadmap</a>
        </div>
      </footer>
    </>
  )
}
