import { motion } from 'framer-motion'

const fw = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } }

export default function ProblemSolution() {
  return (
    <section id="problem" style={{ padding: '120px 0', background: 'linear-gradient(180deg, #080c12 0%, #0B0F14 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 7%' }}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.2 } } }}
        >
          <motion.span
            variants={fw}
            style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '2px', color: '#00E5A0', marginBottom: 16,
            }}
          >
            The Crisis
          </motion.span>
          <motion.h2
            variants={fw}
            style={{
              fontSize: 'clamp(32px,4vw,56px)', fontWeight: 900,
              letterSpacing: -3, lineHeight: 1.05, marginBottom: 24,
            }}
          >
            EV Growth Is Exploding.<br />
            <span style={{ color: '#FF4757' }}>Grids Are Breaking.</span>
          </motion.h2>
          <motion.p
            variants={fw}
            style={{ fontSize: 18, color: '#8A9BB0', maxWidth: 600, lineHeight: 1.7, marginBottom: 48 }}
          >
            Cities worldwide face grid collapse as EV adoption surges. Unmanaged charging creates demand spikes that overload infrastructure built for the past century.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}
        >
          <motion.div variants={fw} style={{ background: '#0F1419', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 20, padding: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #FF4757, #FF6B35)' }} />
            <div style={{ fontSize: 24, marginBottom: 16 }}>⚠️ The Problem</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#FF4757' }}>Chaos in the Grid</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                '96% feeder load during peak hours',
                'Infrastructure stressed beyond capacity',
                'Reactive management leads to outages',
                'Users charge at worst possible times'
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  style={{ fontSize: 16, color: '#CBD5E0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span style={{ color: '#FF4757', fontSize: 18 }}>✗</span> {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fw} style={{ background: '#0F1419', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 20, padding: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #00E5A0, #00C8FF)' }} />
            <div style={{ fontSize: 24, marginBottom: 16 }}>✓ The Solution</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#00E5A0' }}>AI-Powered Harmony</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                '24h demand forecasting with 85% accuracy',
                'Smart scheduling reduces peaks by 25%',
                'Proactive infrastructure planning',
                'Zero hardware changes required'
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  style={{ fontSize: 16, color: '#CBD5E0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span style={{ color: '#00E5A0', fontSize: 18 }}>✓</span> {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}