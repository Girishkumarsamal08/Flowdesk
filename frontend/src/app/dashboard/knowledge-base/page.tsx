"use client";

import { useState } from "react";
import Link from "next/link";

export default function KnowledgeBasePage() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hardcode companyId for testing
  const companyId = "test-company-123";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsLoading(true);
    setStatus("Uploading to Vector Database...");

    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${hostname}:5001/api/knowledge-base`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, text })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setStatus("✅ Knowledge Base updated successfully! The AI now knows this information.");
      setText("");
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 mb-24 px-4 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Update Knowledge Base</h1>
          <p className="text-[var(--text-secondary)]">Train your AI Chatbot by uploading policies and FAQs.</p>
        </div>
        <Link href="/dashboard" className="btn border border-[var(--glass-border)] py-2 px-4 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors">
          Back
        </Link>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Paste Policy Text, FAQs, or Business Rules
            </label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: We offer a 30-day money-back guarantee on all digital products..."
              className="input-field min-h-[200px]"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !text.trim()}
            className="w-full btn-primary py-3 disabled:opacity-50"
          >
            {isLoading ? "Training AI..." : "Ingest into Vector Store"}
          </button>

          {status && (
            <div className={`mt-4 p-4 rounded-xl border ${status.includes('✅') ? 'border-[#00ff64] bg-[rgba(0,255,100,0.05)] text-[#00ff64]' : 'border-[var(--glass-border)]'}`}>
              {status}
            </div>
          )}
        </form>
      </div>

      <div className="mt-8">
        <Link href="/chatbot" target="_blank" className="text-[var(--accent)] hover:underline">
          Test Chatbot with new knowledge ↗
        </Link>
      </div>
    </div>
  );
}
