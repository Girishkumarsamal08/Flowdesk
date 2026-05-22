import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-container animate-fade-up">
        <h1 className="hero-title">
          FLOWDESK
        </h1>
        <p className="hero-subtitle">
          &ldquo;Automating Customer Support from Query to Resolution with the power of AI.&rdquo;
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/company/auth"
            className="btn-premium"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="btn-outline"
          >
            Explore Features
          </Link>
          <Link
            href="#workflow"
            className="btn-outline"
          >
            Step for Work Execution
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">Why Flowdesk?</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Experience the future of customer support with our autonomous AI engine.
          </p>
        </div>

        <div className="features-section">
          <div className="feature-card reveal-anim" style={{ animationDelay: '0.1s' }}>
            <span className="feature-icon">⚡</span>
            <h3 className="feature-title">24/7 Autonomous Support</h3>
            <p className="feature-desc">
              Instantly handle customer queries anytime, without human intervention.
            </p>
          </div>

          <div className="feature-card reveal-anim" style={{ animationDelay: '0.2s' }}>
            <span className="feature-icon">🧠</span>
            <h3 className="feature-title">AI-Powered Resolution</h3>
            <p className="feature-desc">
              Uses intelligent policy-based responses to resolve issues accurately.
            </p>
          </div>

          <div className="feature-card reveal-anim" style={{ animationDelay: '0.3s' }}>
            <span className="feature-icon">🚨</span>
            <h3 className="feature-title">Smart Escalation</h3>
            <p className="feature-desc">
              Detects frustration and routes cases to human agents only when needed.
            </p>
          </div>

          <div className="feature-card reveal-anim" style={{ animationDelay: '0.4s' }}>
            <span className="feature-icon">📊</span>
            <h3 className="feature-title">Complete Analytics</h3>
            <p className="feature-desc">
              Track interactions, resolution rates, and sentiment in real-time.
            </p>
          </div>

          <div className="feature-card reveal-anim" style={{ animationDelay: '0.5s' }}>
            <span className="feature-icon">🔗</span>
            <h3 className="feature-title">Universal Integration</h3>
            <p className="feature-desc">
              Works with emails, contact forms, and any platform out of the box.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 border-t border-[var(--glass-border)]">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">How Flowdesk Works</h2>
          <p className="text-[var(--text-secondary)]">Simple. Automated. Efficient.</p>
        </div>

        <div className="workflow-container">
          <div className="workflow-step reveal-anim" style={{ animationDelay: '0.6s' }}>
            <div className="workflow-number">01</div>
            <div className="workflow-content">
              <h3>Customer Sends Query</h3>
              <p>Users submit requests via email or contact form.</p>
            </div>
          </div>

          <div className="workflow-step reveal-anim" style={{ animationDelay: '0.7s' }}>
            <div className="workflow-number">02</div>
            <div className="workflow-content">
              <h3>AI Understands & Responds</h3>
              <p>Flowdesk analyzes and generates a policy-based response instantly.</p>
            </div>
          </div>

          <div className="workflow-step reveal-anim" style={{ animationDelay: '0.8s' }}>
            <div className="workflow-number">03</div>
            <div className="workflow-content">
              <h3>Smart Resolution</h3>
              <p>The system continues conversation until the issue is resolved.</p>
            </div>
          </div>

          <div className="workflow-step reveal-anim" style={{ animationDelay: '0.9s' }}>
            <div className="workflow-number">04</div>
            <div className="workflow-content">
              <h3>Escalation if Needed</h3>
              <p>Complex cases are escalated to human agents automatically.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
