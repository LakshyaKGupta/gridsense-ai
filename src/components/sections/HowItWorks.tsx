import { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import { BrainCircuit, Zap, Map as MapIcon } from "lucide-react";

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.2], [20, 0]);

  return (
    <section ref={containerRef} id="how" className="py-32 bg-[#0B0F14] relative perspective-1000">
      <div className="max-w-6xl mx-auto px-6 mb-20 text-center">
        <span className="text-xs font-bold uppercase tracking-[2px] text-cyan-500 mb-4 block">
          How It Works
        </span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">
          Three Steps to <span className="text-cyan-400">Grid Salvation</span>
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Pure software intelligence. No wires touched. Deploy in hours.
        </p>
      </div>

      <motion.div 
        style={{ scale, opacity, rotateX, transformStyle: "preserve-3d" }}
        className="max-w-5xl mx-auto bg-slate-900 border border-slate-700/50 rounded-[2rem] shadow-2xl p-8 md:p-16 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
        
        <div className="grid md:grid-cols-3 gap-12 relative z-10">
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
              <BrainCircuit className="text-cyan-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">1. Predict Demand</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              AI forecasts EV charging load by zone with a 24-hour horizon, predicting peak times with ≤15% error margin.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <Zap className="text-emerald-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">2. Optimize Charging</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Linear programming algorithms automatically shift non-urgent charging sessions to off-peak windows.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
              <MapIcon className="text-amber-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">3. Plan Infrastructure</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Spatial clustering algorithms identify the precise optimal locations for new physical charging stations.
            </p>
          </div>

        </div>
      </motion.div>
    </section>
  );
}