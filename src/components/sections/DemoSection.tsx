import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BASE = [12,9,7,6,5,8,18,32,45,48,42,38,35,36,40,44,62,88,96,91,78,55,34,18]
const OPT  = [12,9,7,6,5,8,18,32,45,48,42,38,35,36,40,44,52,65,70,64,55,44,30,20]
const HRS  = ['12a','3a','6a','9a','12p','3p','6p','9p']

const makeGrid = (hot: boolean) =>
  [90,85,40,30,95,60,20,80,92,35,25,88,45,18,75,88,30,20,82,40,15,
   60,70,28,18,65,35,12,45,55,22,15,50,28,10].map(v =>
    hot ? v : Math.max(6, Math.round(v * 0.26))
  )

const cellBg = (v: number) => {
  if (v > 80) return { bg: '#FF4757', sh: 'rgba(255,71,87,0.55)' }
  if (v > 60) return { bg: '#FF6B35', sh: 'rgba(255,107,53,0.4)' }
  if (v > 35) return { bg: '#EAB308', sh: 'rgba(234,179,8,0.3)' }
  if (v > 15) return { bg: '#00E5A0', sh: 'rgba(0,229,160,0.25)' }
  return           { bg: '#1A2535',  sh: 'none' }
}

const barCol = (v: number, opt: boolean) =>
  opt ? '#00E5A0' : v > 80 ? '#FF4757' : v > 60 ? '#FF6B35' : '#EAB308'

const scheds = [
  { time: '10:30 PM – 12:30 AM', delta: '−28 kW', pct: 88, col: '#00E5A0' },
  { time: '11:00 PM – 1:00 AM',  delta: '−19 kW', pct: 72, col: '#00C8FF' },
  { time: '2:00 AM – 4:00 AM',   delta: '−14 kW', pct: 56, col: '#00E5A0' },
]

export default function DemoSection() {
  const [opt,  setOpt]  = useState(false)
  const [grid, setGrid] = useState(makeGrid(true))
  const [label, setLabel] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  // Auto-cycle with phase label
  useEffect(() => {
    timer.current = setTimeout(() => {
      const next = !opt
      setOpt(next)
      setGrid(makeGrid(!next))
      setLabel(next ? '✓ AI Optimization applied' : '⚠ Reverting to unmanaged')
      setTimeout(() => setLabel(''), 1800)
    }, 4000)
    return () => clearTimeout(timer.current)
  }, [opt])

  const data = opt ? OPT : BASE

  return (
    <section id="demo" style={{
      padding: '96px 0',
      background: 'linear-gradient(180deg, #080c12 0%, #0B0F14 100%)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 6%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <motion.span
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              display: 'inline-block', fontSize: 10.5, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '2px', color: '#00E5A0', marginBottom: 14,
            }}
          >
            Live Intelligence Demo
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{
              fontSize: 'clamp(28px,3.2vw,50px)', fontWeight: 800,
              letterSpacing: -2, lineHeight: 1.08, marginBottom: 14,
            }}
          >
            Watch AI Rebalance the Grid in Real Time
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
            style={{ fontSize: 15, color: '#8A9BB0', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}
          >
            Automatically cycles between unmanaged and AI-optimized states every 4 seconds.
            Toggle manually to explore.
          </motion.p>
        </div>

        {/* Toggle + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, justifyContent: 'center' }}>
          <button
            id="demo-toggle"
            className={`btn ${opt ? 'btn-green' : 'btn-outline'}`}
            style={{ minWidth: 220 }}
            onClick={() => {
              clearTimeout(timer.current)
              const next = !opt; setOpt(next); setGrid(makeGrid(!next))
            }}
          >
            {opt ? '✓ AI Optimized State' : '⚠ Unmanaged State'}
          </button>
          <AnimatePresence mode="wait">
            {label && (
              <motion.span
                key={label}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{ fontSize: 12, color: opt ? '#00E5A0' : '#FF4757', fontWeight: 600 }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Panels */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}
        >
          {/* Left col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Heatmap */}
            <div style={{
              background: '#0F1419', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>Zone Demand Heatmap · Bengaluru Wards</span>
                <motion.span
                  key={String(opt)}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: opt ? 'rgba(0,229,160,0.1)' : 'rgba(255,71,87,0.1)',
                    color: opt ? '#00E5A0' : '#FF4757',
                    border: `1px solid ${opt ? 'rgba(0,229,160,0.2)' : 'rgba(255,71,87,0.2)'}`,
                  }}
                >
                  {opt ? 'OPTIMIZED' : 'PEAK LOAD'}
                </motion.span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                {grid.map((v, i) => {
                  const { bg, sh } = cellBg(v)
                  return (
                    <div key={i} title={`Zone ${i+1}: ${Math.round(v)}%`}
                      style={{
                        aspectRatio: '1', borderRadius: 5,
                        backgroundColor: bg,
                        boxShadow: sh !== 'none' ? `0 0 7px ${sh}` : 'none',
                        transition: 'background-color 1.3s ease, box-shadow 1.3s ease',
                      }}
                    />
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {[['#FF4757','Critical >80%'],['#FF6B35','High >60%'],['#EAB308','Medium'],['#00E5A0','Low']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: 10, color: '#4A5568' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div style={{
              background: '#0F1419', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>24-Hour Demand Forecast</span>
                <span style={{ fontSize: 10, color: '#4A5568', fontVariantNumeric: 'tabular-nums' }}>kW · City Grid</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 76 }}>
                {data.map((v, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: '3px 3px 0 0', minHeight: 3,
                    height: `${(v/100)*100}%`,
                    background: barCol(v, opt),
                    opacity: 0.88,
                    transition: 'height 0.9s ease, background 0.9s ease',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                {HRS.map(h => <span key={h} style={{ fontSize: 8.5, color: '#3A4A5E', fontVariantNumeric: 'tabular-nums' }}>{h}</span>)}
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 600, color: opt ? '#00E5A0' : '#FF4757' }}>
                {opt ? '✓ Peak shifted 8 PM → 11 PM  ·  Saved 26 kW at feeder' : '⚠ 96 kW spike 8–9 PM  ·  Feeder at critical capacity'}
              </div>
            </div>
          </div>

          {/* Right: Scheduling */}
          <div style={{
            background: '#0F1419', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '24px',
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>AI Scheduling Engine</div>
            <p style={{ fontSize: 12.5, color: '#8A9BB0', marginBottom: 18, lineHeight: 1.65 }}>
              {opt
                ? 'Zone BTM_Z03 — 3 optimal windows found. LP optimizer shifts sessions within ±3h user preference.'
                : 'Zone BTM_Z03 — Unmanaged. 94% of sessions clustering at 7–10 PM peak window.'}
            </p>

            <AnimatePresence mode="wait">
              {opt ? (
                <motion.div key="opt"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
                >
                  {scheds.map((s, i) => (
                    <div key={i} style={{
                      background: '#141B24', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10, padding: '13px 14px', marginBottom: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: s.col, fontVariantNumeric: 'tabular-nums' }}>{s.time}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.col }}>{s.delta}</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                        <motion.div
                          animate={{ width: `${s.pct}%` }}
                          transition={{ duration: 1.1, ease: 'easeInOut' }}
                          style={{ height: 3, borderRadius: 2, background: s.col }}
                        />
                      </div>
                      <div style={{ fontSize: 10, color: '#3A4A5E', marginTop: 5 }}>{s.pct}% headroom · Incentive eligible</div>
                    </div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    style={{
                      marginTop: 14, padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)',
                      fontSize: 12, color: '#00E5A0', lineHeight: 1.6,
                    }}
                  >
                    Grid balanced · Sessions conserved · 0 user disruption
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="unopt"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ padding: '40px 0', textAlign: 'center', color: '#3A4A5E', fontSize: 13 }}
                >
                  <div style={{ fontSize: 34, marginBottom: 12 }}>⚡</div>
                  Enable AI mode to see scheduling recommendations
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feeder bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3A4A5E', marginBottom: 7 }}>
                <span>Feeder Capacity Used</span>
                <motion.span
                  key={String(opt)}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontWeight: 700, color: opt ? '#00E5A0' : '#FF4757' }}
                >
                  {opt ? '61%' : '96%'}
                </motion.span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <motion.div
                  animate={{ width: opt ? '61%' : '96%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    height: 5, borderRadius: 3,
                    background: opt
                      ? 'linear-gradient(90deg,#00E5A0,#00C8FF)'
                      : 'linear-gradient(90deg,#FF6B35,#FF4757)',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: '#3A4A5E', marginTop: 5 }}>Safe zone: &lt;80% · Rated 120 kW</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
