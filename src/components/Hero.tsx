import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const f = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const st = { show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }

export default function Hero() {
  const vidRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'playing'|'hold'|'fade'>('playing')
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const vid = vidRef.current
    if (!vid) return
    vid.muted = true; vid.playsInline = true; vid.loop = false
    vid.play().catch(() => {})

    const onEnd = () => {
      setPhase('hold')
      setTimeout(() => {
        setPhase('fade'); setOpacity(0)
        setTimeout(() => {
          if (vid) { vid.currentTime = 0; vid.play() }
          setOpacity(1); setPhase('playing')
        }, 900)
      }, 5000)
    }

    vid.addEventListener('ended', onEnd)
    return () => vid.removeEventListener('ended', onEnd)
  }, [])

  return (
    <section className="hero" id="hero">
      {/* ── Right: video panel ── */}
      <div className="hero-right">
        <div className="hero-vid-wrap">
          <video
            ref={vidRef}
            src="/hero.mp4"
            muted playsInline
            style={{ opacity, transition: 'opacity 0.9s ease' }}
          />
        </div>
        <div className="hero-vid-mask" />
        <div className="hero-vid-logo-kill" />

        {/* Floating chips */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="hero-chip"
          style={{ top: '28%', right: '8%' }}
        >
          <div className="hero-chip-dot" style={{ background: '#FF4757', boxShadow: '0 0 8px #FF4757' }} />
          <div>
            <div className="hero-chip-val" style={{ color: '#FF4757' }}>96% Load</div>
            <div className="hero-chip-label">BTM Zone · 8 PM Peak</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="hero-chip"
          style={{ top: '48%', right: '6%' }}
        >
          <div className="hero-chip-dot" style={{ background: '#00E5A0', boxShadow: '0 0 8px #00E5A0' }} />
          <div>
            <div className="hero-chip-val" style={{ color: '#00E5A0' }}>−23 kW</div>
            <div className="hero-chip-label">AI Optimization Active</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="hero-chip"
          style={{ top: '68%', right: '10%' }}
        >
          <div className="hero-chip-dot" style={{ background: '#00C8FF', boxShadow: '0 0 8px #00C8FF' }} />
          <div>
            <div className="hero-chip-val" style={{ color: '#00C8FF' }}>85%+</div>
            <div className="hero-chip-label">Forecast Accuracy</div>
          </div>
        </motion.div>
      </div>

      {/* ── Left: copy ── */}
      <motion.div
        className="hero-left"
        variants={st} initial="hidden" animate="show"
      >
        <motion.div variants={f} className="hero-kicker">
          <span className="pdot" />
          AI-Powered Grid Intelligence
        </motion.div>

        <motion.h1 variants={f} className="hero-h1" id="hero-title">
          Optimize EV Charging.<br />
          <span className="gr">Eliminate Grid Stress.</span>
        </motion.h1>

        <motion.p variants={f} className="hero-sub" id="hero-sub">
          AI-powered demand prediction, scheduling, and infrastructure
          planning for modern cities. Zero hardware changes required.
        </motion.p>

        <motion.div variants={f} className="hero-btns">
          <a className="btn btn-green" href="#demo" id="hero-sim-btn">
            View Live Simulation →
          </a>
          <a className="btn btn-outline" href="#cta" id="hero-demo-btn">
            Request Demo
          </a>
        </motion.div>

        <motion.div variants={f} className="hero-metrics">
          {[
            { num: '↓25%',  label: 'Peak Load' },
            { num: '↑30%',  label: 'Grid Efficiency' },
            { num: '≤15%',  label: 'Forecast Error' },
            { num: '0',     label: 'Hardware Changes' },
          ].map(m => (
            <div key={m.label} id={`hm-${m.label.replace(/\s/g,'-')}`}>
              <div className="hm-num">{m.num}</div>
              <div className="hm-label">{m.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
