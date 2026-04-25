import { Battery, Map, BarChart, Shield, Zap, Clock } from 'lucide-react'

const features = [
  {
    title: "Real-Time Grid Monitoring",
    description: "Live tracking of demand across all zones with sub-second updates. See exactly where strain is building before it becomes a crisis.",
    icon: <Battery size={32} className="text-cyan-400" />
  },
  {
    title: "AI Demand Forecasting",
    description: "Proprietary ML models predict load spikes 24 hours ahead with 92% accuracy. Schedule charging during off-peak hours automatically.",
    icon: <BarChart size={32} className="text-cyan-400" />
  },
  {
    title: "Smart Station Routing",
    description: "Direct drivers to the optimal station based on distance, wait time, and real-time load. No more guessing or wasted trips.",
    icon: <Map size={32} className="text-cyan-400" />
  },
  {
    title: "Zone Overload Protection",
    description: "Automatic alerts and recommendations when zones approach capacity. Proactive strain management before blackouts.",
    icon: <Zap size={32} className="text-cyan-400" />
  },
  {
    title: "Infrastructure ROI Calculator",
    description: "Data-driven recommendations for where to build next. Maximize utilization and minimize investment risk.",
    icon: <Shield size={32} className="text-cyan-400" />
  },
  {
    title: "Flexible Policy Controls",
    description: "Adjust adoption rates and simulation parameters on the fly. Test policy impacts before implementation.",
    icon: <Clock size={32} className="text-cyan-400" />
  }
]

export default function Features() {
  return (
    <section id="features" className="py-32 bg-[#0B0F14] relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-20">
          <span className="text-xs font-bold uppercase tracking-[2px] text-cyan-500 mb-4 block">
            Platform
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6 text-white">
            Everything You Need to<br />
            <span className="text-cyan-400">Manage the Grid</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            A complete suite of AI-powered tools for monitoring, forecasting, and optimizing EV charging infrastructure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition-all hover:bg-slate-800/30"
            >
              <div className="mb-4 p-3 bg-slate-800 rounded-xl inline-block">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}