// StatusBadge.jsx — Color-coded payment status indicator
// Shows a pill-shaped badge with different colors per status

export default function StatusBadge({ status }) {
  const statusConfig = {
    created:    { label: 'Created',    className: 'badge-created' },
    processing: { label: 'Processing', className: 'badge-processing' },
    captured:   { label: 'Captured',   className: 'badge-captured' },
    failed:     { label: 'Failed',     className: 'badge-failed' },
  };

  const config = statusConfig[status] || { label: status, className: 'badge-default' };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
