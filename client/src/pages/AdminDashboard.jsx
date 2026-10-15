// AdminDashboard.jsx — Live payment event monitor

import { useState, useEffect, useRef } from 'react';
import StatusBadge from '../components/StatusBadge';

const API_URL  = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL   = import.meta.env.VITE_WS_URL  || 'ws://localhost:3001';
const PAGE_SIZE = 15;

function formatAmount(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2
  }).format(num);
}

function formatTs(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatFeedTs(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

export default function AdminDashboard() {
  const [payments,   setPayments]   = useState([]);
  const [connected,  setConnected]  = useState(false);
  const [eventLog,   setEventLog]   = useState([]);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchPayments();
    connectWS();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  async function fetchPayments() {
    try {
      const res  = await fetch(`${API_URL}/api/payments`);
      const data = await res.json();
      if (data.success) setPayments(data.payments);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  }

  function connectWS() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      log({ type: 'info', message: 'Connected to server' });
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'CONNECTION_ESTABLISHED') {
        log({ type: 'info', message: data.message });
        return;
      }
      if (data.type === 'PAYMENT_UPDATE') {
        setPayments(prev => {
          const idx = prev.findIndex(p => p.id === data.payment.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data.payment;
            return next;
          }
          return [data.payment, ...prev];
        });
        log({ type: 'payment', event: data.event, id: data.payment.id, status: data.payment.status });
      }
    };

    ws.onclose = () => {
      setConnected(false);
      log({ type: 'info', message: 'Disconnected. Reconnecting...' });
      setTimeout(connectWS, 3000);
    };

    ws.onerror = () => log({ type: 'error', message: 'WebSocket error' });
  }

  function log(entry) {
    setEventLog(prev => [{ ...entry, ts: new Date().toISOString() }, ...prev].slice(0, 100));
  }

  // Metrics
  const total     = payments.length;
  const captured  = payments.filter(p => p.status === 'captured').length;
  const failed    = payments.filter(p => p.status === 'failed').length;
  const volume    = payments
    .filter(p => p.status === 'captured')
    .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const curPage    = Math.min(page, totalPages);
  const pageRows   = payments.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  function copyId(id) {
    navigator.clipboard.writeText(id).catch(() => {});
  }

  return (
    <div className="page">
      <header className="header">
        <span className="header-brand">Payments Verifier</span>
        <span className="header-slash">/</span>
        <span className="header-page">Admin</span>
        <div className="header-spacer" />
        <div className="ws-indicator">
          <span className={`ws-dot ${connected ? 'on' : 'off'}`} />
          {connected ? 'Live' : 'Offline'}
        </div>
      </header>

      <main className="admin-body">

        <div>
          <h1 className="admin-heading">Payment Events</h1>
          <p className="admin-subtext">Live view of transactions and incoming webhook events.</p>
        </div>

        {/* Metrics */}
        <div className="metrics">
          <div className="metric">
            <div className="metric-label">Total</div>
            <div className="metric-val">{total}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Captured</div>
            <div className="metric-val green">{captured}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Failed</div>
            <div className="metric-val red">{failed}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Volume</div>
            <div className="metric-val blue" style={{ fontSize: '16px' }}>
              {new Intl.NumberFormat('en-IN', {
                style: 'currency', currency: 'INR', minimumFractionDigits: 0
              }).format(volume)}
            </div>
          </div>
        </div>

        {/* Table + Feed */}
        <div className="admin-grid">

          {/* Payment Table */}
          <div className="table-panel">
            <div className="panel-header">
              <span className="panel-header-title">Payment Records</span>
              <span className="panel-header-meta">
                {total === 0 ? 'No records' : `${total} record${total !== 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="table-wrap">
              {loading ? (
                <div className="table-loading">
                  <div className="spinner" /> Loading...
                </div>
              ) : total === 0 ? (
                <div className="table-state">
                  <p>No payments yet.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>
                    Open the Customer Portal to submit one.
                  </p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Product</th>
                      <th className="right">Amount</th>
                      <th>Status</th>
                      <th>Event</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(p => (
                      <tr key={p.id}>
                        <td className="td-id">
                          <div className="td-id-wrap">
                            <span title={p.id}>{p.id}</span>
                            <button
                              className="copy-btn"
                              onClick={() => copyId(p.id)}
                              title="Copy"
                            >copy</button>
                          </div>
                        </td>
                        <td className="td-product">{p.product}</td>
                        <td className="td-amount">{formatAmount(p.amount)}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td className="td-event">{p.event_type}</td>
                        <td className="td-time">{formatTs(p.updated_at || p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="table-footer">
                <span>Page {curPage} of {totalPages}</span>
                <div className="page-btns">
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={curPage === 1}
                  >Prev</button>
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={curPage === totalPages}
                  >Next</button>
                </div>
              </div>
            )}
          </div>

          {/* Event Feed */}
          <div className="feed-panel">
            <div className="panel-header">
              <span className="panel-header-title">Webhook Feed</span>
              {eventLog.length > 0 && (
                <button className="feed-clear" onClick={() => setEventLog([])}>Clear</button>
              )}
            </div>

            <div className="feed-scroll">
              {eventLog.length === 0 ? (
                <div className="feed-empty">Waiting for events...</div>
              ) : (
                eventLog.map((entry, i) => (
                  <div key={i} className="feed-item">
                    <span className="feed-ts">{formatFeedTs(entry.ts)}</span>
                    {entry.type === 'payment' ? (
                      <>
                        <span className="feed-evt">{entry.event}</span>
                        <span className="feed-id">{entry.id}</span>
                        <span className={
                          entry.status === 'captured' ? 'feed-ok' :
                          entry.status === 'failed'   ? 'feed-err' : 'feed-id'
                        }>{entry.status}</span>
                      </>
                    ) : (
                      <span className={entry.type === 'error' ? 'feed-err' : 'feed-info'}>
                        {entry.message}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
