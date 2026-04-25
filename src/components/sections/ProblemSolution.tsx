import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { BatteryWarning, TrendingUp, AlertTriangle } from 'lucide-react'

const cards = [
  {
    title: "Evening Peak Overload",
    description: "Grid infrastructure faces immense strain during evening hours as EVs plug in simultaneously after work. This creates an unmanageable 96% peak load that risks transformer blowouts.",
    icon: <BatteryWarning size={48} className="text-rose-500 mb-4" />,
    color: "from-rose-500/20 to-transparent",
    border: "border-rose-500/30"
  },
  {
    title: "Unplanned Charging Behavior",
    description: "Without intelligence, charging happens exactly when power is most expensive and grids are most stressed. We lack automated systems to shift non-urgent loads to off-peak hours.",
    icon: <TrendingUp size={48} className="text-amber-500 mb-4" />,
    color: "from-amber-500/20 to-transparent",
    border: "border-amber-500/30"
  },
  {
    title: "Inefficient Infrastructure",
    description: "Governments deploy charging stations blindly based on guesswork rather than data. This leads to underutilized stations in some zones and massive queues in others.",
    icon: <AlertTriangle size={48} className="text-orange-500 mb-4" />,
    color: "from-orange-500/20 to-transparent",
    border: "border-orange-500/30"
  }
]

export default function ProblemSolution() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  return (
    <section ref={containerRef} id="problem" className="py-32 bg-[#0B0F14] relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-20">
          <span className="text-xs font-bold uppercase tracking-[2px] text-rose-500 mb-4 block">
            The Crisis
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-white">
            EV Growth Is Exploding.<br />
            <span className="text-rose-500">Grids Are Breaking.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Cities worldwide face grid collapse as EV adoption surges. Unmanaged charging creates demand spikes that overload infrastructure built for the past century.
          </p>
        </div>

        {/* Stacked Cards Container */}
        <div className="relative w-full pb-[20vh]">
          {cards.map((card, i) => (
            <Card key={i} card={card} i={i} total={cards.length} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Card({ card, i, total }: { card: any, i: number, total: number }) {
  const targetScale = 1 - ( (total - i) * 0.05 );
  
  return (
    <div 
      className="sticky top-32 w-full flex justify-center mt-12"
      style={{
        zIndex: i,
      }}
    >
      <div 
        className={`w-full max-w-4xl bg-slate-900 border ${card.border} rounded-3xl p-10 md:p-14 shadow-2xl bg-gradient-to-br ${card.color} backdrop-blur-xl transition-transform duration-500 hover:scale-[1.02] origin-top`}
        style={{
          boxShadow: '0 -20px 40px -20px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="bg-[#0B0F14] p-6 rounded-2xl border border-slate-800 shrink-0">
            {card.icon}
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">{card.title}</h3>
            <p className="text-slate-400 text-lg leading-relaxed">{card.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}