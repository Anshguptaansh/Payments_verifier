// CustomerPage.jsx — Customer Payment Submission

import { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function formatAmount(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2
  }).format(num);
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

export default function CustomerPage() {
  const [product, setProduct] = useState('');
  const [amount, setAmount]   = useState('');
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setPayment(null);

    if (!product.trim() || !amount) {
      setError('Both fields are required.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: product.trim(), amount: parseFloat(amount) })
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Payment initiation failed.');
        setLoading(false);
        return;
      }

      setPayment(data.payment);
      setLoading(false);
      poll(data.payment.id);
    } catch {
      setError('Could not connect to server.');
      setLoading(false);
    }
  }

  function poll(id) {
    const iv = setInterval(async () => {
      try {
        const res  = await fetch(`${API_URL}/api/payments/${id}`);
        const data = await res.json();
        if (data.success) {
          setPayment(data.payment);
          if (data.payment.status === 'captured' || data.payment.status === 'failed') {
            clearInterval(iv);
          }
        }
      } catch {
        clearInterval(iv);
      }
    }, 1000);
  }

  function reset() {
    setPayment(null);
    setProduct('');
    setAmount('');
    setError('');
  }

  return (
    <div className="page">
      <header className="header">
        <span className="header-brand">Payments Verifier</span>
        <span className="header-slash">/</span>
        <span className="header-page">Customer Portal</span>
        <div className="header-spacer" />
        <a href="/" className="header-link">← Home</a>
        <span className="header-pill">REST API</span>
      </header>

      <main className="customer-body">
        <div className="customer-panel">

          {!payment ? (
            <>
              <h1 className="panel-title">New Payment</h1>
              <p className="panel-sub">
                Submits via <code>POST /api/payments</code> and polls for status updates.
              </p>

              <div className="form-card">
                <form onSubmit={handlePay}>
                  <div className="form-card-body">
                    <div className="field">
                      <label htmlFor="product">Product</label>
                      <input
                        id="product"
                        type="text"
                        placeholder="e.g. Wireless Headphones"
                        value={product}
                        onChange={e => setProduct(e.target.value)}
                        disabled={loading}
                        autoComplete="off"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="amount">Amount (INR)</label>
                      <input
                        id="amount"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="e.g. 1299"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    {error && <div className="form-error">{error}</div>}
                  </div>

                  <div className="form-card-footer">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Submitting...' : 'Submit Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <>
              <h1 className="panel-title">Payment Status</h1>
              <p className="panel-sub">Transaction returned by the API</p>

              <div className="result-card">
                <div className="result-card-header">Transaction Details</div>

                <div className="result-row">
                  <span className="result-key">Payment ID</span>
                  <span className="result-val mono">{payment.id}</span>
                </div>
                <div className="result-row">
                  <span className="result-key">Product</span>
                  <span className="result-val">{payment.product}</span>
                </div>
                <div className="result-row">
                  <span className="result-key">Amount</span>
                  <span className="result-val">{formatAmount(payment.amount)}</span>
                </div>
                <div className="result-row">
                  <span className="result-key">Status</span>
                  <StatusBadge status={payment.status} />
                </div>
                <div className="result-row">
                  <span className="result-key">Event</span>
                  <span className="result-val muted">{payment.event_type}</span>
                </div>
                <div className="result-row">
                  <span className="result-key">Created</span>
                  <span className="result-val" style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                    {formatTimestamp(payment.created_at)}
                  </span>
                </div>

                {payment.status === 'created' && (
                  <div className="notice processing">
                    <div className="spinner" />
                    Waiting for provider to process...
                  </div>
                )}
                {payment.status === 'captured' && (
                  <div className="notice success">Payment captured successfully.</div>
                )}
                {payment.status === 'failed' && (
                  <div className="notice fail">Payment failed. Please try again.</div>
                )}

                <div className="notice-actions">
                  <button className="btn btn-ghost" onClick={reset}>
                    New Payment
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
