import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Demand data: 24 hours, index 18-21 = evening peak (problem zone)
const BASE = [12,9,7,6,5,8,18,32,45,48,42,38,35,36,40,44,62,88,96,91,78,55,34,18]
const OPT  = [12,9,7,6,5,8,18,32,45,48,42,38,35,36,40,44,55,68,72,66,58,48,32,22]
const HOURS = ['12a','2a','4a','6a','8a','10a','12p','2p','4p','6p','8p','10p']

// 7×5 zone grid - heat values 0-100
const makeGrid = (hot: boolean) =>
  Array.from({ length: 35 }, (_, i) => {
    const base = [90,85,40,30,95,60,20,80,92,35,25,88,45,18,
                  75,88,30,20,82,40,15,60,70,28,18,65,35,12,
                  45,55,22,15,50,28,10,][i] ?? 50
    return hot ? base : Math.max(8, base * 0.28)
  })

function heatColor(v: number) {
  if (v > 80) return { bg: '#FF4757', glow: 'rgba(255,71,87,0.45)' }
  if (v > 60) return { bg: '#FF6B35', glow: 'rgba(255,107,53,0.35)' }
  if (v > 40) return { bg: '#EAB308', glow: 'rgba(234,179,8,0.25)' }
  if (v > 20) return { bg: '#00D48A', glow: 'rgba(0,212,138,0.2)' }
  return        { bg: '#1E2D40',  glow: 'none' }
}

function barColor(v: number, isOpt: boolean) {
  if (isOpt) return '#00D48A'
  if (v > 80) return '#FF4757'
  if (v > 60) return '#FF6B35'
  return '#EAB308'
}

export default function DemoSection() {
  const [optimized, setOptimized] = useState(false)
  const [grid, setGrid]           = useState(makeGrid(true))
  const [auto, setAuto]           = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!auto) return
    timerRef.current = setTimeout(() => {
      setOptimized(o => {
        const next = !o
        setGrid(makeGrid(!next))
        return next
      })
    }, 3500)
    return () => clearTimeout(timerRef.current)
  }, [optimized, auto])

  const data = optimized ? OPT : BASE
  const maxV = 100

  const toggle = () => {
    setAuto(false)
    setOptimized(o => { setGrid(makeGrid(o)); return !o })
  }

  const schedules = [
    { time: '10:30 PM – 12:30 AM', pct: 88, delta: '−28 kW', col: '#00D48A' },
    { time: '11:00 PM – 1:00 AM',  pct: 72, delta: '−19 kW', col: '#3B8EFF' },
    { time: '2:00 AM – 4:00 AM',   pct: 55, delta: '−14 kW', col: '#00D48A' },
  ]

  return (
    <section id="demo" style={{ padding: '90px 0' }}>
      <div className="wrap">
        <span className="sec-label">Live Intelligence Demo</span>
        <h2 className="sec-title">
          Watch AI Balance the Grid<br />in Real Time
        </h2>
        <p className="sec-body">
          Toggle between unmanaged and AI-optimized states across Bengaluru's
          ward zones. The platform shifts demand automatically — no infrastructure changes.
        </p>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32 }}>
          <button
            id="demo-toggle"
            className={`btn ${optimized ? 'btn-primary' : 'btn-ghost'}`}
            onClick={toggle}
            style={{ minWidth: 200 }}
          >
            {optimized ? '✓ AI Optimized State' : '⚠ Unmanaged State'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
            {auto ? 'Auto-cycling · ' : ''}{optimized ? 'Peak load reduced by 23%' : 'Evening spike active'}
          </span>
        </div>

        <div className="demo-wrap">
          {/* Left: Heatmap + Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Zone Heatmap */}
            <div className="demo-panel">
              <div className="demo-panel-header">
                <h4>Zone Demand Heatmap · Bengaluru</h4>
                <span className={`demo-tab ${optimized ? 'inactive' : 'active'}`}
                  style={{ color: optimized ? '#00D48A' : '#FF4757',
                           background: optimized ? 'rgba(0,212,138,0.08)' : 'rgba(255,71,87,0.08)',
                           border: `1px solid ${optimized ? 'rgba(0,212,138,0.2)' : 'rgba(255,71,87,0.2)'}`,
                           padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>
                  {optimized ? 'OPTIMIZED' : 'PEAK LOAD'}
                </span>
              </div>
              <div className="zone-grid">
                {grid.map((v, i) => {
                  const { bg, glow } = heatColor(v)
                  return (
                    <div
                      key={i}
                      className="zone-cell"
                      title={`Zone ${i + 1}: ${Math.round(v)}% load`}
                      style={{
                        backgroundColor: bg,
                        boxShadow: glow !== 'none' ? `0 0 8px ${glow}` : 'none',
                      }}
                    />
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                {[
                  { col: '#FF4757', label: 'Critical (>80%)' },
                  { col: '#FF6B35', label: 'High (>60%)' },
                  { col: '#EAB308', label: 'Medium' },
                  { col: '#00D48A', label: 'Low' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: l.col }} />
                    <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 24h Demand Chart */}
            <div className="demo-panel">
              <div className="demo-panel-header">
                <h4>24-Hour Demand Forecast</h4>
                <span style={{ fontSize: 10, color: 'var(--c-muted)', fontFamily: 'JetBrains Mono' }}>kW load</span>
              </div>
              <div className="chart-bars">
                {data.map((v, i) => (
                  <div
                    key={i}
                    className="chart-bar"
                    style={{
                      height: `${(v / maxV) * 100}%`,
                      background: barColor(v, optimized),
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
              <div className="chart-labels">
                {HOURS.map(h => <span key={h} className="chart-label">{h}</span>)}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: optimized ? '#00D48A' : '#FF4757' }}>
                {optimized
                  ? '✓ Peak reduced from 96 kW → 72 kW by shifting demand to off-peak windows'
                  : '⚠ Evening spike at 8–9 PM — transformer at 96% capacity'}
              </div>
            </div>
          </div>

          {/* Right: Scheduling Recommendations */}
          <div className="demo-panel">
            <div className="demo-panel-header">
              <h4>AI Scheduling Recommendations</h4>
            </div>
            <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              {optimized
                ? 'Zone BTM_Z03 — AI found 3 optimal charging windows that reduce peak load while respecting ±3 hour user convenience window.'
                : 'Zone BTM_Z03 — Currently operating unmanaged. 94% of users charging 7–10 PM.'}
            </p>

            {optimized ? (
              <>
                {schedules.map((s, i) => (
                  <div className="sched-card" key={i} id={`sched-${i}`}>
                    <div className="sched-card-row">
                      <span className="sched-time" style={{ color: s.col }}>{s.time}</span>
                      <span className="sched-delta" style={{ color: s.col }}>{s.delta}</span>
                    </div>
                    <div className="sched-bar-wrap">
                      <div className="sched-bar" style={{ width: `${s.pct}%`, background: s.col }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 6 }}>
                      {s.pct}% grid headroom · Incentive eligible
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: 16, padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(0,212,138,0.06)', border: '1px solid rgba(0,212,138,0.15)',
                  fontSize: 12, color: '#00D48A', lineHeight: 1.6,
                }}>
                  Grid Load Balanced · Peak reduced by 23% · All sessions conserved
                </div>
              </>
            ) : (
              <div style={{
                padding: '40px 0', textAlign: 'center',
                color: 'var(--c-muted)', fontSize: 13,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⚡</div>
                Click toggle above to see AI recommendations
              </div>
            )}

            {/* Feeder capacity bar */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--c-muted)', marginBottom: 6 }}>
                <span>Feeder Capacity Used</span>
                <span style={{ color: optimized ? '#00D48A' : '#FF4757', fontWeight: 700 }}>
                  {optimized ? '61%' : '96%'}
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                <motion.div
                  animate={{ width: optimized ? '61%' : '96%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    height: 6, borderRadius: 3,
                    background: optimized
                      ? 'linear-gradient(90deg,#00D48A,#3B8EFF)'
                      : 'linear-gradient(90deg,#FF6B35,#FF4757)',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 5 }}>
                Safe threshold: &lt;80% · Feeder rated 120 kW
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
