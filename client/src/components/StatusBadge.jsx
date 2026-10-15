// StatusBadge.jsx — Payment status label

export default function StatusBadge({ status }) {
  const map = {
    created:    { label: 'Created',    cls: 'badge-created'    },
    processing: { label: 'Processing', cls: 'badge-processing' },
    pending:    { label: 'Pending',    cls: 'badge-pending'    },
    captured:   { label: 'Captured',   cls: 'badge-captured'   },
    failed:     { label: 'Failed',     cls: 'badge-failed'     },
  };

  const { label, cls } = map[status] || { label: status, cls: 'badge-created' };

  return <span className={`badge ${cls}`}>{label}</span>;
}
