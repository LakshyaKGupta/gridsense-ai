import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function Counter({ to, suffix = '' }: { to: number; suffix: string }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView.current) {
          inView.current = true
          let n = 0
          const tick = () => {
            n += to / 60
            if (n >= to) { setV(to); return }
            setV(Math.floor(n))
            requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])

  return <div ref={ref} className="mc-num">{v}{suffix}</div>
}

export default function ImpactMetrics() {
  return (
    <section id="metrics" style={{
      padding: '120px 0',
      background: 'linear-gradient(135deg, #080c12 0%, #0B0F14 50%, #080c12 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Animated background particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 4, height: 4,
              background: '#00E5A0',
              borderRadius: '50%',
              boxShadow: '0 0 10px #00E5A0'
            }}
          />
        ))}
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 7%', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: 80 }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-block', fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '2px', color: '#F59E0B', marginBottom: 16,
            }}
          >
            Proven Results
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 'clamp(32px,4vw,56px)', fontWeight: 900,
              letterSpacing: -3, lineHeight: 1.05, marginBottom: 20,
            }}
          >
            Numbers That<br />
            <span style={{ background: 'linear-gradient(120deg,#F59E0B,#FF6B35)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Matter to Operators
            </span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40 }}
        >
          {[
            { to: 25, suffix: '%', label: 'Peak Load Reduction', color: '#00E5A0', icon: '📉' },
            { to: 85, suffix: '%', label: 'Forecast Accuracy', color: '#00C8FF', icon: '🎯' },
            { to: 40, suffix: '%', label: 'Better Utilization', color: '#F59E0B', icon: '⚡' },
            { to: 198, suffix: '', label: 'Zones Covered', color: '#A78BFA', icon: '🗺' },
          ].map((m, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 50, scale: 0.8 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200 } }
              }}
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                background: '#0F1419', border: `1px solid ${m.color}20`,
                borderRadius: 20, padding: '40px 32px', textAlign: 'center',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 48, marginBottom: 20 }}
              >
                {m.icon}
              </motion.div>
              <Counter to={m.to} suffix={m.suffix} />
              <div style={{ fontSize: 16, color: '#8A9BB0', marginTop: 12 }}>{m.label}</div>
              <motion.div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
                  background: `linear-gradient(90deg, transparent, ${m.color}, transparent)`
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}