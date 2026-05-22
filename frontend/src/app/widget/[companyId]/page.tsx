"use client";

import { useState, use, useEffect, useRef } from "react";

export default function ChatbotWidget({ params }: { params: Promise<{ companyId: string }> }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.companyId;

  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string, timestamp: string}[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am the customer support AI for this company. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState('Flowdesk Support');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch company name on load
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/companies/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCompanyName(data.companyName);
        }
      } catch (e) {}
    };
    fetchCompany();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp }]);
    setInput('');
    setIsLoading(true);

    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${hostname}:5001/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, message: userMessage })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      const assistantTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: assistantTimestamp }]);
    } catch (error: any) {
      const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an issue: ${error.message}`, timestamp: errorTimestamp }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-transparent animate-fade-in">
      <div className="w-full max-w-[450px] h-[600px] flex flex-col bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--glass-border)] bg-[rgba(255,255,255,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              {companyName.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">{companyName}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-[#00ff64] rounded-full animate-pulse shadow-[0_0_8px_#00ff64]"></span>
                <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">AI Support Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              if (window.parent) {
                window.parent.postMessage({ type: 'close-flowdesk-widget' }, '*');
              }
              // If not in iframe, maybe redirect or hide
              window.close();
            }}
            className="text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-fade-up`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-[var(--accent)] text-white rounded-tr-sm shadow-lg shadow-blue-500/20' 
                  : 'bg-[rgba(255,255,255,0.06)] text-white border border-[var(--glass-border)] rounded-tl-sm'
              }`}>
                {m.content}
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] mt-1.5 px-1 font-medium opacity-60">
                {m.timestamp}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-up">
              <div className="bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-5 bg-[rgba(0,0,0,0.2)] border-t border-[var(--glass-border)]">
          <form onSubmit={handleSend} className="relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How can we help?"
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-[var(--accent)] focus:bg-[rgba(255,255,255,0.08)] transition-all placeholder:text-[var(--text-secondary)]"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-lg shadow-blue-600/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
          <p className="text-[10px] text-center text-[var(--text-secondary)] mt-4 font-medium uppercase tracking-[0.2em] opacity-50">
            Powered by Flowdesk AI
          </p>
        </div>
      </div>
    </div>
  );
}

