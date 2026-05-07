import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import { copilotAPI, CopilotMessage } from '../../services/api';

interface AssistantPanelProps {
  token: string;
  zone?: string;
  scenario?: string;
}

export default function CopilotPanel({ token, zone, scenario = 'normal' }: AssistantPanelProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: CopilotMessage | string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async () => {
    if (!query.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setQuery('');
    setLoading(true);
    setError(null);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await copilotAPI.ask(token, {
          query: query.trim(),
          zone_name: zone,
          scenario,
        });
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get response');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "I couldn't complete that request. Check operator session state or backend health.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }, 180);
  };

  const handleClearHistory = async () => {
    try {
      await copilotAPI.clearHistory(token);
      setMessages([]);
      setError(null);
    } catch (err) {
      setError('Failed to clear history');
    }
  };

  const suggestedQueries = [
    'What zones are at highest risk?',
    'Why is there a peak at 8 PM?',
    'What should I do to prevent overload?',
    'What\'s the impact of smart charging?',
  ];

  return (
    <div className="flex flex-col h-full bg-[#0B0F14] border border-white/10 rounded-[28px] overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/8 bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-lg border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
            <Bot size={16} className="text-cyan-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Operations Copilot</h3>
            <p className="text-xs text-slate-500">Retrieval-based Q&A for grid operations</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot size={32} className="text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 mb-6">Ask me about grid operations, risk, forecasts, or recommendations.</p>
            <div className="space-y-2 w-full">
              <p className="text-xs uppercase tracking-[0.1em] text-slate-600 font-medium">Try asking:</p>
              {suggestedQueries.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(suggestion);
                  }}
                  className="w-full text-left rounded-lg border border-white/8 bg-white/5 p-2.5 hover:bg-white/10 transition text-xs text-slate-300"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-cyan-300" />
                  </div>
                )}

                <div
                  className={`rounded-lg p-3 max-w-xs text-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 text-white'
                      : 'bg-white/5 border border-white/8'
                  }`}
                >
                  {typeof msg.content === 'string' ? (
                    <p className="text-slate-200">{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {msg.content.answer}
                      </p>

                      {msg.content.confidence && (
                        <div className="pt-2 border-t border-white/8 flex items-center gap-2 text-xs text-slate-400">
                          <span>Confidence:</span>
                          <span
                            className={
                              msg.content.confidence === 'High'
                                ? 'text-emerald-300'
                                : msg.content.confidence === 'Medium'
                                  ? 'text-amber-300'
                                  : 'text-slate-400'
                            }
                          >
                            {msg.content.confidence}
                          </span>
                        </div>
                      )}

                      {msg.content.data_sources?.length > 0 && (
                        <div className="pt-2 border-t border-white/8 text-xs text-slate-500">
                          Sources: {msg.content.data_sources.join(', ')}
                        </div>
                      )}

                      {msg.content.follow_up_suggestions && msg.content.follow_up_suggestions.length > 0 && (
                        <div className="pt-3 border-t border-white/8 space-y-2">
                          <p className="text-xs text-slate-500 font-medium">Follow up:</p>
                          {msg.content.follow_up_suggestions.slice(0, 2).map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => setQuery(suggestion)}
                              className="w-full text-left text-xs text-cyan-300 hover:text-cyan-200 truncate"
                            >
                              → {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="h-6 w-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <User size={12} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
            <div className="flex gap-2">
              <AlertCircle size={14} className="text-amber-300 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="h-6 w-6 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-cyan-300 animate-pulse" />
            </div>
            <div className="rounded-lg bg-white/5 border border-white/8 p-3 flex gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="h-2 w-2 rounded-full bg-cyan-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/8 bg-white/[0.02] p-4 space-y-2">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleAsk();
              }
            }}
            placeholder="Ask about risk, forecast, recommendations..."
            className="flex-1 rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
            disabled={loading}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !query.trim()}
            className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearHistory}
            disabled={messages.length === 0 || loading}
            className="flex-1 rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RefreshCw size={12} className="inline mr-1" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
