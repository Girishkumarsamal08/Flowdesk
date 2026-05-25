"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_MAPPINGS: Record<string, string> = {
  'Customer Profile': '/customer',
  'Bandwidth Usage': '/user/usage',
  'Membership Tier': '/membership/status',
  'Invoices': '/billing/invoices',
  'Orders': '/orders',
  'Tracking': '/orders/tracking',
  'Service Health': '/status',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  // API Integration State
  const [apiConfig, setApiConfig] = useState({
    apiBaseUrl: '',
    apiAuthType: 'none',
    apiAuthToken: '',
    apiHeaders: {} as Record<string, string>,
  });
  const [headerKey, setHeaderKey] = useState('');
  const [headerVal, setHeaderVal] = useState('');

  // Swagger State
  const [swaggerText, setSwaggerText] = useState('');
  const [parsedEndpoints, setParsedEndpoints] = useState<any[]>([]);

  // Concept Mapping State
  const [dataMappings, setDataMappings] = useState<Record<string, string>>(DEFAULT_MAPPINGS);

  // KB Upload State
  const [kbFiles, setKbFiles] = useState<any[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  const apiBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5001` : 'http://localhost:5001';
  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    if (!getToken()) {
      router.push('/company/auth');
    }
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  // ---- KB Upload ----
  const handleKBUpload = async () => {
    if (kbFiles.length === 0) return showMessage('Please select files to upload', 'error');
    setLoading(true);
    for (const file of kbFiles) {
      const fd = new FormData();
      fd.append('kbFile', file);
      try {
        const res = await fetch(`${apiBase}/api/companies/upload-kb`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${getToken()}` },
          body: fd,
        });
        const data = await res.json();
        if (res.ok) {
          setUploadedDocs(prev => [...prev, data.document]);
        } else {
          showMessage(data.message || 'Upload failed', 'error');
        }
      } catch {
        showMessage('Network error uploading file', 'error');
      }
    }
    setKbFiles([]);
    showMessage('Knowledge base files processed successfully!');
    setLoading(false);
  };

  // ---- API Config Save ----
  const handleSaveAPIConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/companies/config`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...apiConfig,
          dataMappings,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('API Configuration saved successfully!');
      } else {
        showMessage(data.message || 'Failed to save config', 'error');
      }
    } catch {
      showMessage('Network error saving configuration', 'error');
    }
    setLoading(false);
  };

  // ---- Swagger Parse ----
  const handleSwaggerParse = async () => {
    if (!swaggerText.trim()) return showMessage('Please paste Swagger/OpenAPI schema', 'error');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/swagger/parse`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ swaggerSchema: swaggerText }),
      });
      const data = await res.json();
      if (res.ok) {
        setParsedEndpoints(data.endpoints);
        showMessage(`Parsed ${data.count} endpoints successfully!`);
      } else {
        showMessage(data.message || data.error || 'Parse failed', 'error');
      }
    } catch {
      showMessage('Network error parsing swagger', 'error');
    }
    setLoading(false);
  };

  const addHeader = () => {
    if (headerKey && headerVal) {
      setApiConfig(prev => ({
        ...prev,
        apiHeaders: { ...prev.apiHeaders, [headerKey]: headerVal }
      }));
      setHeaderKey('');
      setHeaderVal('');
    }
  };

  const tabs = [
    { label: 'Knowledge Base', icon: '🧠' },
    { label: 'API Integration', icon: '🔌' },
    { label: 'Swagger / OpenAPI', icon: '📋' },
    { label: 'Concept Mapping', icon: '🗺️' },
  ];

  return (
    <div className="max-w-[900px] mx-auto mt-8 mb-24 px-4 animate-fade-up">
      <div className="text-center mb-10">
        <div className="inline-block px-4 py-1.5 rounded-full bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">
          Step 2 of 2
        </div>
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Configure Your AI Support</h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-[600px] mx-auto">
          Connect your knowledge base, APIs, and business logic so FlowDesk can autonomously resolve customer issues.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 p-1.5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)]">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === i
                ? 'bg-[var(--accent)] text-white shadow-lg shadow-blue-500/20'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Message Toast */}
      {msg && (
        <div className={`mb-6 px-5 py-3 rounded-xl text-sm font-semibold text-center animate-fade-up ${
          msgType === 'success'
            ? 'bg-[rgba(0,255,100,0.1)] text-[#00ff64] border border-[#00ff64]/30'
            : 'bg-[rgba(255,0,0,0.1)] text-red-400 border border-red-500/30'
        }`}>
          {msg}
        </div>
      )}

      <div className="premium-card !p-8">
        {/* TAB 0: Knowledge Base Upload */}
        {activeTab === 0 && (
          <div className="flex flex-col gap-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-bold mb-2">Upload Knowledge Base</h2>
              <p className="text-[var(--text-secondary)] text-sm">Upload your company&apos;s policy documents, FAQs, troubleshooting guides, and product docs. Supports PDF, DOCX, TXT, and Markdown files.</p>
            </div>

            <div
              className="upload-zone cursor-pointer"
              onClick={() => document.getElementById('kb-input')?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('active'); }}
              onDragLeave={e => { e.currentTarget.classList.remove('active'); }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.classList.remove('active');
                if (e.dataTransfer.files) setKbFiles(Array.from(e.dataTransfer.files));
              }}
            >
              <input
                type="file"
                id="kb-input"
                className="hidden"
                multiple
                accept=".pdf,.docx,.txt,.md"
                onChange={e => { if (e.target.files) setKbFiles(Array.from(e.target.files)); }}
              />
              <div className="flex flex-col items-center text-center py-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] mb-3 opacity-70"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <p className="text-sm font-semibold mb-1">Drag & drop files here, or click to browse</p>
                <p className="text-xs text-[var(--text-secondary)]">PDF, DOCX, TXT, Markdown — Max 10MB each</p>
              </div>
            </div>

            {kbFiles.length > 0 && (
              <div className="flex flex-col gap-2">
                {kbFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(59,130,246,0.05)] border border-[var(--accent)]/20">
                    <span className="text-lg">📄</span>
                    <span className="text-sm font-medium flex-1">{f.name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
                <button onClick={handleKBUpload} className="btn-premium py-3 mt-2" disabled={loading}>
                  {loading ? 'Processing...' : `Upload ${kbFiles.length} File(s)`}
                </button>
              </div>
            )}

            {uploadedDocs.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Uploaded Documents</h3>
                <div className="flex flex-col gap-2">
                  {uploadedDocs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(0,255,100,0.03)] border border-[#00ff64]/20">
                      <span className="text-[#00ff64]">✓</span>
                      <span className="text-sm font-medium">{doc.fileName}</span>
                      <span className="text-xs text-[var(--text-secondary)] uppercase">{doc.fileType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: API Integration */}
        {activeTab === 1 && (
          <div className="flex flex-col gap-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-bold mb-2">API Stack Integration</h2>
              <p className="text-[var(--text-secondary)] text-sm">Connect your company&apos;s backend API so FlowDesk can query live customer data, execute actions, and resolve issues autonomously.</p>
            </div>

            <div className="input-premium-wrapper">
              <input type="text" id="api-base" placeholder=" " className="input-premium" value={apiConfig.apiBaseUrl} onChange={e => setApiConfig(p => ({ ...p, apiBaseUrl: e.target.value }))} />
              <label htmlFor="api-base" className="label-premium">Base URL (e.g. https://api.yourcompany.com)</label>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">Authentication Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['none', 'bearer', 'api_key', 'custom_headers'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      apiConfig.apiAuthType === t
                        ? 'border-[var(--accent)] bg-[rgba(59,130,246,0.1)] text-white'
                        : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-white/20'
                    }`}
                    onClick={() => setApiConfig(p => ({ ...p, apiAuthType: t }))}
                  >
                    {t === 'none' ? 'None' : t === 'bearer' ? 'Bearer Token' : t === 'api_key' ? 'API Key' : 'Custom Headers'}
                  </button>
                ))}
              </div>
            </div>

            {(apiConfig.apiAuthType === 'bearer' || apiConfig.apiAuthType === 'api_key') && (
              <div className="input-premium-wrapper">
                <input type="text" id="api-token" placeholder=" " className="input-premium" value={apiConfig.apiAuthToken} onChange={e => setApiConfig(p => ({ ...p, apiAuthToken: e.target.value }))} />
                <label htmlFor="api-token" className="label-premium">{apiConfig.apiAuthType === 'bearer' ? 'Bearer Token' : 'API Key'}</label>
              </div>
            )}

            {apiConfig.apiAuthType === 'custom_headers' && (
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">Custom Headers</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="Header Key" className="input-premium flex-1 !mb-0" value={headerKey} onChange={e => setHeaderKey(e.target.value)} />
                  <input type="text" placeholder="Value" className="input-premium flex-1 !mb-0" value={headerVal} onChange={e => setHeaderVal(e.target.value)} />
                  <button type="button" onClick={addHeader} className="btn-premium !px-4 !py-2 text-sm">Add</button>
                </div>
                {Object.entries(apiConfig.apiHeaders).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] mb-2 text-sm">
                    <span className="font-mono text-[var(--accent)]">{k}</span>
                    <span className="text-[var(--text-secondary)]">→</span>
                    <span className="font-mono">{v}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleSaveAPIConfig} className="btn-premium py-3" disabled={loading}>
              {loading ? 'Saving...' : 'Save API Configuration'}
            </button>
          </div>
        )}

        {/* TAB 2: Swagger / OpenAPI */}
        {activeTab === 2 && (
          <div className="flex flex-col gap-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-bold mb-2">Swagger / OpenAPI Ingestion</h2>
              <p className="text-[var(--text-secondary)] text-sm">Paste your Swagger JSON or OpenAPI YAML specification below. FlowDesk will automatically parse all endpoints, methods, parameters, and schemas.</p>
            </div>

            <textarea
              rows={12}
              className="input-premium h-auto !pt-4 resize-none font-mono text-sm"
              placeholder={'Paste your Swagger JSON or OpenAPI YAML here...\n\n{\n  "openapi": "3.0.0",\n  "paths": { ... }\n}'}
              value={swaggerText}
              onChange={e => setSwaggerText(e.target.value)}
            />

            <button onClick={handleSwaggerParse} className="btn-premium py-3" disabled={loading}>
              {loading ? 'Parsing...' : 'Parse & Register Endpoints'}
            </button>

            {parsedEndpoints.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#00ff64] uppercase tracking-wider mb-3">✓ {parsedEndpoints.length} Endpoints Detected</h3>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                  {parsedEndpoints.map((ep, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ep.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                        ep.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                        ep.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                        ep.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{ep.method}</span>
                      <span className="font-mono text-sm flex-1">{ep.path}</span>
                      <span className="text-xs text-[var(--text-secondary)] max-w-[200px] truncate">{ep.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Concept Mapping */}
        {activeTab === 3 && (
          <div className="flex flex-col gap-6 animate-fade-up">
            <div>
              <h2 className="text-2xl font-bold mb-2">Business Data Mapping</h2>
              <p className="text-[var(--text-secondary)] text-sm">Map business concepts to your API endpoints. FlowDesk uses these mappings to determine which APIs to call when resolving specific issue categories.</p>
            </div>

            <div className="flex flex-col gap-3">
              {Object.entries(dataMappings).map(([concept, endpoint]) => (
                <div key={concept} className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-[rgba(59,130,246,0.05)] border border-[var(--accent)]/20 text-sm font-semibold">
                    {concept}
                  </div>
                  <span className="text-[var(--accent)] text-lg">→</span>
                  <input
                    type="text"
                    className="input-premium flex-1 !mb-0 font-mono text-sm"
                    value={endpoint}
                    onChange={e => setDataMappings(p => ({ ...p, [concept]: e.target.value }))}
                    placeholder="/api/endpoint"
                  />
                </div>
              ))}
            </div>

            <button onClick={handleSaveAPIConfig} className="btn-premium py-3" disabled={loading}>
              {loading ? 'Saving...' : 'Save Mappings & Configuration'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
          className="btn-outline py-3 px-6"
          disabled={activeTab === 0}
        >
          ← Previous
        </button>
        {activeTab < tabs.length - 1 ? (
          <button
            onClick={() => setActiveTab(activeTab + 1)}
            className="btn-premium py-3 px-6"
          >
            Next Step →
          </button>
        ) : (
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-premium py-3 px-8 bg-gradient-to-r from-[var(--accent)] to-[#8b5cf6]"
          >
            🚀 Launch Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
