"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanyData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/company/auth");
      return;
    }

    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${hostname}:5001/api/companies/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompany(data);
    } catch (err) {
      localStorage.removeItem("token");
      router.push("/company/auth");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [router]);

  const handleResolve = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${hostname}:5001/api/companies/inquiries/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCompanyData(); // Refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center mt-24">Initializing Workspace...</div>;
  if (!company) return null;

  return (
    <div className="max-w-[1200px] mx-auto mt-12 mb-24 px-4 animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome, {company.companyName}</h1>
          <p className="text-[var(--text-secondary)]">Manage your support operations and AI agents.</p>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/");
          }}
          className="btn-outline px-6 py-2"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* STAT CARDS */}
        <div className="card p-8 border-l-4 border-blue-500">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Pending Inquiries</h3>
          <p className="text-4xl font-black text-white">
            {company.inquiries?.filter((i: any) => i.status === 'pending').length || 0}
          </p>
        </div>
        <div className="card p-8 border-l-4 border-[#00ff64]">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">AI Resolution Rate</h3>
          <p className="text-4xl font-black text-[#00ff64]">92%</p>
        </div>
        <div className="card p-8 border-l-4 border-[var(--accent)]">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Total Inquiries</h3>
          <p className="text-4xl font-black text-white">{company.inquiries?.length || 0}</p>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="md:col-span-2 card p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Recent Customer Inquiries</h2>
            <div className="flex gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-1 bg-[rgba(255,255,255,0.05)] rounded">Real-time</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {company.inquiries?.length > 0 ? (
              company.inquiries.map((inquiry: any) => (
                <div key={inquiry.id} className="p-5 border border-[var(--glass-border)] rounded-2xl bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.03)] transition-all flex justify-between items-center group">
                  <div className="flex gap-4 items-center">
                    <div className={`w-2 h-2 rounded-full ${inquiry.status === 'pending' ? 'bg-orange-500 animate-pulse' : 'bg-[#00ff64]'}`}></div>
                    <div>
                      <p className="font-bold text-white text-lg">{inquiry.subject}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{inquiry.email} • {new Date(inquiry.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {inquiry.status === 'resolved_ai' && (
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-black bg-[rgba(0,255,100,0.1)] text-[#00ff64] uppercase tracking-wider border border-[#00ff64]/20">
                        Resolved by AI
                      </span>
                    )}
                    {inquiry.status === 'resolved_human' && (
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-black bg-[rgba(59,130,246,0.1)] text-[var(--accent)] uppercase tracking-wider border border-[var(--accent)]/20">
                        Executive Handled
                      </span>
                    )}
                    {inquiry.status === 'pending' && (
                      <button 
                        onClick={() => handleResolve(inquiry.id)}
                        className="opacity-0 group-hover:opacity-100 btn-premium py-2 px-4 text-xs transition-all"
                      >
                        Resolve Manually
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[var(--text-secondary)] bg-[rgba(255,255,255,0.02)] rounded-2xl border border-dashed border-[var(--glass-border)]">
                No inquiries found yet.
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 bg-gradient-to-br from-[rgba(59,130,246,0.05)] to-transparent">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--accent)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link href="/dashboard/knowledge-base" className="flex items-center gap-3 w-full p-4 rounded-xl border border-[var(--glass-border)] hover:border-[var(--accent)] hover:bg-[rgba(59,130,246,0.05)] text-white transition-all text-sm group">
                <span className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] group-hover:bg-[var(--accent)] transition-colors">🧠</span>
                Update AI Knowledge
              </Link>
              <button className="flex items-center gap-3 w-full p-4 rounded-xl border border-[var(--glass-border)] hover:border-[var(--accent)] hover:bg-[rgba(59,130,246,0.05)] text-white transition-all text-sm group">
                <span className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] group-hover:bg-[var(--accent)] transition-colors">🔌</span>
                Integrate Email/API
              </button>
              <button className="flex items-center gap-3 w-full p-4 rounded-xl border border-[var(--glass-border)] hover:border-[var(--accent)] hover:bg-[rgba(59,130,246,0.05)] text-white transition-all text-sm group">
                <span className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] group-hover:bg-[var(--accent)] transition-colors">📊</span>
                View Analytics
              </button>
            </div>
          </div>
          
          <div className="card p-6 border-dashed border-2 border-[var(--glass-border)] bg-transparent">
            <h3 className="text-sm font-bold mb-2">Need Help?</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Our premium support agents are available 24/7 for you.</p>
            <Link href="mailto:support@flowdesk.com" className="text-xs text-[var(--accent)] font-bold hover:underline">Contact Flowdesk Support ↗</Link>
          </div>
        </div>

        {/* WIDGET EMBED SECTION */}
        <div className="md:col-span-3 card p-8 border-[var(--accent)] border-[0.5px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                Deploy Your AI Agent
              </h2>
              <p className="text-[var(--text-secondary)] max-w-2xl">Copy and paste this embed code into your website's HTML to provide instant AI support to your customers.</p>
            </div>
            <Link href={`/widget/${company.id}`} target="_blank" className="btn-premium px-6 py-2 text-sm flex items-center gap-2 shadow-blue-500/20">
              Launch Preview
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </Link>
          </div>
          
          <div className="relative group">
            <pre className="bg-[#0a0a0c] p-6 rounded-2xl overflow-x-auto text-sm text-[#a1a1aa] border border-[var(--glass-border)] group-hover:border-[var(--accent)] transition-all">
              <code>
{`<!-- Flowdesk AI Widget -->
<iframe 
  src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget/${company.id}" 
  width="400" 
  height="600" 
  style="position: fixed; bottom: 20px; right: 20px; border: none; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999;"
></iframe>`}
              </code>
            </pre>
            <button className="absolute top-6 right-6 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white px-4 py-2 rounded-xl text-xs transition-colors">
              Copy Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
