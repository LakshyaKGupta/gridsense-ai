import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const fw = { hidden:{opacity:0,y:28}, show:{opacity:1,y:0,transition:{duration:0.6}} }
const stg = { show:{transition:{staggerChildren:0.11}} }

// ── Section 1: Live Activity Feed ────────────────────
const EVENTS = [
  { icon:'⚡', msg:'Peak spike detected · Whitefield Z12', time:'now',   col:'#FF4757' },
  { icon:'✅', msg:'AI shifted 47 sessions to 11 PM window', time:'2s',  col:'#00E5A0' },
  { icon:'📊', msg:'Demand forecast updated · 92% confidence', time:'8s', col:'#00C8FF' },
  { icon:'🔋', msg:'BTM Zone 3 · feeder load 61% ↓ from 96%', time:'15s',col:'#00E5A0' },
  { icon:'📍', msg:'New priority site: Sarjapur Rd · score 88', time:'22s',col:'#F59E0B' },
  { icon:'⚠️', msg:'Koramangala feeder nearing 80% threshold', time:'31s',col:'#FF6B35' },
  { icon:'🤖', msg:'LP optimizer ran · 23 kW peak reduction', time:'38s', col:'#A78BFA' },
  { icon:'📋', msg:'Zone report exported · BTM_Z03.pdf ready', time:'44s',col:'#00C8FF' },
]

function ActivityFeed() {
  const [items, setItems] = useState(EVENTS.slice(0,4))
  const idx = useRef(4)
  useEffect(() => {
    const t = setInterval(() => {
      setItems(prev => {
        const next = [...prev, EVENTS[idx.current % EVENTS.length]]
        idx.current++
        return next.slice(-5)
      })
    }, 4000)  // slowed to 4s to reduce re-renders
    return () => clearInterval(t)
  }, [])

  return (
    <section style={{ padding:'96px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 6%' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
          <div>
            <motion.span initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
              style={{ display:'block', fontSize:10.5, fontWeight:700, textTransform:'uppercase',
                letterSpacing:'2px', color:'#00E5A0', marginBottom:14 }}>
              Real-Time Activity
            </motion.span>
            <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              style={{ fontSize:'clamp(28px,3vw,46px)', fontWeight:800, letterSpacing:-2, lineHeight:1.08, marginBottom:16 }}>
              The Grid Never<br />Sleeps. Neither Does AI.
            </motion.h2>
            <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.2}}
              style={{ fontSize:15, color:'#8A9BB0', lineHeight:1.72, maxWidth:420 }}>
              Every zone event, AI decision, and forecast update is logged in real time.
              Operators get full visibility — no black boxes.
            </motion.p>
            <motion.div initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.3}}
              style={{ display:'flex', gap:28, marginTop:36, flexWrap:'wrap' }}>
              {[['&lt;500ms','Latency'],['24h','Forecast Window'],['198','Active Zones']].map(([n,l])=>(
                <div key={l}>
                  <div style={{ fontSize:26, fontWeight:800, letterSpacing:-1, color:'#fff' }} dangerouslySetInnerHTML={{__html:n}} />
                  <div style={{ fontSize:11, color:'#4A5568', textTransform:'uppercase', letterSpacing:'0.6px', marginTop:4 }}>{l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Feed */}
          <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.6}}
            style={{ background:'#0F1419', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:20, overflow:'hidden', position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontSize:12.5, fontWeight:700 }}>Grid Event Log</span>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <motion.div animate={{opacity:[1,0.2,1]}} transition={{duration:1.4,repeat:Infinity}}
                  style={{ width:6, height:6, borderRadius:'50%', background:'#00E5A0', boxShadow:'0 0 8px #00E5A0' }} />
                <span style={{ fontSize:10, color:'#00E5A0', fontWeight:700 }}>LIVE</span>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {items.map((ev, i) => (
                <motion.div key={i} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{duration:0.4}}
                  style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 12px',
                    background:'#141B24', borderRadius:10, border:`1px solid ${ev.col}18` }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{ev.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, color:'#CBD5E0', lineHeight:1.4 }}>{ev.msg}</div>
                  </div>
                  <span style={{ fontSize:9.5, color:'#3A4A5E', whiteSpace:'nowrap', marginTop:2 }}>{ev.time} ago</span>
                </motion.div>
              ))}
            </div>
            {/* Fade bottom */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:50,
              background:'linear-gradient(transparent,#0F1419)', borderRadius:'0 0 18px 18px', pointerEvents:'none' }} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── Section 2: AI Technology Stack ──────────────────
const STACK = [
  { icon:'🔮', title:'Demand Forecasting', tech:'Prophet + LSTM Hybrid', desc:'24h zone-level predictions with ≤15% MAPE. Handles seasonality, EV adoption trends, and weather signals.', col:'#00E5A0', tag:'Module A' },
  { icon:'⚙️', title:'Schedule Optimizer', tech:'Linear Programming (PuLP)', desc:'Shifts EV sessions to off-peak windows within ±3h user preference. Reduces peak load by ≥20%.', col:'#00C8FF', tag:'Module B' },
  { icon:'📍', title:'Spatial Intelligence', tech:'K-Means + DBSCAN Clustering', desc:'Identifies high-demand zones and ranks candidate sites using a weighted 4-factor scoring model.', col:'#F59E0B', tag:'Module C' },
  { icon:'🏗', title:'Infrastructure Scorer', tech:'Composite Weighted Model', desc:'Ranks zones by demand (35%), grid headroom (30%), accessibility (20%), and land feasibility (15%).', col:'#A78BFA', tag:'Module D' },
  { icon:'📊', title:'Operator Dashboard', tech:'React + Recharts + FastAPI', desc:'Real-time heatmaps, 24h forecasts, scheduling recommendations, and one-click PDF report export.', col:'#FF6B35', tag:'Module E' },
  { icon:'🔒', title:'Zero-Access Design', tech:'No SCADA · No PII · No Hardware', desc:'Pure software overlay — consumes only aggregated, anonymised signals. Deployable on any cloud VM.', col:'#00E5A0', tag:'Security' },
]

function TechStack() {
  return (
    <section style={{ padding:'96px 0', background:'#0B0F14', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 6%' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <motion.span initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            style={{ display:'block', fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'#00E5A0', marginBottom:14 }}>
            Under the Hood
          </motion.span>
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{ fontSize:'clamp(28px,3vw,46px)', fontWeight:800, letterSpacing:-2, lineHeight:1.08 }}>
            Five AI Modules.<br />One Unified Platform.
          </motion.h2>
        </div>
        <motion.div variants={stg} initial="hidden" whileInView="show" viewport={{once:true}}
          style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {STACK.map(s => (
            <motion.div key={s.title} variants={fw}
              whileHover={{ y:-5, boxShadow:`0 24px 64px rgba(0,0,0,0.45), 0 0 32px ${s.col}12` }}
              style={{ background:'#0F1419', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:16, padding:'28px 24px', cursor:'none', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg,transparent,${s.col},transparent)`, opacity:0.6 }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <span style={{ fontSize:26 }}>{s.icon}</span>
                <span style={{ padding:'3px 8px', borderRadius:4, fontSize:9.5, fontWeight:700,
                  background:`${s.col}12`, color:s.col, border:`1px solid ${s.col}22` }}>{s.tag}</span>
              </div>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:5, letterSpacing:-0.3 }}>{s.title}</div>
              <div style={{ fontSize:11, color:s.col, fontWeight:600, marginBottom:10, fontFamily:'monospace' }}>{s.tech}</div>
              <div style={{ fontSize:12.5, color:'#8A9BB0', lineHeight:1.65 }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ── Section 3: ROI Impact Calculator ────────────────
function ROICalc() {
  const [evs, setEvs] = useState(500)
  const peakReduc = Math.round(evs * 0.046)
  const annualSave = Math.round(evs * 18.4)
  const infraDefer = Math.round(evs * 0.22)
  const co2 = Math.round(evs * 0.38)

  return (
    <section id="roi" style={{ padding:'96px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth:1240, margin:'0 auto', padding:'0 6%' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
          <div>
            <motion.span initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
              style={{ display:'block', fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'#00E5A0', marginBottom:14 }}>
              Impact Calculator
            </motion.span>
            <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              style={{ fontSize:'clamp(28px,3vw,46px)', fontWeight:800, letterSpacing:-2, lineHeight:1.08, marginBottom:16 }}>
              See Your Grid's<br />Potential Savings
            </motion.h2>
            <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay:0.2}}
              style={{ fontSize:15, color:'#8A9BB0', lineHeight:1.72, marginBottom:32, maxWidth:400 }}>
              Move the slider to estimate the impact of GridSense AI based on your EV fleet size.
            </motion.p>
            <div style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:13, color:'#8A9BB0' }}>Active EVs in Zone</span>
                <span style={{ fontSize:15, fontWeight:800, color:'#00E5A0' }}>{evs.toLocaleString()}</span>
              </div>
              <input type="range" min={100} max={2000} step={50} value={evs}
                onChange={e => setEvs(+e.target.value)}
                style={{ width:'100%', accentColor:'#00E5A0', cursor:'none' }} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                <span style={{ fontSize:10, color:'#3A4A5E' }}>100</span>
                <span style={{ fontSize:10, color:'#3A4A5E' }}>2,000</span>
              </div>
            </div>
          </div>

          <motion.div initial={{opacity:0,x:24}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{duration:0.6}}
            style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Peak kW Reduced', val:`${peakReduc} kW`, col:'#00E5A0', icon:'📉' },
              { label:'Annual Savings', val:`₹${annualSave.toLocaleString()}`, col:'#00C8FF', icon:'💰' },
              { label:'Infra Deferred (MW)', val:`${infraDefer} MW`, col:'#F59E0B', icon:'🏗' },
              { label:'CO₂ Avoided (t/yr)', val:`${co2} t`, col:'#A78BFA', icon:'🌿' },
            ].map(c => (
              <div key={c.label}
                style={{ background:'#0F1419', border:`1px solid ${c.col}22`,
                  borderRadius:14, padding:'22px 18px', textAlign:'center' }}>
                <div style={{ fontSize:26, marginBottom:8 }}>{c.icon}</div>
                <div style={{ fontSize:22, fontWeight:900, letterSpacing:-1, color:c.col, marginBottom:5,
                  transition:'color 0.3s' }}>
                  {c.val}
                </div>
                <div style={{ fontSize:11, color:'#4A5568', lineHeight:1.4 }}>{c.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default function ExtraSections() {
  return (
    <>
      <ActivityFeed />
      <TechStack />
      <ROICalc />
    </>
  )
}
