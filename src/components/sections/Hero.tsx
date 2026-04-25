import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Enhanced float animations
const FLOAT_CSS = `
@keyframes floatA { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(2deg)} }
@keyframes floatB { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(-2deg)} }
@keyframes floatC { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-15px) rotate(1deg)} }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
`

const FLOATS = [
  { icon:'⚡', label:'Load Spike', val:'+96%', color:'#FF4757', x:'10%', y:'15%', delay:0.1, anim:'floatA', dur:'3s', size: 1.2 },
  { icon:'🔋', label:'EV Charging', val:'247 units', color:'#00E5A0', x:'85%', y:'12%', delay:0.2, anim:'floatB', dur:'3.5s', size: 1 },
  { icon:'📊', label:'AI Forecast', val:'24h ahead', color:'#00C8FF', x:'88%', y:'55%', delay:0.3, anim:'floatC', dur:'2.8s', size: 1.1 },
  { icon:'🔮', label:'Accuracy', val:'92%', color:'#A78BFA', x:'8%', y:'70%', delay:0.15, anim:'floatA', dur:'3.2s', size: 0.9 },
  { icon:'🏙', label:'Zones', val:'198', color:'#F59E0B', x:'80%', y:'80%', delay:0.35, anim:'floatB', dur:'3.8s', size: 1.3 },
  { icon:'📉', label:'Peak Reduced', val:'−23 kW', color:'#00E5A0', x:'15%', y:'45%', delay:0.25, anim:'floatC', dur:'4s', size: 1 },
]

export default function Hero() {
  const vidRef = useRef<HTMLVideoElement>(null)
  const [vidOp, setVidOp] = useState(1)
  const [heroVisible, setHeroVisible] = useState(false)
  const { token } = useAuth()

  // Inject CSS
  useEffect(() => {
    if (document.getElementById('float-kf')) return
    const s = document.createElement('style')
    s.id = 'float-kf'; s.textContent = FLOAT_CSS
    document.head.appendChild(s)
  }, [])

  // Video handling
  useEffect(() => {
    const vid = vidRef.current
    if (!vid) return
    vid.muted = true
    vid.playsInline = true
    vid.loop = false
    vid.preload = 'metadata'
    vid.play().catch(() => {})

    const onEnd = () => {
      setTimeout(() => {
        setVidOp(0)
        setTimeout(() => {
          if (vidRef.current) { vidRef.current.currentTime = 0; vidRef.current.play() }
          setVidOp(1)
        }, 1000)
      }, 6000)
    }

    vid.addEventListener('ended', onEnd)
    return () => vid.removeEventListener('ended', onEnd)
  }, [])

  // Hero visibility
  useEffect(() => {
    setHeroVisible(true)
  }, [])

  return (
    <section id="hero" style={{
      position:'relative', width:'100%', height:'100vh',
      minHeight:750, overflow:'hidden', background:'#080c12',
    }}>
      {/* Video */}
      <motion.video
        ref={vidRef}
        src="/hero.mp4"
        muted playsInline
        preload="metadata"
        style={{
          position:'absolute', inset:0,
          width:'100%', height:'100%',
          objectFit:'cover',
          objectPosition:'center top',
          opacity: vidOp,
          transition:'opacity 1.2s ease',
          transform:'scale(1.08) translateZ(0)',
          filter: 'contrast(1.08) saturate(1.1) brightness(1.05)',
          willChange:'opacity, transform, filter',
          zIndex:0,
        }}
      />

      {/* Enhanced gradient mask */}
      <div style={{
        position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
        background:`
          linear-gradient(to top, rgba(8,12,18,1) 0%, rgba(8,12,18,0.7) 12%, transparent 32%),
          linear-gradient(to bottom, rgba(8,12,18,0.6) 0%, transparent 16%),
          linear-gradient(to right, rgba(8,12,18,0.5) 0%, transparent 22%),
          linear-gradient(to left, rgba(8,12,18,0.4) 0%, transparent 18%),
          radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(8,12,18,0.3) 100%)
        `,
      }} />

      {/* Animated grid overlay */}
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          backgroundImage:`
            linear-gradient(rgba(0,229,160,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,160,0.08) 1px, transparent 1px)
          `,
          backgroundSize:'80px 80px',
          maskImage:'radial-gradient(ellipse 100% 100% at 50% 50%, black 15%, transparent 85%)',
        }}
      />

      {/* Hard logo kill */}
      <div style={{
        position:'absolute', bottom:0, right:0, zIndex:3, pointerEvents:'none',
        width:300, height:120,
        background:'linear-gradient(135deg, transparent 0%, rgba(8,12,18,1) 50%)',
      }} />

      {/* Enhanced floating elements */}
      {FLOATS.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity:0, scale:0, rotate: -10 }}
          animate={heroVisible ? { opacity:1, scale: f.size, rotate: 0 } : {}}
          transition={{
            delay: f.delay,
            duration: 0.8,
            type: 'spring',
            stiffness: 200
          }}
          style={{
            position:'absolute', left:f.x, top:f.y, zIndex:5, pointerEvents:'none',
            animation:`${f.anim} ${f.dur} ease-in-out infinite`,
            animationDelay:`${i * 0.2}s`,
            willChange:'transform',
          }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            style={{
              background:'rgba(8,12,18,0.85)',
              border:`1px solid ${f.color}30`,
              borderRadius:14, padding:'12px 16px',
              display:'flex', alignItems:'center', gap:10,
              backdropFilter:'blur(16px)',
              WebkitBackdropFilter:'blur(16px)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 16px ${f.color}20`,
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
              style={{ fontSize:20 }}
            >
              {f.icon}
            </motion.span>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:f.color, letterSpacing:-0.4, fontVariantNumeric:'tabular-nums' }}>{f.val}</div>
              <div style={{ fontSize:11, color:'#5A6B80', marginTop:2 }}>{f.label}</div>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Central content with enhanced animations */}
      <motion.div
        initial="hidden"
        animate={heroVisible ? "show" : "hidden"}
        variants={{
          show: {
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.2
            }
          }
        }}
        style={{
          position:'absolute', inset:0, zIndex:6,
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'0 6%', textAlign:'center',
        }}
      >
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 50, scale: 0.9 },
            show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: 'easeOut' } }
          }}
          id="hero-title"
          style={{
            fontSize:'clamp(42px,6vw,80px)',
            fontWeight:900, letterSpacing:'-4px',
            lineHeight:1.02, marginBottom:24, maxWidth:900,
          }}
        >
          Optimize EV Charging.{' '}
          <motion.span
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background:'linear-gradient(120deg,#00E5A0,#00C8FF,#F59E0B,#00E5A0)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip:'text', backgroundClip:'text',
              WebkitTextFillColor:'transparent',
            }}
          >
            Eliminate Grid Stress.
          </motion.span>
        </motion.h1>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 30 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
          }}
          id="hero-sub"
          style={{
            fontSize:'clamp(16px,1.6vw,19px)', color:'rgba(255,255,255,0.6)',
            lineHeight:1.7, maxWidth:550, marginBottom:40,
          }}
        >
          AI-powered demand prediction, scheduling, and infrastructure planning
          for modern cities — zero hardware changes required.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 25 },
            show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
          }}
          style={{ display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center', marginBottom:60 }}
        >
          <motion.a
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-green"
            href={token ? '/dashboard' : '/login?mode=login'}
            id="hero-sim-btn"
            style={{
              padding: '18px 36px', fontSize: 16, fontWeight: 700,
              boxShadow: '0 0 40px rgba(0,229,160,0.4)'
            }}
          >
            {token ? 'Open Dashboard →' : 'Login to Dashboard →'}
          </motion.a>
          <motion.div
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'inline-flex'
            }}
          >
            <Link
              className="btn btn-outline"
              to={token ? '/dashboard' : '/login?mode=signup'}
              id="hero-demo-btn"
              style={{
                padding: '18px 36px', fontSize: 16,
                border: '2px solid rgba(255,255,255,0.25)'
              }}
            >
              {token ? 'Review Backend Modules' : 'Create Account'}
            </Link>
          </motion.div>
        </motion.div>

        {/* Enhanced stats bar */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
          }}
          style={{
            display:'flex', gap: 2,
            background:'rgba(8,12,18,0.8)',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:16, overflow:'hidden',
            backdropFilter:'blur(20px)',
            WebkitBackdropFilter:'blur(20px)',
          }}
        >
          {[
            {num:'↓25%',label:'Peak Reduction'},
            {num:'↑85%',label:'Forecast Accuracy'},
            {num:'≤15%',label:'Error Margin'},
            {num:'0',label:'Hardware Changes'},
          ].map((s,i) => (
            <motion.div
              key={s.label}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              style={{
                padding:'18px 28px', textAlign:'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                transition: 'background-color 0.3s ease'
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                style={{
                  fontSize:20, fontWeight:800, letterSpacing:-0.5,
                  color:'#fff', lineHeight:1, marginBottom:6
                }}
              >
                {s.num}
              </motion.div>
              <div style={{
                fontSize:10, color:'#4A5568', textTransform:'uppercase',
                letterSpacing:'0.8px', lineHeight:1.2
              }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Enhanced scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{
          position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)',
          zIndex:6, display:'flex', flexDirection:'column', alignItems:'center', gap:8,
        }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width:22, height:32,
            border:'2px solid rgba(255,255,255,0.2)',
            borderRadius:12, display:'flex', justifyContent:'center', paddingTop:6,
          }}
        >
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            style={{
              width:4, height:8, borderRadius:2,
              background:'linear-gradient(180deg,#00E5A0,#00C8FF)',
              boxShadow: '0 0 8px rgba(0,229,160,0.6)'
            }}
          />
        </motion.div>
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontSize:10, color:'rgba(255,255,255,0.3)',
            textTransform:'uppercase', letterSpacing:'1.5px'
          }}
        >
          Scroll to Explore
        </motion.span>
      </motion.div>

    </section>
  )
}
