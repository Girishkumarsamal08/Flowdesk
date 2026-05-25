"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ExecutiveDashboard() {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5001` : 'http://localhost:5001';
  const getToken = () => localStorage.getItem('token') || '';

  const fetchData = async () => {
    const token = getToken();
    if (!token) { router.push('/company/auth'); return; }
    try {
      const res = await fetch(`${apiBase}/api/companies/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      setCompany(await res.json());
    } catch { router.push('/company/auth'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReply = async () => {
    if (!activeTicket || !replyText.trim()) return;
    try {
      await fetch(`${apiBase}/api/executive/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId: activeTicket.id, content: replyText }),
      });
      setReplyText('');
      setMsg('Reply sent successfully!');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch { setMsg('Failed to send reply'); }
  };

  const handleResolve = async (id: string) => {
    try {
      await fetch(`${apiBase}/api/companies/inquiries/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setMsg('Ticket resolved!');
      setTimeout(() => setMsg(''), 3000);
      setActiveTicket(null);
      fetchData();
    } catch { setMsg('Failed to resolve'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!company) return null;

  const escalatedTickets = (company.inquiries || []).filter((i: any) => i.status === 'escalated' || i.status === 'pending');

  return (
    <div className="max-w-[1200px] mx-auto mt-8 mb-24 px-4 animate-fade-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Executive Queue</h1>
          <p className="text-[var(--text-secondary)] text-sm">{escalatedTickets.length} tickets requiring attention</p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn-outline py-2 px-5 text-sm">← Back to Dashboard</button>
      </div>

      {msg && (
        <div className="mb-6 px-5 py-3 rounded-xl text-sm font-semibold text-center bg-[rgba(0,255,100,0.1)] text-[#00ff64] border border-[#00ff64]/30 animate-fade-up">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          {escalatedTickets.length > 0 ? escalatedTickets.map((ticket: any) => (
            <div
              key={ticket.id}
              onClick={() => setActiveTicket(ticket)}
              className={`card p-4 cursor-pointer transition-all hover:border-[var(--accent)] ${
                activeTicket?.id === ticket.id ? 'border-[var(--accent)] bg-[rgba(59,130,246,0.05)]' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${ticket.status === 'escalated' ? 'bg-red-500 animate-pulse' : 'bg-orange-500 animate-pulse'}`}></div>
                <span className={`text-[10px] font-bold uppercase ${ticket.status === 'escalated' ? 'text-red-400' : 'text-orange-400'}`}>{ticket.status}</span>
              </div>
              <p className="font-semibold text-sm mb-1">{ticket.subject}</p>
              <p className="text-xs text-[var(--text-secondary)]">{ticket.email}</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          )) : (
            <div className="card p-8 text-center text-[var(--text-secondary)]">
              <p className="text-lg mb-2">🎉</p>
              <p className="text-sm">No escalated tickets! All clear.</p>
            </div>
          )}
        </div>

        {/* Conversation Thread */}
        <div className="md:col-span-2">
          {activeTicket ? (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{activeTicket.subject}</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{activeTicket.email} • Confidence: {(activeTicket.confidence * 100).toFixed(0)}%</p>
                </div>
                <button onClick={() => handleResolve(activeTicket.id)} className="btn-premium py-2 px-5 text-sm">
                  ✓ Resolve
                </button>
              </div>

              {/* AI Reasoning Summary */}
              {activeTicket.reasoningLogs?.[0] && (
                <div className="mb-6 p-4 rounded-xl bg-[rgba(139,92,246,0.05)] border border-purple-500/20">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">AI Reasoning</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Classification: <strong className="text-white">{activeTicket.reasoningLogs[0].classification}</strong> •
                    Confidence: <strong className="text-white">{(activeTicket.reasoningLogs[0].confidenceScore * 100).toFixed(0)}%</strong>
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{activeTicket.reasoningLogs[0].decisionReason}</p>
                </div>
              )}

              {/* Messages Timeline */}
              <div className="flex flex-col gap-4 mb-6 max-h-[400px] overflow-y-auto">
                {activeTicket.messages?.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      m.sender === 'customer'
                        ? 'bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] rounded-bl-sm'
                        : m.sender === 'ai'
                        ? 'bg-[rgba(59,130,246,0.1)] border border-[var(--accent)]/20 rounded-br-sm'
                        : 'bg-[rgba(0,255,100,0.05)] border border-[#00ff64]/20 rounded-br-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase ${
                          m.sender === 'customer' ? 'text-white' : m.sender === 'ai' ? 'text-[var(--accent)]' : 'text-[#00ff64]'
                        }`}>{m.sender === 'customer' ? 'Customer' : m.sender === 'ai' ? 'AI Agent' : 'Executive'}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p>{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="flex gap-3">
                <textarea
                  rows={2}
                  className="input-premium flex-1 h-auto !pt-3 resize-none"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
                <button onClick={handleReply} className="btn-premium px-6 self-end">Send</button>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-[var(--text-secondary)]">
              <p className="text-lg mb-2">←</p>
              <p className="text-sm">Select a ticket from the queue to view the conversation thread and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
