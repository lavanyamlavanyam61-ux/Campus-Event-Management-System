import type { RosterRegistration } from '../types';

export function formatEventDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dateStr;
  }
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatTimestamp(isoStr: string): string {
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) {
    return isoStr;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function exportRosterCsv(eventTitle: string, registrations: RosterRegistration[]): void {
  const headers = [
    'Ticket Code',
    'Student Name',
    'Student ID',
    'Email',
    'Department',
    'Status',
    'Notes',
    'Registered At',
  ];

  const escapeCell = (val: string) => {
    const clean = val.replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = registrations.map((r) => [
    r.ticket_code,
    r.student_name,
    r.student_id,
    r.student_email,
    r.department,
    r.status,
    r.notes || '',
    r.registered_at,
  ]);

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map((cell) => escapeCell(String(cell))).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  link.href = url;
  link.download = `${slug || 'event'}-roster.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
