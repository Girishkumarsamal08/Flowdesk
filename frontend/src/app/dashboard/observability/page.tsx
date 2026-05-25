"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ObservabilityPage() {
  const router = useRouter();
  const [inquiryId, setInquiryId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5001` : 'http://localhost:5001';
  const getToken = () => localStorage.getItem('token') || '';

  const fetchObservability = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/inquiries/${id}/reasoning`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (inquiryId) fetchObservability(inquiryId);
  };

  return (
    <div className="max-w-[900px] mx-auto mt-8 mb-24 p-4 animate-fade-up">
      <h1 className="text-3xl font-bold mb-6 text-center">🧩 AI Observability Panel</h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter Inquiry ID"
          className="input-premium flex-1"
          value={inquiryId}
          onChange={e => setInquiryId(e.target.value)}
        />
        <button onClick={handleSearch} className="btn-premium px-6" disabled={loading || !inquiryId}>
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {data && (
        <div className="space-y-8">
          {/* Messages */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Conversation Timeline</h2>
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto p-4 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[var(--glass-border)]">
              {data.messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`p-3 rounded-xl text-sm max-w-[70%] ${msg.sender === 'customer' ? 'bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)]' : msg.sender === 'ai' ? 'bg-[rgba(59,130,246,0.1)] border border-[var(--accent)]/20' : 'bg-[rgba(0,255,100,0.05)] border border-[#00ff64]/20'}`}> 
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className={`font-bold ${msg.sender === 'customer' ? 'text-white' : msg.sender === 'ai' ? 'text-[var(--accent)]' : 'text-[#00ff64]'}`}>
                        {msg.sender === 'customer' ? 'Customer' : msg.sender === 'ai' ? 'AI Agent' : 'Executive'}
                      </span>
                      <span className="text-[var(--text-secondary)]">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Reasoning Logs */}
          <section>
            <h2 className="text-xl font-semibold mb-3">AI Reasoning Trace</h2>
            {data.reasoningLogs.map((log: any) => (
              <div key={log.id} className="p-4 rounded-xl bg-[rgba(139,92,246,0.05)] border border-purple-500/20 mb-4">
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  <span className="font-bold text-purple-400">Timestamp:</span> {new Date(log.timestamp).toLocaleString()}
                </p>
                <p className="text-sm mb-2"><span className="font-bold text-purple-400">Classification:</span> {log.classification}</p>
                <p className="text-sm mb-2"><span className="font-bold text-purple-400">Confidence:</span> {(log.confidenceScore * 100).toFixed(0)}%</p>
                <p className="text-sm mb-2"><span className="font-bold text-purple-400">Decision Reason:</span> {log.decisionReason}</p>
                {log.retrievedChunks && (
                  <div className="mt-2">
                    <p className="font-semibold text-purple-300 mb-1">Retrieved Policy Snippets:</p>
                    <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] space-y-1">
                      {log.retrievedChunks.map((c: string, i: number) => (
                        <li key={i}>{c.substring(0, 120)}{c.length > 120 ? '...' : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* API Call Logs */}
          <section>
            <h2 className="text-xl font-semibold mb-3">External API Call Log</h2>
            {data.apiCallLogs.map((log: any) => (
              <div key={log.id} className="p-4 rounded-xl bg-[rgba(0,255,100,0.05)] border border-[#00ff64]/20 mb-2">
                <p className="text-sm font-mono mb-1">{log.method} {log.endpoint} → {log.statusCode}</p>
                {log.requestBody && (
                  <pre className="bg-[rgba(255,255,255,0.02)] p-2 rounded mb-1 text-xs overflow-x-auto">REQ: {JSON.stringify(log.requestBody)}</pre>
                )}
                {log.responseBody && (
                  <pre className="bg-[rgba(255,255,255,0.02)] p-2 rounded text-xs overflow-x-auto">RES: {JSON.stringify(log.responseBody)}</pre>
                )}
                <p className="text-xs text-[var(--text-secondary)]">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
