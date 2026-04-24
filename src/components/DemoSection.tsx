import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// 24h demand data
const BASE = [12,9,7,6,5,8,18,32,45,48,42,38,35,36,40,44,62,88,96,91,78,55,34,18]
const OPT  = [12,9,7,6,5,8,18,32,45,48,42,38,35,36,40,44,52,65,70,64,55,44,30,20]
const HLABELS = ['12a','3a','6a','9a','12p','3p','6p','9p']

const makeGrid = (hot: boolean) =>
  [90,85,40,30,95,60,20,80,92,35,25,88,45,18,75,88,30,20,82,40,15,
   60,70,28,18,65,35,12,45,55,22,15,50,28,10].map(v =>
    hot ? v : Math.max(6, Math.round(v * 0.26))
  )

const cellColor = (v: number) => {
  if (v > 80) return { bg: '#FF4757', sh: 'rgba(255,71,87,0.5)' }
  if (v > 60) return { bg: '#FF6B35', sh: 'rgba(255,107,53,0.4)' }
  if (v > 35) return { bg: '#EAB308', sh: 'rgba(234,179,8,0.3)' }
  if (v > 15) return { bg: '#00E5A0', sh: 'rgba(0,229,160,0.25)' }
  return           { bg: '#1A2535',  sh: 'none' }
}

const barColor = (v: number, opt: boolean) =>
  opt ? '#00E5A0' : v > 80 ? '#FF4757' : v > 60 ? '#FF6B35' : '#EAB308'

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, seen }
}

export default function DemoSection() {
  const [opt, setOpt] = useState(false)
  const [auto, setAuto] = useState(true)
  const [grid, setGrid] = useState(makeGrid(true))
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const { ref, seen } = useInView()

  useEffect(() => {
    if (!auto) return
    timer.current = setTimeout(() => {
      setOpt(o => { const n = !o; setGrid(makeGrid(!n)); return n })
    }, 3800)
    return () => clearTimeout(timer.current)
  }, [opt, auto])

  const data = opt ? OPT : BASE
  const schedules = [
    { time: '10:30 PM–12:30 AM', delta: '−28 kW', pct: 88, col: '#00E5A0' },
    { time: '11:00 PM–1:00 AM',  delta: '−19 kW', pct: 72, col: '#00C8FF' },
    { time: '2:00 AM–4:00 AM',   delta: '−14 kW', pct: 56, col: '#00E5A0' },
  ]

  return (
    <section id="demo" ref={ref as React.RefObject<HTMLElement>} style={{ padding: '100px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 7%' }}>
        <span className="s-label">Live Intelligence Demo</span>
        <h2 className="s-h2">Watch AI Rebalance<br />the Grid in Real Time</h2>
        <p className="s-body">
          Toggle between unmanaged and AI-optimized states. The platform shifts
          demand automatically — no infrastructure changes, no hardware.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28 }}>
          <button
            id="demo-toggle"
            className={`btn ${opt ? 'btn-green' : 'btn-outline'}`}
            style={{ minWidth: 210 }}
            onClick={() => { setAuto(false); setOpt(o => { setGrid(makeGrid(o)); return !o }) }}
          >
            {opt ? '✓ AI Optimized' : '⚠ Unmanaged State'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--dim)' }}>
            {auto && 'Auto-cycling · '}{opt ? 'Peak load reduced 27%' : 'Evening spike detected'}
          </span>
        </div>

        <div className="demo-wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Heatmap */}
            <div className="demo-panel">
              <div className="demo-ph">
                <h4>Zone Demand Heatmap · Bengaluru Wards</h4>
                <span className={`demo-status ${opt ? 'ok' : 'bad'}`}>
                  {opt ? 'OPTIMIZED' : 'PEAK LOAD'}
                </span>
              </div>
              <div className="zone-grid">
                {grid.map((v, i) => {
                  const { bg, sh } = cellColor(v)
                  return (
                    <div key={i} className="zone-cell"
                      style={{ backgroundColor: bg, boxShadow: sh !== 'none' ? `0 0 7px ${sh}` : 'none' }}
                      title={`Zone ${i+1}: ${Math.round(v)}%`} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {[['#FF4757','Critical >80%'],['#FF6B35','High >60%'],['#EAB308','Medium'],['#00E5A0','Low']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: 10, color: 'var(--dim)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demand Chart */}
            <div className="demo-panel">
              <div className="demo-ph">
                <h4>24-Hour Demand Forecast</h4>
                <span style={{ fontSize: 10, color: 'var(--dim)', fontVariantNumeric: 'tabular-nums' }}>kW · Bengaluru Grid</span>
              </div>
              <div className="bars">
                {data.map((v, i) => (
                  <div key={i} className="bar" style={{ height: `${(v/100)*100}%`, background: barColor(v, opt), opacity: 0.9 }} />
                ))}
              </div>
              <div className="bar-labels">
                {HLABELS.map(h => <span key={h} className="bar-label">{h}</span>)}
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, color: opt ? '#00E5A0' : '#FF4757', fontWeight: 600 }}>
                {opt ? '✓ Peak shifted 8 PM → 11 PM · Saved 26 kW at feeder' : '⚠ 96 kW spike at 8–9 PM · Feeder at critical capacity'}
              </div>
            </div>
          </div>

          {/* Scheduling panel */}
          <div className="demo-panel" style={{ minHeight: 420 }}>
            <div className="demo-ph">
              <h4>AI Scheduling Engine</h4>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.65 }}>
              {opt
                ? 'Zone BTM_Z03 — 3 optimal windows found. LP optimizer shifted sessions within ±3h user constraint.'
                : 'Zone BTM_Z03 — Unmanaged. 94% of sessions clustering at 7–10 PM peak window.'}
            </p>

            {opt ? schedules.map((s, i) => (
              <div className="sched-row" key={i} id={`sched-${i}`}>
                <div className="sched-top">
                  <span className="sched-time" style={{ color: s.col }}>{s.time}</span>
                  <span className="sched-delta" style={{ color: s.col }}>{s.delta}</span>
                </div>
                <div className="sched-bar-bg">
                  <motion.div className="sched-bar"
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                    style={{ background: s.col }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 5 }}>
                  {s.pct}% headroom · Incentive eligible
                </div>
              </div>
            )) : (
              <div style={{ padding: '44px 0', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                Enable AI mode to see scheduling recommendations
              </div>
            )}

            {/* Feeder bar */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--dim)', marginBottom: 7 }}>
                <span>Feeder Capacity Used</span>
                <span style={{ fontWeight: 700, color: opt ? '#00E5A0' : '#FF4757' }}>{opt ? '61%' : '96%'}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <motion.div
                  animate={{ width: opt ? '61%' : '96%' }}
                  transition={{ duration: 1.3, ease: 'easeInOut' }}
                  style={{
                    height: 5, borderRadius: 3,
                    background: opt
                      ? 'linear-gradient(90deg,#00E5A0,#00C8FF)'
                      : 'linear-gradient(90deg,#FF6B35,#FF4757)',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 6 }}>
                Safe zone: &lt;80% · Rated capacity 120 kW
              </div>
            </div>

            {opt && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 18, padding: '12px 14px', borderRadius: 9,
                  background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)',
                  fontSize: 12, color: '#00E5A0', lineHeight: 1.6,
                }}
              >
                Grid Load Balanced · Sessions conserved · 0 user disruption
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
