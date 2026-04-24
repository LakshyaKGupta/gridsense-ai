import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, Zap, Clock, TrendingDown, MapPin, Activity } from 'lucide-react';

const App = () => {
  const [scene, setScene] = useState(0); // 0 to 3

  useEffect(() => {
    // Sequence the animation
    const timer1 = setTimeout(() => setScene(1), 2000); // Scene 2 at 2s
    const timer2 = setTimeout(() => setScene(2), 4000); // Scene 3 at 4s
    const timer3 = setTimeout(() => setScene(3), 7000); // Scene 4 at 7s
    const timer4 = setTimeout(() => setScene(0), 12000); // Loop back

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [scene]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">GridSense AI</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors">Platform</a>
          <a href="#" className="hover:text-white transition-colors">Solutions</a>
          <a href="#" className="hover:text-white transition-colors">Case Studies</a>
        </div>
        <button className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium backdrop-blur-md transition-all">
          Request Demo
        </button>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center min-h-screen">
        
        {/* Left Copy */}
        <div className="relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              BESCOM Ready
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Optimize Grid Load.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Zero Infrastructure.</span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
              GridSense AI predicts EV charging demand, recommends optimal scheduling, and prevents grid overload without requiring hardware modifications.
            </p>
            
            <div className="flex gap-4">
              <button className="px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-slate-200 transition-colors">
                Start Pilot
              </button>
              <button className="px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 font-semibold rounded-full transition-colors flex items-center gap-2">
                Read PRD
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-16 grid grid-cols-3 gap-6 pt-8 border-t border-white/10"
          >
            <div>
              <div className="text-3xl font-bold text-white mb-1">20%</div>
              <div className="text-sm text-slate-500">Peak Load Reduction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">85%</div>
              <div className="text-sm text-slate-500">Forecast Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">0</div>
              <div className="text-sm text-slate-500">Hardware Changes</div>
            </div>
          </motion.div>
        </div>

        {/* Right Animation Container */}
        <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-slate-900/50 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
          
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>

          {/* Isometric Animation Base */}
          <div className="relative w-[300px] h-[300px] lg:w-[400px] lg:h-[400px]">
            
            {/* The Station Base */}
            <motion.div 
              className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-slate-800 rounded-[2rem] transform -rotate-x-60 rotate-z-45 border-4 border-slate-700 shadow-2xl"
              style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) rotateZ(-45deg)' }}
            >
              {/* Heatmap overlay on the floor */}
              <motion.div 
                className="absolute inset-0 rounded-[2rem] blur-xl"
                animate={{
                  backgroundColor: scene < 2 ? 'rgba(239, 68, 68, 0.4)' : scene === 2 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.2)'
                }}
                transition={{ duration: 1.5 }}
              />
            </motion.div>

            {/* Charging Stations */}
            {[0, 1, 2].map((i) => (
              <motion.div 
                key={i}
                className="absolute w-8 h-20 bg-slate-700 rounded-lg flex flex-col items-center justify-start pt-2 shadow-xl"
                style={{
                  bottom: `${120 + i * 30}px`,
                  left: `${100 + i * 60}px`,
                  zIndex: 10 - i
                }}
              >
                <motion.div 
                  className="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  animate={{
                    backgroundColor: scene < 2 ? '#ef4444' : scene === 2 ? '#eab308' : '#10b981',
                    boxShadow: scene < 2 
                      ? '0 0 20px #ef4444' 
                      : scene === 2 ? '0 0 15px #eab308' : '0 0 20px #10b981'
                  }}
                  transition={{ duration: 1.5 }}
                />
              </motion.div>
            ))}

            {/* Character (Abstract Representation) */}
            <motion.div 
              className="absolute w-6 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
              initial={{ bottom: '100px', left: '140px' }}
              animate={
                scene === 0 ? { bottom: '100px', left: '140px' } :
                scene === 1 ? { bottom: '100px', left: '140px' } :
                scene === 2 ? { bottom: '140px', left: '180px' } :
                { bottom: '180px', left: '220px' }
              }
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{ zIndex: 20 }}
            >
              {/* Phone screen glow */}
              <AnimatePresence>
                {(scene === 1 || scene === 2) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -right-2 top-2 w-3 h-4 bg-cyan-400 rounded-sm shadow-[0_0_15px_#22d3ee]"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* UI Overlays */}
            <AnimatePresence mode="wait">
              {scene === 0 && (
                <motion.div 
                  key="scene0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-10 right-10 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-xl p-4 flex items-center gap-3"
                >
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-xs text-red-300 font-medium">Grid Status</div>
                    <div className="text-sm text-red-400 font-bold">Peak Load (98%)</div>
                  </div>
                </motion.div>
              )}

              {scene === 1 && (
                <motion.div 
                  key="scene1"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md rounded-xl p-4 flex items-center gap-4 z-50 w-64"
                >
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-cyan-300 font-medium uppercase tracking-wider mb-0.5">AI Intervention</div>
                    <div className="text-sm text-white font-semibold">Recommendation Found</div>
                  </div>
                </motion.div>
              )}

              {scene >= 3 && (
                <motion.div 
                  key="scene3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-10 right-10 bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md rounded-xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs text-emerald-300 font-medium">Shifted Schedule</div>
                      <div className="text-sm text-emerald-400 font-bold">10:30 PM Selected</div>
                    </div>
                  </div>
                  <div className="h-px w-full bg-emerald-500/20 my-1" />
                  <div className="text-xs text-emerald-200">Grid Load Balanced</div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
