import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// CSS float keyframes injected once — runs on compositor thread, not JS
const FLOAT_CSS = `
@keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
`

const FLOATS = [
  { icon:'⚡', label:'Load Spike',       val:'+96%',      color:'#FF4757', x:'8%',  y:'18%', delay:0.15, anim:'floatA', dur:'3.4s' },
  { icon:'🔋', label:'Charging Active',  val:'247 EVs',   color:'#00E5A0', x:'80%', y:'13%', delay:0.25, anim:'floatB', dur:'4.0s' },
  { icon:'📊', label:'Demand Forecast',  val:'24h ahead', color:'#00C8FF', x:'86%', y:'52%', delay:0.35, anim:'floatC', dur:'3.2s' },
  { icon:'🔮', label:'AI Confidence',    val:'92%',       color:'#A78BFA', x:'5%',  y:'67%', delay:0.20, anim:'floatA', dur:'3.8s' },
  { icon:'🏙', label:'Zones Monitored',  val:'198',       color:'#F59E0B', x:'76%', y:'77%', delay:0.40, anim:'floatB', dur:'3.6s' },
  { icon:'📉', label:'Peak Reduced',     val:'−23 kW',    color:'#00E5A0', x:'13%', y:'42%', delay:0.30, anim:'floatC', dur:'4.2s' },
]


export default function Hero() {
  const vidRef      = useRef<HTMLVideoElement>(null)
  const [vidOp, setVidOp]   = useState(1)

  // Inject CSS float keyframes once
  useEffect(() => {
    if (document.getElementById('float-kf')) return
    const s = document.createElement('style')
    s.id = 'float-kf'; s.textContent = FLOAT_CSS
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    const vid = vidRef.current
    if (!vid) return
    vid.muted = true
    vid.playsInline = true
    vid.loop = false
    vid.preload = 'metadata'
    vid.play().catch(() => {})

    const onEnd = () => {
      // Hold 5s on last frame → fade → restart
      setTimeout(() => {
        setVidOp(0)
        setTimeout(() => {
          if (vidRef.current) { vidRef.current.currentTime = 0; vidRef.current.play() }
          setVidOp(1)
        }, 800)
      }, 5000)
    }

    vid.addEventListener('ended', onEnd)
    return () => vid.removeEventListener('ended', onEnd)
  }, [])

  return (
    <section id="hero" style={{
      position:'relative', width:'100%', height:'100vh',
      minHeight:700, overflow:'hidden', background:'#080c12',
    }}>
      {/* Video */}
      <video
        ref={vidRef}
        src="/hero.mp4"
        muted playsInline
        preload="auto"
        style={{
          position:'absolute', inset:0,
          width:'100%', height:'100%',
          objectFit:'cover',
          objectPosition:'center top',   
          opacity: vidOp,
          transition:'opacity 0.8s ease',
          // GPU layer — no repaints, slight scale to hide logo, subtle filter for quality
          transform:'scale(1.05) translateZ(0)',
          filter: 'contrast(1.05) saturate(1.05)',
          willChange:'opacity, transform, filter',
          zIndex:0,
        }}
      />

      {/* Gradient mask */}
      <div style={{
        position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
        background:`
          linear-gradient(to top,    rgba(8,12,18,1) 0%, rgba(8,12,18,0.65) 14%, transparent 36%),
          linear-gradient(to bottom, rgba(8,12,18,0.55) 0%, transparent 18%),
          linear-gradient(to right,  rgba(8,12,18,0.45) 0%, transparent 24%),
          linear-gradient(to left,   rgba(8,12,18,0.35) 0%, transparent 20%)
        `,
      }} />

      {/* Hard VEO logo kill — bottom-right corner */}
      <div style={{
        position:'absolute', bottom:0, right:0, zIndex:3, pointerEvents:'none',
        width:280, height:110,
        background:'linear-gradient(135deg, transparent 0%, rgba(8,12,18,1) 48%)',
      }} />

      {/* Grid lines — static, no animation */}
      <div style={{
        position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
        backgroundImage:`
          linear-gradient(rgba(0,229,160,0.022) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,160,0.022) 1px, transparent 1px)
        `,
        backgroundSize:'72px 72px',
        maskImage:'radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 80%)',
      }} />


            {/* Floating icons — CSS animation (compositor thread, no JS) */}
            {FLOATS.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity:0, scale:0.75 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay: f.delay, duration:0.5, ease:'easeOut' }}
                style={{
                  position:'absolute', left:f.x, top:f.y, zIndex:5, pointerEvents:'none',
                  // CSS float animation — no JS, runs on GPU
                  animation:`${f.anim} ${f.dur} ease-in-out infinite`,
                  animationDelay:`${i * 0.5}s`,
                  willChange:'transform',
                }}
              >
                <div style={{
                  background:'rgba(8,12,18,0.82)',
                  border:`1px solid ${f.color}28`,
                  borderRadius:12, padding:'9px 13px',
                  display:'flex', alignItems:'center', gap:9,
                  // Minimal backdrop-filter — only where it matters
                  backdropFilter:'blur(12px)',
                  WebkitBackdropFilter:'blur(12px)',
                }}>
                  <span style={{ fontSize:18 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:f.color, letterSpacing:-0.4, fontVariantNumeric:'tabular-nums' }}>{f.val}</div>
                    <div style={{ fontSize:10, color:'#5A6B80', marginTop:1 }}>{f.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Central content */}
            <motion.div
              initial="hidden" animate="show"
              variants={{ show:{transition:{staggerChildren:0.1,delayChildren:0.04}} }}
              style={{
                position:'absolute', inset:0, zIndex:6,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                padding:'0 6%', textAlign:'center',
              }}
            >
              <motion.h1
                variants={{ hidden:{opacity:0,y:30}, show:{opacity:1,y:0,transition:{duration:0.65,ease:'easeOut'}} }}
                id="hero-title"
                style={{
                  fontSize:'clamp(38px,5.2vw,74px)',
                  fontWeight:900, letterSpacing:'-3px',
                  lineHeight:1.05, marginBottom:18, maxWidth:880,
                }}
              >
                Optimize EV Charging.{' '}
                <span style={{
                  background:'linear-gradient(120deg,#00E5A0,#00C8FF)',
                  WebkitBackgroundClip:'text', backgroundClip:'text',
                  WebkitTextFillColor:'transparent',
                }}>
                  Eliminate Grid Stress.
                </span>
              </motion.h1>

              <motion.p
                variants={{ hidden:{opacity:0,y:20}, show:{opacity:1,y:0,transition:{duration:0.6,ease:'easeOut'}} }}
                id="hero-sub"
                style={{
                  fontSize:'clamp(15px,1.4vw,17.5px)', color:'rgba(255,255,255,0.5)',
                  lineHeight:1.72, maxWidth:520, marginBottom:32,
                }}
              >
                AI-powered demand prediction, scheduling, and infrastructure planning
                for modern cities — zero hardware changes required.
              </motion.p>

              <motion.div
                variants={{ hidden:{opacity:0,y:16}, show:{opacity:1,y:0,transition:{duration:0.55,ease:'easeOut'}} }}
                style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', marginBottom:48 }}
              >
                <a className="btn btn-green"   href="#demo" id="hero-sim-btn">View Live Simulation →</a>
                <a className="btn btn-outline" href="#cta"  id="hero-demo-btn">Request Demo</a>
              </motion.div>

              {/* Stats bar */}
              <motion.div
                variants={{ hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{duration:0.55,ease:'easeOut'}} }}
                style={{
                  display:'flex',
                  background:'rgba(8,12,18,0.7)',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:12, overflow:'hidden',
                }}
              >
                {[
                  {num:'↓25%',label:'Peak Load Reduction'},
                  {num:'↑30%',label:'Grid Efficiency'},
                  {num:'≤15%',label:'Forecast Error'},
                  {num:'0',   label:'Hardware Changes'},
                ].map((s,i) => (
                  <div key={s.label} id={`hstat-${i}`} style={{
                    padding:'14px 26px', textAlign:'center',
                    borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <div style={{fontSize:19,fontWeight:800,letterSpacing:-0.5,color:'#fff',lineHeight:1}}>{s.num}</div>
                    <div style={{fontSize:9.5,color:'#4A5568',textTransform:'uppercase',letterSpacing:'0.7px',marginTop:4}}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Scroll hint — CSS animation */}
            <motion.div
              initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.9}}
              style={{
                position:'absolute', bottom:26, left:'50%', transform:'translateX(-50%)',
                zIndex:6, display:'flex', flexDirection:'column', alignItems:'center', gap:5,
              }}
            >
              <div style={{
                width:20, height:30,
                border:'1.5px solid rgba(255,255,255,0.14)',
                borderRadius:10, display:'flex', justifyContent:'center', paddingTop:5,
              }}>
                <div style={{
                  width:3, height:6, borderRadius:2,
                  background:'rgba(0,229,160,0.7)',
                  animation:'floatB 1.6s ease-in-out infinite',
                }} />
              </div>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.2)',textTransform:'uppercase',letterSpacing:'1.5px'}}>Scroll</span>
            </motion.div>

    </section>
  )
}
