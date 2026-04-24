import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

function Counter({ to, suffix = '' }: { to: number; suffix: string }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!inView) return
    let n = 0
    const tick = () => {
      n += to / 60
      if (n >= to) { setV(to); return }
      setV(Math.floor(n)); requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, to])

  return <div ref={ref} className="mc-num">{v}{suffix}</div>
}

const fw = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } }

export default function Sections() {
  return (
    <>
      {/* Trust Bar */}
      <div className="trust" id="trust">
        <span className="trust-label">Used by grid operators &amp; smart city teams</span>
        <div className="trust-logos">
          {['BESCOM','BBMP','Smart Cities','CESL','NTPC','Power Grid'].map(l => (
            <span key={l} className="trust-logo">{l}</span>
          ))}
        </div>
      </div>

      {/* Problem → Solution */}
      <section id="problem" style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 7%' }}>
          <span className="s-label">Problem → Solution</span>
          <h2 className="s-h2">EV Growth Is Stressing<br />Grids Built for Yesterday</h2>
          <div className="ps-grid">
            <div className="ps-panel">
              <div className="ps-panel-head bad">⚠ The Problem</div>
              <h3 className="ps-h3">EV demand is unpredictable, clustered, and stressing the grid</h3>
              <p className="ps-p">Evening charging spikes overwhelm distribution feeders. Without prediction, grid operators react instead of plan.</p>
              <div className="ps-points">
                {[
                  ['⚡','96% feeder load during 6–10 PM charging window'],
                  ['📍','Infrastructure placed without demand data — over or under-provisioned'],
                  ['📊','No real-time guidance means users charge at the worst possible time'],
                  ['🔁','Reactive grid management causes transformer stress and outages'],
                ].map(([ic, t]) => (
                  <div key={t} className="ps-point">
                    <span className="ps-point-icon">{ic}</span>{t}
                  </div>
                ))}
              </div>
            </div>
            <div className="ps-panel" style={{ borderLeft: '1px solid var(--border)' }}>
              <div className="ps-panel-head good">✓ The Solution</div>
              <h3 className="ps-h3">AI predicts demand, optimizes behavior, and guides infrastructure</h3>
              <p className="ps-p">GridSense AI acts as a decision-support layer — no hardware, no SCADA access. Pure intelligence on top of existing systems.</p>
              <div className="ps-points">
                {[
                  ['🔮','Forecasts EV load by zone, 24 hours ahead, with ≤15% error'],
                  ['🕐','LP optimizer shifts sessions to off-peak — ≥20% peak reduction'],
                  ['🗺','Clusters high-demand zones to guide where to build next'],
                  ['📱','Operator dashboard with plain-language insights, exportable PDFs'],
                ].map(([ic, t]) => (
                  <div key={t} className="ps-point">
                    <span className="ps-point-icon">{ic}</span>
                    <span style={{ color: 'var(--text)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" style={{ padding: '100px 0', background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 7%' }}>
          <span className="s-label">How It Works</span>
          <h2 className="s-h2">Three Steps.<br />Zero Infrastructure Changes.</h2>
          <p className="s-body">A pure software overlay. Predict, optimize, plan — without touching a wire.</p>
          <motion.div
            className="hw-grid"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ show: { transition: { staggerChildren: 0.13 } } }}
          >
            {[
              { n:'01', icon:'🔮', cls:'g', tag:'g', tagT:'Hybrid Prophet + LSTM',
                title:'Predict Demand',
                body:'Forecasts EV charging load by ward zone at 1-hour granularity, 24 hours ahead. Accounts for time-of-day, weather, and EV adoption growth trends.' },
              { n:'02', icon:'⚡', cls:'b', tag:'b', tagT:'LP Optimizer',
                title:'Optimize Scheduling',
                body:'A linear program shifts charging sessions to off-peak windows within a ±3 hour user preference window — reducing peak load by 20%+ without disrupting users.' },
              { n:'03', icon:'📍', cls:'o', tag:'o', tagT:'K-Means + DBSCAN',
                title:'Plan Infrastructure',
                body:'Spatial clustering ranks the top zones for new charging station deployment — scored by grid headroom, demand growth, accessibility, and land feasibility.' },
            ].map(c => (
              <motion.div key={c.n} variants={fw} className="hw-card" id={`hw-${c.n}`}>
                <div className="hw-num">STEP {c.n}</div>
                <div className={`hw-icon ${c.cls}`}>{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <span className={`hw-tag ${c.tag}`}>{c.tagT}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section id="metrics" className="metrics-bg" style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 7%' }}>
          <span className="s-label">Impact Metrics</span>
          <h2 className="s-h2">Numbers That Matter<br />to Grid Operators</h2>
          <div className="metrics-row">
            {[
              { to: 25, suffix: '%', label: 'Peak Load Reduction' },
              { to: 85, suffix: '%', label: 'Forecast Accuracy' },
              { to: 40, suffix: '%', label: 'Better Infrastructure Utilization' },
              { to: 198, suffix: '',  label: 'BBMP Wards Covered' },
            ].map((m, i) => (
              <div key={i} className="mc" id={`mc-${i}`}>
                <Counter to={m.to} suffix={m.suffix} />
                <div className="mc-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="usecases" style={{ padding: '100px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 7%' }}>
          <span className="s-label">Use Cases</span>
          <h2 className="s-h2">Built for Everyone<br />Who Touches the Grid</h2>
          <motion.div
            className="uc-grid"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          >
            {[
              { cls:'g', icon:'🏗', title:'Grid Operators',
                body:'Get 24-hour zone-level demand forecasts and scheduling nudges before peak events occur — not after.',
                outcomes:['Prevent transformer overload','Reduce reactive maintenance','Shift 20%+ load to off-peak'] },
              { cls:'b', icon:'📋', title:'Policy Makers',
                body:'Receive plain-language insights and one-click PDF reports formatted for IAS stakeholders — no data science required.',
                outcomes:['Evidence-based infrastructure decisions','Exportable briefing reports','Zone priority rankings with rationale'] },
              { cls:'o', icon:'🔌', title:'EV Infrastructure Companies',
                body:"Know exactly where to build next. Spatial scoring tells you which zones have unmet demand and sufficient grid headroom.",
                outcomes:['Top-3 candidate sites per priority zone','Composite score with full breakdown','Growth trajectory for 6–24 months'] },
            ].map(c => (
              <motion.div key={c.title} variants={fw} className={`uc-card ${c.cls}`} id={`uc-${c.title.replace(/\s/g,'-')}`}>
                <div className="uc-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <div className="uc-outcomes">
                  {c.outcomes.map(o => (
                    <div key={o} className="uc-out">
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>→</span> {o}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <div className="cta-wrap" id="cta">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <span className="s-label" style={{ marginBottom: 20 }}>Get Started</span>
          <h2>Start Optimizing<br />Your Grid Today</h2>
          <p>Deploy on any cloud or local VM in under 2 hours. No hardware, no risk, no SCADA access required.</p>
          <div className="cta-btns">
            <a className="btn btn-green" href="#demo" id="cta-sim">View Live Simulation</a>
            <a className="btn btn-outline" href="#how" id="cta-docs">Book a Demo</a>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer id="footer">
        <div>
          <strong style={{ color: 'var(--text)', fontWeight: 700 }}>GridSense AI</strong>
          <span style={{ margin: '0 10px', color: 'var(--border2)' }}>·</span>
          BESCOM EV Track · v1.0 · April 2026
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['#demo','Demo'],['#metrics','Metrics'],['#usecases','Use Cases'],['#how','How It Works']].map(([h,l]) => (
            <a key={l} href={h} id={`footer-${l.replace(/\s/g,'-')}`}>{l}</a>
          ))}
        </div>
      </footer>
    </>
  )
}
