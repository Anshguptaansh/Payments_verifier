// PaymentCard.jsx — Displays a single payment event in the admin dashboard
// Shows payment ID, amount, product, status badge, event type, and timestamp

import StatusBadge from './StatusBadge';

export default function PaymentCard({ payment, isNew }) {
  const time = new Date(payment.updated_at || payment.created_at).toLocaleTimeString();
  const date = new Date(payment.updated_at || payment.created_at).toLocaleDateString();

  return (
    <div className={`payment-card ${isNew ? 'payment-card-new' : ''}`}>
      <div className="payment-card-header">
        <code className="payment-id">{payment.id}</code>
        <StatusBadge status={payment.status} />
      </div>
      <div className="payment-card-body">
        <div className="payment-detail">
          <span className="detail-label">Product</span>
          <span className="detail-value">{payment.product}</span>
        </div>
        <div className="payment-detail">
          <span className="detail-label">Amount</span>
          <span className="detail-value amount">&#8377;{payment.amount}</span>
        </div>
        <div className="payment-detail">
          <span className="detail-label">Event</span>
          <span className="detail-value event-type">{payment.event_type}</span>
        </div>
        <div className="payment-detail">
          <span className="detail-label">Time</span>
          <span className="detail-value">{date} {time}</span>
        </div>
      </div>
    </div>
  );
}
