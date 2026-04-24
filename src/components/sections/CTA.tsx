import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <div className="cta-wrap" id="cta" style={{
      padding: '120px 0',
      background: 'linear-gradient(180deg, #080c12 0%, #0B0F14 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Animated background */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(0,229,160,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,200,255,0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(245,158,11,0.1) 0%, transparent 50%)',
          backgroundSize: '200% 200%'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '0 7%'
        }}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'block', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '2px', color: '#00E5A0', marginBottom: 20,
          }}
        >
          Ready to Transform
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 'clamp(36px,4vw,64px)', fontWeight: 900,
            letterSpacing: -3, lineHeight: 1.05, textAlign: 'center', marginBottom: 24,
          }}
        >
          Start Optimizing<br />
          <span style={{ background: 'linear-gradient(120deg,#00E5A0,#00C8FF)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your Grid Today
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: 18, color: '#8A9BB0', textAlign: 'center',
            lineHeight: 1.7, marginBottom: 48, maxWidth: 600
          }}
        >
          Deploy in under 2 hours. No hardware changes. Pure AI intelligence overlay.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <motion.a
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-green"
            href="#demo"
            style={{
              padding: '16px 32px', fontSize: 16, fontWeight: 700,
              boxShadow: '0 0 30px rgba(0,229,160,0.3)'
            }}
          >
            View Live Demo →
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline"
            href="#how"
            style={{
              padding: '16px 32px', fontSize: 16,
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            Learn More
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            marginTop: 60, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, width: '100%'
          }}
        >
          {[
            { num: '<500ms', label: 'Response Time' },
            { num: '24h', label: 'Forecast Horizon' },
            { num: '0', label: 'Hardware Changes' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                style={{
                  fontSize: 32, fontWeight: 900, letterSpacing: -1,
                  color: '#00E5A0', marginBottom: 8
                }}
                dangerouslySetInnerHTML={{ __html: item.num }}
              />
              <div style={{ fontSize: 14, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}