import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FLOATS = [
  { icon:'⚡', label:'Load Spike',       val:'+96%',      color:'#FF4757', x:'8%',  y:'18%', delay:0.15 },
  { icon:'🔋', label:'Charging Active',  val:'247 EVs',   color:'#00E5A0', x:'82%', y:'14%', delay:0.25 },
  { icon:'📊', label:'Demand Forecast',  val:'24h ahead', color:'#00C8FF', x:'88%', y:'52%', delay:0.35 },
  { icon:'🔮', label:'AI Confidence',    val:'92%',       color:'#A78BFA', x:'6%',  y:'68%', delay:0.20 },
  { icon:'🏙', label:'Zones Monitored',  val:'198',       color:'#F59E0B', x:'78%', y:'78%', delay:0.40 },
  { icon:'📉', label:'Peak Reduced',     val:'−23 kW',    color:'#00E5A0', x:'14%', y:'42%', delay:0.30 },
]

interface Props { onReady: () => void }

export default function Hero({ onReady }: Props) {
  const vidRef   = useRef<HTMLVideoElement>(null)
  const [vidOpacity, setVidOpacity] = useState(1)
  // revealed = false until the FIRST play-through finishes
  const [revealed, setRevealed] = useState(false)
  const firstEnd  = useRef(true)

  useEffect(() => {
    const vid = vidRef.current
    if (!vid) return
    vid.muted = true
    vid.playsInline = true
    vid.loop = false
    vid.play().catch(() => {})

    const onEnd = () => {
      if (firstEnd.current) {
        // First completion → reveal everything
        firstEnd.current = false
        setRevealed(true)
        onReady()
        // Then start the hold → fade → restart cycle for subsequent loops
        scheduleRestart(vid)
      } else {
        scheduleRestart(vid)
      }
    }

    vid.addEventListener('ended', onEnd)
    return () => vid.removeEventListener('ended', onEnd)
  }, [onReady])

  function scheduleRestart(vid: HTMLVideoElement) {
    setTimeout(() => {
      setVidOpacity(0)
      setTimeout(() => {
        vid.currentTime = 0
        vid.play()
        setVidOpacity(1)
      }, 900)
    }, 5000)
  }

  const revealVariants = {
    hidden: { opacity: 0, y: 28 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
  }
  const stagger = { show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }

  return (
    <section id="hero" style={{
      position:'relative', width:'100%', height:'100vh',
      minHeight:700, overflow:'hidden', background:'#080c12',
    }}>
      {/* Full-screen video */}
      <video
        ref={vidRef}
        src="/hero.mp4"
        muted playsInline
        style={{
          position:'absolute', inset:0,
          width:'100%', height:'100%',
          objectFit:'cover', objectPosition:'center top',
          transform:'scale(1.14)',
          filter:'contrast(1.06) saturate(1.12)',
          opacity: vidOpacity,
          transition:'opacity 0.9s ease',
          zIndex:0,
        }}
      />

      {/* Gradient mask */}
      <div style={{
        position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
        background:`
          linear-gradient(to top,    rgba(8,12,18,1) 0%, rgba(8,12,18,0.65) 14%, transparent 36%),
          linear-gradient(to bottom, rgba(8,12,18,0.6) 0%, transparent 20%),
          linear-gradient(to right,  rgba(8,12,18,0.5) 0%, transparent 26%),
          linear-gradient(to left,   rgba(8,12,18,0.4) 0%, transparent 22%)
        `,
      }} />

      {/* VEO logo kill */}
      <div style={{
        position:'absolute', bottom:0, right:0, zIndex:3,
        width:260, height:100, pointerEvents:'none',
        background:'linear-gradient(135deg, transparent 0%, rgba(8,12,18,1) 52%)',
      }} />

      {/* Grid lines (subtle, show always) */}
      <div style={{
        position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
        backgroundImage:`
          linear-gradient(rgba(0,229,160,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,160,0.025) 1px, transparent 1px)
        `,
        backgroundSize:'72px 72px',
        maskImage:'radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 80%)',
      }} />

      {/* ── Everything below is hidden until video finishes ── */}
      <AnimatePresence>
        {revealed && (
          <>
            {/* Floating icons */}
            {FLOATS.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity:0, scale:0.7, y:16 }}
                animate={{ opacity:1, scale:1,   y:0   }}
                transition={{ delay: f.delay, duration:0.55, ease:[0.16,1,0.3,1] }}
                style={{
                  position:'absolute', left:f.x, top:f.y,
                  zIndex:5, pointerEvents:'none',
                }}
              >
                <motion.div
                  animate={{ y:[0,-8,0] }}
                  transition={{ duration:3.2 + i*0.4, repeat:Infinity, ease:'easeInOut', delay:i*0.3 }}
                  style={{
                    background:'rgba(8,12,18,0.80)',
                    border:`1px solid ${f.color}30`,
                    backdropFilter:'blur(20px)',
                    borderRadius:12, padding:'10px 14px',
                    display:'flex', alignItems:'center', gap:10,
                    boxShadow:`0 0 24px ${f.color}18`,
                  }}
                >
                  <span style={{ fontSize:20 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:f.color, letterSpacing:-0.4, fontVariantNumeric:'tabular-nums' }}>{f.val}</div>
                    <div style={{ fontSize:10, color:'#5A6B80', marginTop:2 }}>{f.label}</div>
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {/* Central content */}
            <motion.div
              variants={stagger} initial="hidden" animate="show"
              style={{
                position:'absolute', inset:0, zIndex:6,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                padding:'0 6%', textAlign:'center',
              }}
            >
              <motion.h1 variants={revealVariants} id="hero-title" style={{
                fontSize:'clamp(38px,5.2vw,76px)',
                fontWeight:900, letterSpacing:'-3px',
                lineHeight:1.04, marginBottom:20, maxWidth:900,
              }}>
                Optimize EV Charging.{' '}
                <span style={{
                  background:'linear-gradient(120deg,#00E5A0,#00C8FF)',
                  WebkitBackgroundClip:'text', backgroundClip:'text',
                  WebkitTextFillColor:'transparent',
                }}>
                  Eliminate Grid Stress.
                </span>
              </motion.h1>

              <motion.p variants={revealVariants} id="hero-sub" style={{
                fontSize:'clamp(15px,1.5vw,18px)', color:'rgba(255,255,255,0.52)',
                lineHeight:1.7, maxWidth:540, marginBottom:34,
              }}>
                AI-powered demand prediction, scheduling, and infrastructure planning
                for modern cities — zero hardware changes required.
              </motion.p>

              <motion.div variants={revealVariants} style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:52 }}>
                <a className="btn btn-green"   href="#demo" id="hero-sim-btn">View Live Simulation →</a>
                <a className="btn btn-outline" href="#cta"  id="hero-demo-btn">Request Demo</a>
              </motion.div>

              {/* Stats bar */}
              <motion.div variants={revealVariants} style={{
                display:'flex', gap:0,
                background:'rgba(8,12,18,0.65)',
                border:'1px solid rgba(255,255,255,0.08)',
                backdropFilter:'blur(24px)',
                borderRadius:14, overflow:'hidden',
              }}>
                {[
                  { num:'↓25%', label:'Peak Load Reduction' },
                  { num:'↑30%', label:'Grid Efficiency'      },
                  { num:'≤15%', label:'Forecast Error'       },
                  { num:'0',    label:'Hardware Changes'     },
                ].map((s, i) => (
                  <div key={s.label} id={`hstat-${i}`} style={{
                    padding:'16px 28px', textAlign:'center',
                    borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <div style={{ fontSize:20, fontWeight:800, letterSpacing:-0.6, color:'#fff', lineHeight:1 }}>{s.num}</div>
                    <div style={{ fontSize:10, color:'#4A5568', textTransform:'uppercase', letterSpacing:'0.7px', marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Scroll hint */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
              style={{
                position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)',
                zIndex:6, display:'flex', flexDirection:'column', alignItems:'center', gap:6,
              }}
            >
              <motion.div
                animate={{ y:[0,6,0] }} transition={{ duration:1.6, repeat:Infinity }}
                style={{ width:20, height:30, border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:10, display:'flex', justifyContent:'center', paddingTop:5 }}
              >
                <motion.div
                  animate={{ y:[0,8,0] }} transition={{ duration:1.6, repeat:Infinity }}
                  style={{ width:3, height:6, borderRadius:2, background:'rgba(0,229,160,0.7)' }}
                />
              </motion.div>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.22)', textTransform:'uppercase', letterSpacing:'1.5px' }}>Scroll</span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
