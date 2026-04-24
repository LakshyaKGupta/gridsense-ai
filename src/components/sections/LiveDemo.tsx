import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { memo } from 'react'

const makeGrid = (hot: boolean) =>
  [90,85,40,30,95,60,20,80,92,35,25,88,45,18,75,88,30,20,82,40,15,
   60,70,28,18,65,35,12,45,55,22,15,50,28,10].map(v =>
    hot ? v : Math.max(6, Math.round(v * 0.26))
  )

const cellBg = (v: number) => {
  if (v > 80) return { bg: '#FF4757', sh: 'rgba(255,71,87,0.8)' }
  if (v > 60) return { bg: '#FF6B35', sh: 'rgba(255,107,53,0.6)' }
  if (v > 35) return { bg: '#EAB308', sh: 'rgba(234,179,8,0.4)' }
  if (v > 15) return { bg: '#00E5A0', sh: 'rgba(0,229,160,0.4)' }
  return { bg: '#1A2535', sh: 'none' }
}

function LiveDemo() {
  const [opt, setOpt] = useState(false)
  const [grid, setGrid] = useState(makeGrid(true))
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timer.current = setTimeout(() => {
      const next = !opt
      setOpt(next)
      setGrid(makeGrid(!next))
    }, 6000)
    return () => clearTimeout(timer.current)
  }, [opt])

  return (
    <section id="demo" style={{
      padding: '120px 0',
      background: 'linear-gradient(180deg, #0B0F14 0%, #080c12 100%)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 6%' }}>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-block', fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '2px', color: '#00E5A0', marginBottom: 16,
            }}
          >
            Live Intelligence
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
            Watch AI Transform<br />
            <span style={{ color: opt ? '#00E5A0' : '#FF4757' }}>
              {opt ? 'Optimized' : 'Chaotic'} Grid
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 18, color: '#8A9BB0', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}
          >
            Real-time simulation cycles between unmanaged chaos and AI optimization every 6 seconds.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40 }}
        >
          {/* Heatmap */}
          <motion.div
            animate={{ scale: opt ? [1, 1.02, 1] : [1, 0.98, 1] }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{
              background: '#0F1419', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '32px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Zone Demand Heatmap</span>
              <motion.span
                key={String(opt)}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: opt ? 'rgba(0,229,160,0.1)' : 'rgba(255,71,87,0.1)',
                  color: opt ? '#00E5A0' : '#FF4757',
                  border: `1px solid ${opt ? 'rgba(0,229,160,0.2)' : 'rgba(255,71,87,0.2)'}`,
                }}
              >
                {opt ? 'AI OPTIMIZED' : 'UNMANAGED CHAOS'}
              </motion.span>
            </div>
            <motion.div
              animate={{ rotate: opt ? [0, 1, -1, 0] : [0, -2, 2, 0] }}
              transition={{ duration: 0.5 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}
            >
              {grid.map((v, i) => {
                const { bg, sh } = cellBg(v)
                return (
                  <motion.div
                    key={i}
                    animate={{ scale: opt && v > 60 ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    style={{
                      aspectRatio: '1', borderRadius: 8,
                      backgroundColor: bg,
                      boxShadow: sh !== 'none' ? `0 0 12px ${sh}` : 'none',
                      transition: 'all 0.8s ease',
                    }}
                  />
                )
              })}
            </motion.div>
          </motion.div>

          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: '#0F1419', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '32px',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Grid Health</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4A5568', marginBottom: 8 }}>
                  <span>Feeder Load</span>
                  <motion.span
                    key={String(opt)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontWeight: 700, color: opt ? '#00E5A0' : '#FF4757' }}
                  >
                    {opt ? '61%' : '96%'}
                  </motion.span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                  <motion.div
                    animate={{ width: opt ? '61%' : '96%' }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    style={{
                      height: 8, borderRadius: 4,
                      background: opt
                        ? 'linear-gradient(90deg,#00E5A0,#00C8FF)'
                        : 'linear-gradient(90deg,#FF6B35,#FF4757)',
                    }}
                  />
                </div>
              </div>
              <motion.div
                animate={{ y: opt ? [0, -2, 0] : [0, 2, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{
                  padding: '16px', borderRadius: 12,
                  background: opt ? 'rgba(0,229,160,0.06)' : 'rgba(255,71,87,0.06)',
                  border: `1px solid ${opt ? 'rgba(0,229,160,0.15)' : 'rgba(255,71,87,0.15)'}`,
                  fontSize: 14, color: opt ? '#00E5A0' : '#FF4757', textAlign: 'center'
                }}
              >
                {opt ? '✓ Grid Stabilized · Peak Reduced 35%' : '⚠ Critical Overload · Risk of Failure'}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default memo(LiveDemo)