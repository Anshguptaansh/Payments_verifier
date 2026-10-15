// LandingPage.jsx — Entry point, links to Customer and Admin views

export default function LandingPage() {
  return (
    <div className="page">
      <header className="header">
        <span className="header-brand">Payments Verifier</span>
        <div className="header-spacer" />
        <span className="header-pill">Demo</span>
      </header>

      <main className="landing-body">
        <p className="landing-eyebrow">Developer Demo</p>
        <h1 className="landing-title">Live Payment Dashboard</h1>
        <p className="landing-desc">
          A full-stack demo showing how REST APIs, webhooks, HMAC verification,
          and WebSockets work together in a real payment flow.
        </p>

        <div className="card-row">
          <a href="/customer" target="_blank" rel="noopener noreferrer" className="portal-card">
            <span className="portal-card-eyebrow">Customer</span>
            <span className="portal-card-title">Payment Submission</span>
            <span className="portal-card-desc">
              Submit a test payment through the REST API and watch its status update in real time.
            </span>
            <code className="portal-card-tag">POST /api/payments</code>
            <span className="portal-card-cta">Open portal →</span>
          </a>

          <a href="/admin" target="_blank" rel="noopener noreferrer" className="portal-card">
            <span className="portal-card-eyebrow">Admin</span>
            <span className="portal-card-title">Event Monitor</span>
            <span className="portal-card-desc">
              Monitor all payment events as they arrive via webhook and WebSocket broadcast.
            </span>
            <code className="portal-card-tag">WebSocket · /admin</code>
            <span className="portal-card-cta">Open dashboard →</span>
          </a>
        </div>
      </main>
    </div>
  );
}
