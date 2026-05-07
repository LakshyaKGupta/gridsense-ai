import { useRef, useState } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { copilotAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function FloatingCopilot() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hi! I\'m your GridSense AI assistant. Ask me about grid load, station availability, or EV charging recommendations.' },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const query = input.trim();
    if (!query || !token || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setInput('');
    setLoading(true);

    try {
      const res = await copilotAPI.ask(token, { query });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Backend unavailable right now. Please ensure the server is running on port 8000.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  if (!token) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[340px] rounded-[20px] border border-white/12 bg-[#0D1219]/95 shadow-2xl shadow-black/50 backdrop-blur-xl flex flex-col overflow-hidden"
          style={{ height: '420px' }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={15} className="text-emerald-400" />
              <p className="text-sm font-semibold text-white">GridSense Copilot</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-none">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                  msg.role === 'user'
                    ? 'bg-emerald-400/20 text-emerald-50 rounded-br-md'
                    : 'bg-white/8 text-slate-200 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-white/8 px-3 py-2">
                  <Loader2 size={13} className="text-slate-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/8 px-3 py-2.5 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about grid load, stations..."
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || loading}
              className="rounded-full bg-emerald-500 p-1.5 text-white disabled:opacity-40 hover:bg-emerald-400 transition"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
          open
            ? 'bg-white/10 text-white border border-white/20'
            : 'bg-emerald-500 text-white shadow-emerald-500/40 hover:bg-emerald-400'
        }`}
        aria-label="Open AI Copilot"
      >
        {open ? <X size={18} /> : <MessageSquare size={18} />}
      </button>
    </div>
  );
}
