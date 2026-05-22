"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<any>({
    email: "",
    password: "",
    companyName: "",
    category: "Ecommerce",
    domain: "",
    refundPolicy: "",
    companyPolicy: "",
    infoUrl: "",
    policyFile: null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const endpoint = isLogin ? "/api/companies/login" : "/api/companies/register";
      
      let body: any;
      let headers: any = {};

      if (!isLogin && formData.policyFile) {
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSend.append(key, formData[key]);
          }
        });
        body = formDataToSend;
      } else {
        body = JSON.stringify(formData);
        headers = { "Content-Type": "application/json" };
      }

      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${hostname}:5001${endpoint}`, {
        method: "POST",
        headers,
        body,
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }
      
      localStorage.setItem("token", data.token);
      
      if (!isLogin) {
        setIsCompleted(true);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 3000);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-[550px] animate-fade-up">
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">
            Flowdesk {isLogin ? "Access" : "Onboarding"}
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">
            {isLogin ? "Welcome Back" : "Scale your Support"}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-[400px] mx-auto">
            {isLogin
              ? "Access your dashboard to manage customer flows."
              : "Set up your AI-powered support workspace in seconds."}
          </p>
        </div>

        <div className="premium-card min-h-[400px] flex flex-col justify-center">
          {isCompleted ? (
            <div className="text-center animate-fade-in flex flex-col items-center py-10">
              <div className="w-20 h-20 rounded-full bg-[rgba(0,255,100,0.1)] border border-[#00ff64] flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00ff64" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">Registration Completed!</h2>
              <p className="text-[var(--text-secondary)] mb-8">Welcome to the future of support. We are initializing your workspace...</p>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : (
            <>
              {!isLogin && (
                <div className="step-indicator">
                  <div className={`step-dot ${step === 1 ? 'active' : ''}`}></div>
                  <div className={`step-dot ${step === 2 ? 'active' : ''}`}></div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {isLogin ? (
              // LOGIN FORM
              <div className="flex flex-col gap-5 animate-fade-up">
                <div className="input-premium-wrapper">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    placeholder=" "
                    className="input-premium"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <label htmlFor="email" className="label-premium">Email Address</label>
                </div>
                <div className="input-premium-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    required
                    placeholder=" "
                    className="input-premium pr-12"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <label htmlFor="password" className="label-premium">Password</label>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
                <div className="flex justify-end -mt-2">
                  <Link href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                {error && <p className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
                <button type="submit" className="btn-premium w-full py-4 text-lg mt-2" disabled={loading}>
                  {loading ? "Verifying..." : "Access Dashboard"}
                </button>
              </div>
            ) : (
              // REGISTER FORM
              <>
                {step === 1 && (
                  <div className="flex flex-col gap-5 animate-slide-right">
                    <div className="input-premium-wrapper">
                      <input
                        type="text"
                        name="companyName"
                        id="companyName"
                        required
                        placeholder=" "
                        className="input-premium border-[var(--accent)] border-[1px]"
                        value={formData.companyName}
                        onChange={handleChange}
                      />
                      <label htmlFor="companyName" className="label-premium text-[var(--accent)] font-bold">Company / Brand Name</label>
                    </div>
                    <div className="input-premium-wrapper">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        placeholder=" "
                        className="input-premium"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      <label htmlFor="email" className="label-premium">Business Email</label>
                    </div>
                    <div className="input-premium-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        required
                        placeholder=" "
                        className="input-premium pr-12"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <label htmlFor="password" className="label-premium">Create Password</label>
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>

                    <div className="mt-2">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
                        Business Category
                      </label>
                      <div className="category-grid">
                        <div 
                          className={`category-card ${formData.category === 'Ecommerce' ? 'selected' : ''}`}
                          onClick={() => setFormData({...formData, category: 'Ecommerce'})}
                        >
                          <span className="category-icon">🛍️</span>
                          <span className="text-sm font-medium">E-commerce</span>
                        </div>
                        <div 
                          className={`category-card ${formData.category === 'SaaS' ? 'selected' : ''}`}
                          onClick={() => setFormData({...formData, category: 'SaaS'})}
                        >
                          <span className="category-icon">⚡</span>
                          <span className="text-sm font-medium">SaaS / Tech</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-premium w-full py-4 text-lg mt-2"
                    >
                      Continue Setup
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-6 animate-slide-right">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                      Back to Step 1
                    </button>

                    <div className="flex flex-col gap-5">
                      <div className="input-premium-wrapper">
                        <textarea
                          name={formData.category === "Ecommerce" ? "refundPolicy" : "companyPolicy"}
                          id="policy"
                          rows={4}
                          placeholder=" "
                          className="input-premium h-auto pt-5 resize-none"
                          value={formData.category === "Ecommerce" ? formData.refundPolicy : formData.companyPolicy || ""}
                          onChange={handleChange}
                        ></textarea>
                        <label htmlFor="policy" className="label-premium">
                          {formData.category === "Ecommerce" ? "Refund Policy (Text)" : "Company Guidelines (Text)"}
                        </label>
                      </div>

                      <div className="relative py-2 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[var(--glass-border)]"></span></div>
                        <span className="relative px-4 text-xs uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-secondary)]">OR</span>
                      </div>

                      <div 
                        className={`upload-zone ${formData.policyFile ? 'active border-[var(--accent)] bg-[rgba(59,130,246,0.05)]' : ''}`}
                        onClick={() => document.getElementById('policyFile')?.click()}
                      >
                        <input
                          type="file"
                          id="policyFile"
                          className="hidden"
                          accept=".pdf,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFormData({ ...formData, policyFile: e.target.files[0] });
                            }
                          }}
                        />
                        <div className="flex flex-col items-center text-center">
                          {formData.policyFile ? (
                            <>
                              <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                              </div>
                              <p className="text-sm font-bold text-white mb-1">
                                {formData.policyFile.name}
                              </p>
                              <p className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest">
                                File Ready for AI Training
                              </p>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] mb-3 opacity-50"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                              <p className="text-sm font-semibold mb-1">Upload Policy File</p>
                              <p className="text-xs text-[var(--text-secondary)]">PDF or DOCX (Max 10MB)</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="input-premium-wrapper">
                        <input
                          type="text"
                          name="infoUrl"
                          id="infoUrl"
                          placeholder=" "
                          className="input-premium"
                          value={formData.infoUrl || ""}
                          onChange={handleChange}
                        />
                        <label htmlFor="infoUrl" className="label-premium">Knowledge Base URL (Optional)</label>
                      </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
                    
                    <button type="submit" className="btn-premium w-full py-4 text-lg" disabled={loading}>
                      {loading ? "Initializing..." : "Complete Workspace Setup"}
                    </button>
                  </div>
                )}
              </>
            )}
          </form>
          </>
          )}
        </div>

        <p className="text-center mt-8 text-[var(--text-secondary)] text-sm">
          {isLogin ? "New to Flowdesk?" : "Already managing a company?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setStep(1);
              setError("");
            }}
            className="text-[var(--accent)] font-bold hover:underline ml-1"
          >
            {isLogin ? "Register your business" : "Login here"}
          </button>
        </p>
      </div>
    </div>
  );
}
