import { useState } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { NearbyStation } from '../../services/api';

interface AssistantPanelProps {
  nearbyStations: NearbyStation[];
  selectedZone: number;
}

export default function AssistantPanel({ nearbyStations, selectedZone }: AssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
    { role: 'assistant', text: 'Hi! I am your GridSense AI assistant. Ask me where to charge or what the grid status is.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    
    // Simple Rule-based logic
    setTimeout(() => {
      let response = "I'm analyzing the grid to find the best answer.";
      const lowerInput = userMsg.toLowerCase();
      
      if (lowerInput.includes('where') && lowerInput.includes('charge')) {
        const best = nearbyStations.find(s => s.is_best_option);
        if (best) {
          response = `I recommend heading to **${best.name}**. It's only ${best.distance_km}km away and currently has ${best.queue_time && best.queue_time > 0 ? best.queue_time + ' min wait' : 'no wait time'}. It's running at optimal capacity.`;
        } else {
          response = "I don't see any nearby stations right now. Make sure your location is enabled!";
        }
      } else if (lowerInput.includes('overload') || lowerInput.includes('strain')) {
        const redStations = nearbyStations.filter(s => s.status === 'RED');
        if (redStations.length > 0) {
          response = `Yes, I detect high strain at: ${redStations.map(s => s.name).join(', ')}. Please avoid these locations if possible.`;
        } else {
          response = "Currently, all nearby infrastructure looks stable. No immediate overloads detected.";
        }
      } else if (lowerInput.includes('8 pm') || lowerInput.includes('peak')) {
        response = `At 8 PM, we expect a major demand surge across Zone ${selectedZone}. Our AI is automatically shifting non-urgent loads to 11 PM to prevent transformer failures.`;
      } else {
        response = "I'm a specialized AI for grid and charging optimization. Try asking 'Where should I charge now?' or 'Which zone is overloaded?'";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    }, 600);
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
      {/* Header */}
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Bot size={16} className="text-cyan-400" /> GridSense Assistant
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
          <X size={16} />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-2.5 text-xs ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
              {msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
            </div>
          </div>
        ))}
      </div>
      
      {/* Input */}
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
