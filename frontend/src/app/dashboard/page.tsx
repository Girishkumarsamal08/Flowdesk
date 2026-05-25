"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'tickets' | 'settings'>('overview');

  const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5001` : 'http://localhost:5001';

  const fetchCompanyData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/company/auth"); return; }

    try {
      const res = await fetch(`${apiBase}/api/companies/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompany(data);
    } catch {
      localStorage.removeItem("token");
      router.push("/company/auth");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanyData(); }, []);

  const handleResolve = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBase}/api/companies/inquiries/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCompanyData();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--text-secondary)] text-sm">Initializing Workspace...</p>
      </div>
    </div>
  );
  if (!company) return null;

  const inquiries = company.inquiries || [];
  const pending = inquiries.filter((i: any) => i.status === 'pending');
  const escalated = inquiries.filter((i: any) => i.status === 'escalated');
  const resolvedAI = inquiries.filter((i: any) => i.status === 'resolved_ai');
  const resolvedHuman = inquiries.filter((i: any) => i.status === 'resolved_human');
  const totalResolved = resolvedAI.length + resolvedHuman.length;
  const aiRate = inquiries.length > 0 ? Math.round((resolvedAI.length / Math.max(totalResolved, 1)) * 100) : 0;
  const escalationRate = inquiries.length > 0 ? Math.round((escalated.length / inquiries.length) * 100) : 0;

  const navItems = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'tickets', label: 'Tickets', icon: '🎫' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto mt-8 mb-24 px-4 animate-fade-up">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">{company.companyName}</h1>
          <p className="text-[var(--text-secondary)] text-sm">{company.category} • {company.domain || company.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/company/onboarding" className="btn-outline py-2 px-5 text-sm">Configure</Link>
          <button
            onClick={() => { localStorage.removeItem("token"); router.push("/"); }}
            className="btn-outline py-2 px-5 text-sm hover:border-red-500 hover:text-red-400"
          >Sign Out</button>
        </div>
      </div>

      {/* Section Nav */}
      <div className="flex gap-2 mb-8 p-1.5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)]">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveSection(item.key as any)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeSection === item.key
                ? 'bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="flex flex-col gap-8 animate-fade-up">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6 border-l-4 border-blue-500">
              <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Total Tickets</h3>
              <p className="text-3xl font-black text-white">{inquiries.length}</p>
            </div>
            <div className="card p-6 border-l-4 border-orange-500">
              <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Pending</h3>
              <p className="text-3xl font-black text-orange-400">{pending.length}</p>
            </div>
            <div className="card p-6 border-l-4 border-[#00ff64]">
              <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">AI Resolution Rate</h3>
              <p className="text-3xl font-black text-[#00ff64]">{aiRate}%</p>
            </div>
            <div className="card p-6 border-l-4 border-red-500">
              <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Escalation Rate</h3>
              <p className="text-3xl font-black text-red-400">{escalationRate}%</p>
            </div>
          </div>

          {/* Quick Actions + Recent Tickets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 card p-6">
              <h2 className="text-xl font-bold mb-5">Recent Tickets</h2>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                {inquiries.length > 0 ? inquiries.slice(0, 10).map((inq: any) => (
                  <div key={inq.id} className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.04)] transition-all group">
                    <div className="flex gap-3 items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        inq.status === 'pending' ? 'bg-orange-500 animate-pulse' :
                        inq.status === 'escalated' ? 'bg-red-500 animate-pulse' :
                        'bg-[#00ff64]'
                      }`}></div>
                      <div>
                        <p className="font-semibold text-sm">{inq.subject}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{inq.email} • {new Date(inq.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {inq.confidence > 0 && (
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">{(inq.confidence * 100).toFixed(0)}%</span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        inq.status === 'resolved_ai' ? 'bg-[rgba(0,255,100,0.1)] text-[#00ff64]' :
                        inq.status === 'resolved_human' ? 'bg-[rgba(59,130,246,0.1)] text-blue-400' :
                        inq.status === 'escalated' ? 'bg-[rgba(255,0,0,0.1)] text-red-400' :
                        'bg-[rgba(255,165,0,0.1)] text-orange-400'
                      }`}>{inq.status.replace('_', ' ')}</span>
                      <Link href={`/dashboard/observability?id=${inq.id}`} className="text-[var(--accent)] text-xs opacity-0 group-hover:opacity-100 transition-opacity">View →</Link>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-[var(--text-secondary)] bg-[rgba(255,255,255,0.02)] rounded-2xl border border-dashed border-[var(--glass-border)]">
                    No tickets yet. Deploy your widget to start receiving inquiries.
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="card p-5 bg-gradient-to-br from-[rgba(59,130,246,0.05)] to-transparent">
                <h3 className="text-sm font-bold mb-4 text-[var(--accent)]">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Link href="/company/onboarding" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--glass-border)] hover:border-[var(--accent)] text-sm transition-all">
                    <span>🧠</span> Update Knowledge Base
                  </Link>
                  <Link href="/dashboard/executive" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--glass-border)] hover:border-[var(--accent)] text-sm transition-all">
                    <span>👨‍💼</span> Executive Queue
                  </Link>
                  <Link href="/dashboard/observability" className="flex items-center gap-2 p-3 rounded-xl border border-[var(--glass-border)] hover:border-[var(--accent)] text-sm transition-all">
                    <span>🔍</span> AI Observability
                  </Link>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-bold mb-3">Knowledge Base</h3>
                {company.kbDocuments?.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {company.kbDocuments.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-[rgba(255,255,255,0.02)]">
                        <span>📄</span>
                        <span className="flex-1 truncate">{doc.fileName}</span>
                        <span className="text-[var(--text-secondary)] uppercase">{doc.fileType}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)]">No documents uploaded yet.</p>
                )}
              </div>

              {/* Deploy Widget */}
              <div className="card p-5 border-[var(--accent)]/30 border">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <span className="text-[var(--accent)]">&lt;/&gt;</span> Deploy Widget
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mb-3">Embed the AI support widget on your site.</p>
                <Link href={`/widget/${company.id}`} target="_blank" className="btn-premium py-2 px-4 text-xs w-full text-center block">
                  Launch Preview
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TICKETS */}
      {activeSection === 'tickets' && (
        <div className="animate-fade-up">
          <div className="flex gap-4 mb-6">
            {[
              { label: 'All', count: inquiries.length },
              { label: 'Pending', count: pending.length },
              { label: 'Escalated', count: escalated.length },
              { label: 'Resolved (AI)', count: resolvedAI.length },
              { label: 'Resolved (Human)', count: resolvedHuman.length },
            ].map(f => (
              <span key={f.label} className="text-xs px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] text-[var(--text-secondary)]">
                {f.label}: <strong className="text-white">{f.count}</strong>
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {inquiries.map((inq: any) => (
              <div key={inq.id} className="card p-5 flex items-start justify-between group">
                <div className="flex gap-4 items-start flex-1">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    inq.status === 'pending' ? 'bg-orange-500 animate-pulse' :
                    inq.status === 'escalated' ? 'bg-red-500 animate-pulse' :
                    'bg-[#00ff64]'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-bold text-lg mb-1">{inq.subject}</p>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">{inq.email} • {new Date(inq.createdAt).toLocaleString()}</p>
                    {inq.messages?.[0] && (
                      <p className="text-sm text-[var(--text-secondary)] bg-[rgba(255,255,255,0.02)] p-3 rounded-xl max-w-[600px]">
                        &ldquo;{inq.messages[0].content.substring(0, 200)}{inq.messages[0].content.length > 200 ? '...' : ''}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    inq.status === 'resolved_ai' ? 'bg-[rgba(0,255,100,0.1)] text-[#00ff64] border border-[#00ff64]/20' :
                    inq.status === 'resolved_human' ? 'bg-[rgba(59,130,246,0.1)] text-blue-400 border border-blue-400/20' :
                    inq.status === 'escalated' ? 'bg-[rgba(255,0,0,0.1)] text-red-400 border border-red-500/20' :
                    'bg-[rgba(255,165,0,0.1)] text-orange-400 border border-orange-400/20'
                  }`}>{inq.status.replace('_', ' ')}</span>
                  {(inq.status === 'pending' || inq.status === 'escalated') && (
                    <button onClick={() => handleResolve(inq.id)} className="btn-premium py-2 px-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Resolve
                    </button>
                  )}
                  <Link href={`/dashboard/observability?id=${inq.id}`} className="text-[var(--accent)] text-xs font-semibold hover:underline">Inspect →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {activeSection === 'settings' && (
        <div className="animate-fade-up grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Organization</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">Company Name</span><span className="font-semibold">{company.companyName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">Category</span><span className="font-semibold">{company.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">Domain</span><span className="font-semibold">{company.domain || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">Support Email</span><span className="font-semibold">{company.supportEmail || '—'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--text-secondary)]">Organization ID</span><span className="font-mono text-xs text-[var(--accent)]">{company.id}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">API Integration</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">Base URL</span><span className="font-mono text-xs">{company.apiBaseUrl || 'Not configured'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)]">Auth Type</span><span className="font-semibold">{company.apiAuthType || 'None'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--text-secondary)]">Data Mappings</span>
                <span className="font-semibold">{company.dataMappings ? Object.keys(company.dataMappings).length : 0} configured</span>
              </div>
            </div>
            <Link href="/company/onboarding" className="btn-outline py-2 px-4 text-xs mt-4 block text-center">
              Edit Configuration →
            </Link>
          </div>

          {/* Widget Embed */}
          <div className="md:col-span-2 card p-6 border-[var(--accent)]/20 border">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-[var(--accent)]">&lt;/&gt;</span> Widget Embed Code
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Copy and paste this code into your website&apos;s HTML to deploy AI support.</p>
            <pre className="bg-[#0a0a0c] p-5 rounded-xl overflow-x-auto text-sm text-[#a1a1aa] border border-[var(--glass-border)]">
              <code>{`<!-- Flowdesk AI Widget -->
<iframe
  src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget/${company.id}"
  width="420" height="650"
  style="position:fixed;bottom:20px;right:20px;border:none;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,0.5);z-index:9999;"
></iframe>`}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
