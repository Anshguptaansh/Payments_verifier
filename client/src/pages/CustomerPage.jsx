// CustomerPage.jsx — Standalone Customer Payment Page

import { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function CustomerPage() {
  const [product, setProduct] = useState('');
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setPayment(null);

    if (!product.trim() || !amount) {
      setError('Please fill in both product name and amount.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: product.trim(),
          amount: parseFloat(amount)
        })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Payment initiation failed.');
        setLoading(false);
        return;
      }

      setPayment(data.payment);
      setLoading(false);
      pollPaymentStatus(data.payment.id);
    } catch (err) {
      setError('Could not connect to server. Is the backend running?');
      setLoading(false);
    }
  }

  function pollPaymentStatus(paymentId) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/${paymentId}`);
        const data = await res.json();

        if (data.success) {
          setPayment(data.payment);
          if (data.payment.status === 'captured' || data.payment.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 1000);
  }

  function handleReset() {
    setPayment(null);
    setProduct('');
    setAmount('');
    setError('');
  }

  return (
    <div className="standalone-container">
      <div className="standalone-nav">
        <span className="standalone-brand">🛒 Customer Portal</span>
        <span className="comm-badge rest-badge">REST API Endpoint</span>
      </div>

      <div className="standalone-content">
        {!payment ? (
          <form className="payment-form" onSubmit={handlePay}>
            <h2>Make a Payment</h2>
            <p className="form-subtitle">Submits payment data via REST API to backend</p>
            
            <div className="form-group">
              <label htmlFor="product">Product Name</label>
              <input
                id="product"
                type="text"
                placeholder="e.g. Premium Headphones"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount (&#8377;)</label>
              <input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 999"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="pay-button" disabled={loading}>
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </form>
        ) : (
          <div className="payment-result">
            <div className="result-card">
              <h2>Payment Status</h2>
              <div className="result-row">
                <span className="result-label">Payment ID</span>
                <code className="result-value">{payment.id}</code>
              </div>
              <div className="result-row">
                <span className="result-label">Product</span>
                <span className="result-value">{payment.product}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Amount</span>
                <span className="result-value">&#8377;{payment.amount}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Status</span>
                <StatusBadge status={payment.status} />
              </div>
              <div className="result-row">
                <span className="result-label">Event</span>
                <span className="result-value event-type">{payment.event_type}</span>
              </div>

              {payment.status === 'created' && (
                <div className="status-message processing-msg">
                  <div className="spinner"></div>
                  Waiting for payment provider to process...
                </div>
              )}
              {payment.status === 'captured' && (
                <div className="status-message success-msg">
                  &#10003; Payment successful!
                </div>
              )}
              {payment.status === 'failed' && (
                <div className="status-message failure-msg">
                  &#10007; Payment failed. Please try again.
                </div>
              )}

              <button className="pay-button secondary" onClick={handleReset}>
                Make Another Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
