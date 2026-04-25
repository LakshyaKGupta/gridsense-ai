import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function LiveDemo() {
  return (
    <section id="demo" className="py-32 bg-[#0B0F14] border-t border-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14] via-slate-900/20 to-[#0B0F14] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-[2px] text-cyan-500 mb-4 block">
            Interactive Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
            Experience the <span className="text-cyan-400">Intelligence</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Interact with a live simulation of Bengaluru's grid, featuring real-time data, predictive insights, and AI-driven load shifting.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-5xl rounded-[2rem] border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden group"
        >
          {/* Top Bar Fake */}
          <div className="h-12 border-b border-slate-800 flex items-center px-6 justify-between bg-[#0B0F14]/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 h-[500px]">
            {/* Sidebar Fake */}
            <div className="col-span-1 border-r border-slate-800 p-6 space-y-6 hidden md:block">
              <div className="h-8 w-32 bg-slate-800 rounded mb-8 animate-pulse" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 w-full bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            
            {/* Main Area Fake */}
            <div className="col-span-4 md:col-span-3 p-6 relative flex flex-col justify-between bg-[url('https://api.maptiler.com/maps/dataviz-dark/256/0/0/0.png')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/80" />
              
              <div className="relative z-10 grid grid-cols-3 gap-4 mb-6">
                <div className="h-24 bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                  <div className="h-4 w-16 bg-slate-700 rounded mb-4" />
                  <div className="h-8 w-24 bg-emerald-500/20 rounded" />
                </div>
                <div className="h-24 bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                  <div className="h-4 w-16 bg-slate-700 rounded mb-4" />
                  <div className="h-8 w-24 bg-cyan-500/20 rounded" />
                </div>
                <div className="h-24 bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                  <div className="h-4 w-16 bg-slate-700 rounded mb-4" />
                  <div className="h-8 w-24 bg-amber-500/20 rounded" />
                </div>
              </div>
              
              <div className="relative z-10 h-48 bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50" />
            </div>
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link 
              to="/login?mode=login"
              className="bg-cyan-500 text-[#0B0F14] px-8 py-4 rounded-xl font-bold text-lg hover:bg-cyan-400 transition-transform hover:scale-105 shadow-[0_0_40px_rgba(6,182,212,0.4)] flex items-center gap-2"
            >
              Launch Platform <Zap size={20} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}