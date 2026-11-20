import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StatusTextProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusText({ status, size = 'sm' }: StatusTextProps) {
  const normalized = status.toLowerCase();
  const textClass = size === 'md' ? 'text-sm font-medium' : 'text-xs font-medium';
  const iconClass = size === 'md' ? 'w-4 h-4 shrink-0' : 'w-3.5 h-3.5 shrink-0';

  if (normalized === 'confirmed' || normalized === 'attended' || normalized === 'upcoming') {
    const label =
      normalized === 'attended'
        ? 'Attended'
        : normalized === 'confirmed'
          ? 'Confirmed'
          : 'Upcoming';
    return (
      <span className={`inline-flex items-center gap-1.5 text-emerald-700 whitespace-nowrap ${textClass}`}>
        <CheckCircle2 className={iconClass} />
        <span>{label}</span>
      </span>
    );
  }

  if (normalized === 'ongoing' || normalized === 'filling') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-amber-700 whitespace-nowrap ${textClass}`}>
        <Clock className={iconClass} />
        <span>{normalized === 'ongoing' ? 'In Progress' : 'Filling Fast'}</span>
      </span>
    );
  }

  if (normalized === 'cancelled' || normalized === 'full') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-red-700 whitespace-nowrap ${textClass}`}>
        <XCircle className={iconClass} />
        <span>{normalized === 'full' ? 'Capacity Full' : 'Cancelled'}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-slate-600 whitespace-nowrap ${textClass}`}>
      <AlertCircle className={iconClass} />
      <span className="capitalize">{status}</span>
    </span>
  );
}
