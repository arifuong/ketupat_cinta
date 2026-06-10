import { getStatusColor } from '@/lib/utils';

export default function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`badge ${getStatusColor(status)}`}>
      {label}
    </span>
  );
}
