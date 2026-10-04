// AdminDashboard.jsx — Standalone Admin Dashboard Page

import { useState, useEffect, useRef } from 'react';
import PaymentCard from '../components/PaymentCard';

const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

export default function AdminDashboard() {
  const [payments, setPayments] = useState([]);
  const [connected, setConnected] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const wsRef = useRef(null);
  const newIdsRef = useRef(new Set());

  useEffect(() => {
    fetchExistingPayments();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  async function fetchExistingPayments() {
    try {
      const res = await fetch(`${API_URL}/api/payments`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Failed to fetch existing payments:', err);
    }
  }

  function connectWebSocket() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      addToLog('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'CONNECTION_ESTABLISHED') {
        addToLog(data.message);
        return;
      }

      if (data.type === 'PAYMENT_UPDATE') {
        newIdsRef.current.add(data.payment.id);

        setPayments(prev => {
          const existing = prev.findIndex(p => p.id === data.payment.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = data.payment;
            return updated;
          } else {
            return [data.payment, ...prev];
          }
        });

        addToLog(`${data.event}: ${data.payment.id} → ${data.payment.status}`);

        setTimeout(() => {
          newIdsRef.current.delete(data.payment.id);
        }, 2000);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      addToLog('WebSocket disconnected');
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      addToLog('WebSocket error occurred');
    };
  }

  function addToLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }

  return (
    <div className="standalone-container">
      <div className="standalone-nav">
        <span className="standalone-brand">⚡ Admin Dashboard (Real-Time Feed)</span>
        <div className="badge-row">
          <span className="comm-badge ws-badge">WebSocket Receiver</span>
          <span className={`connection-status ${connected ? 'status-connected' : 'status-disconnected'}`}>
            {connected ? '● Live' : '○ Offline'}
          </span>
        </div>
      </div>

      <div className="standalone-content admin-content">
        <div className="admin-layout">
          <div className="payments-grid">
            <h2>Payment Records ({payments.length})</h2>
            {payments.length === 0 ? (
              <div className="empty-state">
                <p>No payments recorded yet.</p>
                <p className="empty-hint">Open the Customer page in another tab to trigger a payment!</p>
              </div>
            ) : (
              payments.map(p => (
                <PaymentCard
                  key={p.id}
                  payment={p}
                  isNew={newIdsRef.current.has(p.id)}
                />
              ))
            )}
          </div>

          <div className="event-log">
            <h2>Live Webhook Stream</h2>
            <div className="log-entries">
              {eventLog.length === 0 ? (
                <p className="log-empty">Waiting for webhook events...</p>
              ) : (
                eventLog.map((entry, i) => (
                  <div key={i} className="log-entry">{entry}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
