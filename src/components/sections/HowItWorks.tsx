import { motion } from 'framer-motion'

const fw = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } }

export default function HowItWorks() {
  return (
    <section id="how" style={{ padding: '120px 0', background: '#0B0F14', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 7%' }}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.span
            variants={fw}
            style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '2px', color: '#00C8FF', marginBottom: 16,
            }}
          >
            How It Works
          </motion.span>
          <motion.h2
            variants={fw}
            style={{
              fontSize: 'clamp(32px,4vw,56px)', fontWeight: 900,
              letterSpacing: -3, lineHeight: 1.05, marginBottom: 24,
            }}
          >
            Three Steps to<br />
            <span style={{ background: 'linear-gradient(120deg,#00E5A0,#00C8FF)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Grid Salvation
            </span>
          </motion.h2>
          <motion.p
            variants={fw}
            style={{ fontSize: 18, color: '#8A9BB0', maxWidth: 600, lineHeight: 1.7, marginBottom: 64 }}
          >
            Pure software intelligence. No wires touched. Deploy in hours.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.2, delayChildren: 0.2 } } }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}
        >
          {[
            {
              step: '01', icon: '🔮', color: '#00E5A0',
              title: 'Predict Demand',
              desc: 'AI forecasts EV charging load by zone with 24-hour horizon and ≤15% error margin.',
              anim: 'scale'
            },
            {
              step: '02', icon: '⚡', color: '#00C8FF',
              title: 'Optimize Scheduling',
              desc: 'Linear programming shifts sessions to off-peak windows within user preferences.',
              anim: 'rotate'
            },
            {
              step: '03', icon: '📍', color: '#F59E0B',
              title: 'Guide Expansion',
              desc: 'Spatial clustering identifies optimal sites for new charging infrastructure.',
              anim: 'bounce'
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fw}
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                background: '#0F1419', border: `1px solid ${item.color}20`,
                borderRadius: 20, padding: '40px 32px', textAlign: 'center',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.2, type: 'spring' }}
                style={{
                  position: 'absolute', top: 20, right: 20,
                  background: `${item.color}15`, borderRadius: '50%',
                  width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.step}</span>
              </motion.div>

              <motion.div
                animate={item.anim === 'scale' ? { scale: [1, 1.1, 1] } :
                        item.anim === 'rotate' ? { rotate: [0, 10, -10, 0] } :
                        { y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 48, marginBottom: 20 }}
              >
                {item.icon}
              </motion.div>

              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: item.color }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 16, color: '#8A9BB0', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}