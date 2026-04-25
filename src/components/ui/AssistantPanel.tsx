import { useState, useEffect } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { useSystemState } from '../../context/SystemStateContext';
import type { Station } from '../../system/stateEngine';

interface AssistantPanelProps {
  nearbyStations: Station[];
  selectedZone: number;
}

export default function AssistantPanel({ }: AssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
    { role: 'assistant', text: 'Hi! Ask me about stations or grid status.' }
  ]);
  const [input, setInput] = useState('');
  const systemState = useSystemState();

  useEffect(() => {
    setMessages([
      { role: 'assistant', text: 'Hi! Ask me about stations or grid status.' }
    ]);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    
    setTimeout(() => {
      let response = "Analyzing grid...";
      const lowerInput = userMsg.toLowerCase();
      const stations = systemState.stations;
      const alerts = systemState.alerts;
      const totalDemand = systemState.demand.reduce((acc, d) => acc + d.demand, 0);
      
      if (lowerInput.includes('where') && lowerInput.includes('charge')) {
        const sortedByDistance = [...stations].sort((a, b) => a.distance - b.distance);
        const best = sortedByDistance.find(s => s.status !== 'RED') || sortedByDistance[0];
        if (best) {
          response = `I recommend **${best.name}**. It's ${best.distance.toFixed(1)}km away with ${best.wait_time > 0 ? best.wait_time + ' min wait' : 'no wait'}. Load: ${Math.round(best.load)}/${best.capacity}.`;
        }
      } else if (lowerInput.includes('overload') || lowerInput.includes('busy')) {
        const redStations = stations.filter(s => s.status === 'RED');
        if (redStations.length > 0) {
          response = `Busy stations: ${redStations.map(s => s.name).join(', ')}. Consider alternatives.`;
        } else {
          response = "All stations have available capacity.";
        }
      } else if (lowerInput.includes('best') || lowerInput.includes('fastest')) {
        const sortedByLoad = [...stations].sort((a, b) => (a.load/a.capacity) - (b.load/b.capacity));
        const best = sortedByLoad[0];
        if (best) {
          response = `Best option is **${best.name}** - only ${Math.round(best.load/best.capacity*100)}% utilized.`;
        }
      } else if (lowerInput.includes('demand') || lowerInput.includes('load') || lowerInput.includes('usage')) {
        response = `Current total grid demand: ${totalDemand.toFixed(0)} kW across ${stations.length} stations.`;
      } else if (lowerInput.includes('status')) {
        const green = stations.filter(s => s.status === 'GREEN').length;
        const yellow = stations.filter(s => s.status === 'YELLOW').length;
        const red = stations.filter(s => s.status === 'RED').length;
        response = `Status: ${green} Available, ${yellow} Moderate, ${red} Busy.`;
      } else if (lowerInput.includes('alert')) {
        if (alerts.length > 0) {
          response = `Alerts: ${alerts.map(a => a.message).join(' | ')}`;
        } else {
          response = "No active alerts.";
        }
      } else {
        response = "Try: 'Where to charge?', 'Which stations are busy?', or 'Status?'";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    }, 400);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 bg-cyan-500 hover:bg-cyan-400 text-[#0B0F14] rounded-full shadow-lg shadow-cyan-500/20 flex items-center justify-center transition-transform hover:scale-110 z-50"
      >
        <MessageSquare size={20} className="fill-current" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col h-96 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Bot size={16} className="text-cyan-400" /> GridSense AI
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
          <X size={16} />
        </button>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-2.5 text-xs ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
              {msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about charging..." 
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <button type="submit" className="bg-cyan-500 text-[#0B0F14] p-1.5 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50" disabled={!input.trim()}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}