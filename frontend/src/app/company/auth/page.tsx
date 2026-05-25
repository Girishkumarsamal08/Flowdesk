"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  { id: 'SaaS', label: 'SaaS / Tech', icon: '⚡' },
  { id: 'Hosting', label: 'Hosting', icon: '🌐' },
  { id: 'Cloud', label: 'Cloud Platform', icon: '☁️' },
  { id: 'Subscription', label: 'Subscription', icon: '🔄' },
  { id: 'CMS', label: 'CMS Platform', icon: '📝' },
  { id: 'Developer', label: 'Developer Tools', icon: '🛠️' },
  { id: 'FinTech', label: 'FinTech', icon: '💳' },
  { id: 'Ecommerce', label: 'E-commerce', icon: '🛍️' },
  { id: 'Digital', label: 'Digital Products', icon: '📦' },
  { id: 'Other', label: 'Other', icon: '🏢' },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState<any>({
    email: "",
    password: "",
    companyName: "",
    category: "SaaS",
    domain: "",
    supportEmail: "",
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
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

      const res = await fetch(`http://${hostname}:5001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      localStorage.setItem("token", data.token);

      if (!isLogin) {
        setIsCompleted(true);
        setTimeout(() => {
          // Redirect to onboarding wizard instead of dashboard
          window.location.href = "/company/onboarding";
        }, 2500);
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
            {isLogin ? "Welcome Back" : "Launch Your AI Support"}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-[400px] mx-auto">
            {isLogin
              ? "Access your dashboard to manage customer flows."
              : "Register your company to deploy autonomous AI support."}
          </p>
        </div>

        <div className="premium-card min-h-[400px] flex flex-col justify-center">
          {isCompleted ? (
            <div className="text-center animate-fade-in flex flex-col items-center py-10">
              <div className="w-20 h-20 rounded-full bg-[rgba(0,255,100,0.1)] border border-[#00ff64] flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00ff64" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">Registration Complete!</h2>
              <p className="text-[var(--text-secondary)] mb-8">Redirecting to your configuration wizard...</p>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {isLogin ? (
                /* LOGIN FORM */
                <div className="flex flex-col gap-5 animate-fade-up">
                  <div className="input-premium-wrapper">
                    <input type="email" name="email" id="login-email" required placeholder=" " className="input-premium" value={formData.email} onChange={handleChange} />
                    <label htmlFor="login-email" className="label-premium">Email Address</label>
                  </div>
                  <div className="input-premium-wrapper">
                    <input type={showPassword ? "text" : "password"} name="password" id="login-password" required placeholder=" " className="input-premium pr-12" value={formData.password} onChange={handleChange} />
                    <label htmlFor="login-password" className="label-premium">Password</label>
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div className="flex justify-end -mt-2">
                    <Link href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Forgot password?</Link>
                  </div>
                  {error && <p className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
                  <button type="submit" className="btn-premium w-full py-4 text-lg mt-2" disabled={loading}>
                    {loading ? "Verifying..." : "Access Dashboard"}
                  </button>
                </div>
              ) : (
                /* REGISTER FORM */
                <div className="flex flex-col gap-5 animate-fade-up">
                  <div className="input-premium-wrapper">
                    <input type="text" name="companyName" id="reg-company" required placeholder=" " className="input-premium border-[var(--accent)] border-[1px]" value={formData.companyName} onChange={handleChange} />
                    <label htmlFor="reg-company" className="label-premium text-[var(--accent)] font-bold">Company / Brand Name</label>
                  </div>
                  <div className="input-premium-wrapper">
                    <input type="email" name="email" id="reg-email" required placeholder=" " className="input-premium" value={formData.email} onChange={handleChange} />
                    <label htmlFor="reg-email" className="label-premium">Work Email</label>
                  </div>
                  <div className="input-premium-wrapper">
                    <input type={showPassword ? "text" : "password"} name="password" id="reg-password" required placeholder=" " className="input-premium pr-12" value={formData.password} onChange={handleChange} />
                    <label htmlFor="reg-password" className="label-premium">Create Password</label>
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="input-premium-wrapper">
                      <input type="text" name="domain" id="reg-domain" placeholder=" " className="input-premium" value={formData.domain} onChange={handleChange} />
                      <label htmlFor="reg-domain" className="label-premium">Domain</label>
                    </div>
                    <div className="input-premium-wrapper">
                      <input type="email" name="supportEmail" id="reg-support" placeholder=" " className="input-premium" value={formData.supportEmail} onChange={handleChange} />
                      <label htmlFor="reg-support" className="label-premium">Support Email</label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">Business Category</label>
                    <div className="grid grid-cols-5 gap-2">
                      {CATEGORIES.map(cat => (
                        <div
                          key={cat.id}
                          className={`category-card flex flex-col items-center gap-1.5 py-3 px-1 ${formData.category === cat.id ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                        >
                          <span className="text-xl">{cat.icon}</span>
                          <span className="text-[10px] font-medium text-center leading-tight">{cat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
                  <button type="submit" className="btn-premium w-full py-4 text-lg mt-2" disabled={loading}>
                    {loading ? "Creating Workspace..." : "Register & Configure →"}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-[var(--text-secondary)] text-sm">
          {isLogin ? "New to Flowdesk?" : "Already managing a company?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
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
