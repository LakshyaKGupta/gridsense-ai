import { useEffect, useRef, useState } from 'react'

function AnimCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const elRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let n = 0
      const tick = () => {
        n += to / 55
        if (n >= to) { setVal(to); return }
        setVal(Math.floor(n)); requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    if (elRef.current) obs.observe(elRef.current)
    return () => obs.disconnect()
  }, [to])
  return <div ref={elRef} className="mc-num">{val}{suffix}</div>
}

const ZONES = [
  { rank: '01', name: 'BTM Layout (Zone 3)', area: 'South Bengaluru', score: 94, growth: '+38% 6-mo', status: 'crit', statusLabel: 'Critical' },
  { rank: '02', name: 'Whitefield (Zone 12)', area: 'East Bengaluru', score: 87, growth: '+52% 6-mo', status: 'crit', statusLabel: 'Critical' },
  { rank: '03', name: 'Koramangala (Zone 7)', area: 'South Bengaluru', score: 81, growth: '+29% 6-mo', status: 'high', statusLabel: 'High' },
  { rank: '04', name: 'Hebbal (Zone 22)', area: 'North Bengaluru', score: 74, growth: '+44% 6-mo', status: 'high', statusLabel: 'High' },
  { rank: '05', name: 'Electronic City (Z18)', area: 'South-East', score: 68, growth: '+61% 6-mo', status: 'med', statusLabel: 'Emerging' },
]

export default function StatsZones() {
  return (
    <>
      {/* Metrics */}
      <section id="metrics" style={{ padding: '90px 0', borderTop: '1px solid var(--c-border)' }}>
        <div className="wrap">
          <span className="sec-label">Performance Targets</span>
          <h2 className="sec-title">Built to Hit<br />Verifiable Numbers.</h2>
          <p className="sec-body">
            Every output is measurable via backtesting, simulation, or expert validation —
            not projections on a slide deck.
          </p>
          <div className="metrics-grid">
            {[
              { to: 15, suffix: '%', label: 'Max Forecast Error', sub: 'MAPE target' },
              { to: 20, suffix: '%+', label: 'Peak Load Reduction', sub: 'vs. unmanaged' },
              { to: 90, suffix: '%', label: 'Peak Hour Detection', sub: 'scheduling accuracy' },
              { to: 500, suffix: 'ms', label: 'Forecast Latency', sub: 'per zone, real-time' },
              { to: 198, suffix: '', label: 'BBMP Wards', sub: 'zone coverage' },
            ].map((m, i) => (
              <div className="mc" key={i} id={`mc-${i}`}>
                <AnimCounter to={m.to} suffix={m.suffix} />
                <div className="mc-label">{m.label}</div>
                <div className="mc-sub">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zone Priority Rankings */}
      <section id="zones" style={{ padding: '90px 0' }}>
        <div className="wrap">
          <span className="sec-label">Infrastructure Intelligence</span>
          <h2 className="sec-title">Ranked Priority Zones<br />for New Infrastructure</h2>
          <p className="sec-body">
            Spatial clustering identifies where new charging stations deliver maximum impact —
            ranked by demand growth, grid headroom, and accessibility score.
          </p>
          <div className="zones-list">
            {ZONES.map((z, i) => (
              <div className="zone-row" key={i} id={`zone-row-${i}`}
                style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="zone-rank">#{z.rank}</div>
                <div className="zone-info">
                  <h4>{z.name}</h4>
                  <p>{z.area} · Demand growth: <strong style={{ color: '#00D48A' }}>{z.growth}</strong></p>
                </div>
                <div className="zone-score-wrap">
                  <div className="zone-score" style={{
                    color: z.score > 85 ? '#FF4757' : z.score > 75 ? '#FF6B35' : '#EAB308'
                  }}>{z.score}</div>
                  <div className="zone-score-label">Priority Score</div>
                </div>
                <span className={`zone-status ${z.status}`}>{z.statusLabel}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: 'var(--c-muted)' }}>
            Score = weighted composite of demand (35%) · grid headroom (30%) · accessibility (20%) · land (15%)
          </p>
        </div>
      </section>
    </>
  )
}
