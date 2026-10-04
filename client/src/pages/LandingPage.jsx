// LandingPage.jsx — Launcher page to open Customer or Admin view separately

export default function LandingPage() {
  return (
    <div className="landing-container">
      <div className="landing-card">
        <div className="landing-header">
          <span className="brand-icon">&#9889;</span>
          <h1>Live Payment Verifier</h1>
          <p>Webhooks, WebSockets &amp; HMAC Verification Architecture</p>
        </div>

        <div className="portal-grid">
          <a href="/customer" target="_blank" rel="noopener noreferrer" className="portal-card customer-portal">
            <div className="portal-badge rest">REST API</div>
            <h2>🛒 Customer Checkout</h2>
            <p>Standalone page for customers to submit payments via <code>POST /api/payments</code>.</p>
            <span className="portal-button">Open Customer Portal &#8594;</span>
          </a>

          <a href="/admin" target="_blank" rel="noopener noreferrer" className="portal-card admin-portal">
            <div className="portal-badge ws">WebSocket</div>
            <h2>⚡ Admin Dashboard</h2>
            <p>Standalone dashboard listening for real-time payment webhooks via <code>ws://localhost:3001</code>.</p>
            <span className="portal-button">Open Admin Portal &#8594;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
