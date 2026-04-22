const STYLES = {
  high:   'bg-red-100 text-red-800 border border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  low:    'bg-green-100 text-green-800 border border-green-200',
};

const LABELS = { high: '🔴 HIGH', medium: '🟡 MEDIUM', low: '🟢 LOW' };

export default function UrgencyBadge({ urgency, reason }) {
  if (!urgency) return null;
  return (
    <span
      title={reason || ''}
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${STYLES[urgency]}`}
    >
      {LABELS[urgency]}
    </span>
  );
}
