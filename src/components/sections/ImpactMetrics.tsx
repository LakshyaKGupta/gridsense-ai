import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingDown, Activity, DollarSign } from 'lucide-react'

function Counter({ to, suffix = '' }: { to: number; suffix: string }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (inView) {
      let n = 0
      const tick = () => {
        n += to / 60
        if (n >= to) { setV(to); return }
        setV(Math.floor(n))
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
  }, [inView, to])

  return <div ref={ref} className="text-5xl font-black text-white">{v}{suffix}</div>
}

export default function ImpactMetrics() {
  return (
    <section id="metrics" className="py-32 bg-[#080c12] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-xs font-bold uppercase tracking-[2px] text-emerald-500 mb-4 block">
            Proven Results
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
            System Impact
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Measurable improvements in grid stability and operational costs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { to: 25, suffix: '%', label: 'Peak Load Reduced', color: 'text-emerald-400', icon: <TrendingDown size={32} className="text-emerald-400" /> },
            { to: 85, suffix: '%', label: 'Forecast Accuracy', color: 'text-cyan-400', icon: <Activity size={32} className="text-cyan-400" /> },
            { to: 40, suffix: '%', label: 'Cost Savings', color: 'text-amber-400', icon: <DollarSign size={32} className="text-amber-400" /> },
          ].map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-10 flex flex-col items-center text-center hover:bg-slate-800/80 transition-colors"
            >
              <div className="mb-8 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                {m.icon}
              </div>
              <Counter to={m.to} suffix={m.suffix} />
              <div className="text-slate-400 mt-4 font-medium">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}