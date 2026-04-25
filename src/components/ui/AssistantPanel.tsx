import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { useSystemState } from '../../context/SystemStateContext';

export default function AssistantPanel({ }: { nearbyStations?: any[]; selectedZone?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
    { role: 'assistant', text: 'Hi! Ask me about stations, predictions, or recommendations.' }
  ]);
  const [input, setInput] = useState('');
  const systemState = useSystemState();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stations = systemState.stations || [];
  const totalDemand = systemState.total_demand || 0;
  const peakLoad = systemState.peak_load || 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([{ role: 'assistant', text: 'Hi! Ask me about stations, predictions, or recommendations.' }]);
  }, [])

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    
    setTimeout(() => {
      let response = "Analyzing system state...";
      const lowerInput = userMsg.toLowerCase();
      
      // Best station query
      if (lowerInput.includes('best') || lowerInput.includes('closest') || lowerInput.includes('fastest')) {
        const sorted = [...stations].sort((a, b) => a.distance - b.distance);
        const best = sorted.find(s => s.status === 'GREEN') || sorted[0];
        if (best) {
          response = `Best option is **${best.name}**. It's ${best.distance?.toFixed(1)}km away with ${best.wait_time > 0 ? `${best.wait_time}m wait` : 'no wait time'}. Current load: ${Math.round(best.load)}/${best.capacity}.`;
        }
      }
      // Station status query
      else if (lowerInput.includes('status') || lowerInput.includes('available')) {
        const green = stations.filter(s => s.status === 'GREEN').length;
        const yellow = stations.filter(s => s.status === 'YELLOW').length;
        const red = stations.filter(s => s.status === 'RED').length;
        response = `System status: ${green} Available, ${yellow} Moderate, ${red} Busy. Current total demand: ${totalDemand.toFixed(0)} kW.`;
      }
      // Peak time query
      else if (lowerInput.includes('peak') || lowerInput.includes('when')) {
        response = `Peak demand expected between 7-9 PM. Recommendations suggest charging before 5 PM or after 10 PM to avoid peak rates and ensure availability.`;
      }
      // Demand/load query
      else if (lowerInput.includes('demand') || lowerInput.includes('load')) {
        response = `Current total grid demand: ${totalDemand.toFixed(0)} kW. Peak load: ${peakLoad.toFixed(0)} kW. Optimization can reduce peak by ~18%.`;
      }
      // Recommendation query
      else if (lowerInput.includes('recommend') || lowerInput.includes('suggest')) {
        const recommendations = [
          "Charge between 11 PM - 5 AM for lowest rates",
          "Avoid charging at 7-9 PM when demand peaks",
          "Check Indiranagar or Koramangala for best availability"
        ];
        response = `Here are some recommendations:\n\n${recommendations.join('\n')}`;
      }
      // Help query
      else if (lowerInput.includes('help') || lowerInput.includes('what')) {
        response = "Try asking: 'best station', 'peak time', 'recommendations', 'status', or 'current demand'.";
      }
      else {
        response = "Ask me about stations, peak times, recommendations, or system status.";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    }, 400);
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 h-12 w-12 bg-cyan-500 hover:bg-cyan-400 text-[#0B0F14] rounded-full shadow-lg shadow-cyan-500/20 flex items-center justify-center transition-transform hover:scale-110 z-50">
        <MessageSquare size={20} className="fill-current" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-slate-900 border border-slate-700 sm:rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col h-64 sm:h-96 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-800 p-2 sm:p-3 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Bot size={14} className="text-cyan-400" /> GridSense AI
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
      </div>
      
      <div className="flex-1 p-2 sm:p-3 overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-1.5 sm:p-2.5 text-xs ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
              {msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-2 sm:p-3 border-t border-slate-800 bg-slate-900/50">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask..." className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 sm:px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500" />
          <button type="submit" className="bg-cyan-500 text-[#0B0F14] p-1.5 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50" disabled={!input.trim()}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}