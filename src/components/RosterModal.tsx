import { useState, useEffect } from 'react';
import { Download, Search, Users, X } from 'lucide-react';
import { api } from '../api/client';
import type { CampusEvent, RegistrationStatus, RosterRegistration } from '../types';
import { exportRosterCsv, formatEventDate, formatTimestamp } from '../utils/format';

interface RosterModalProps {
  event: CampusEvent | null;
  onClose: () => void;
  onStatusChanged: () => void;
}

export function RosterModal({ event, onClose, onStatusChanged }: RosterModalProps) {
  const [registrations, setRegistrations] = useState<RosterRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!event) return;
    let active = true;
    setLoading(true);
    setError(null);
    setSearch('');

    api
      .getEventRoster(event.id)
      .then((res) => {
        if (active) setRegistrations(res.registrations);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load roster.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [event]);

  if (!event) {
    return null;
  }

  const filtered = registrations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.student_name.toLowerCase().includes(q) ||
      r.student_email.toLowerCase().includes(q) ||
      r.student_id.toLowerCase().includes(q) ||
      r.ticket_code.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  });

  const activeCount = registrations.filter((r) => r.status !== 'cancelled').length;

  const handleStatusChange = async (regId: number, status: RegistrationStatus) => {
    setUpdatingId(regId);
    setError(null);
    try {
      await api.updateRegistrationStatus(regId, status);
      setRegistrations((prev) =>
        prev.map((item) => (item.id === regId ? { ...item, status } : item))
      );
      onStatusChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="roster-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 id="roster-modal-title" className="font-display text-lg font-semibold text-slate-900">
              Registered Students Roster
            </h2>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {event.title} · {formatEventDate(event.event_date)} · {activeCount} / {event.capacity} seats filled
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close roster modal"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by student name, ID, or pass code..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
          <button
            type="button"
            disabled={registrations.length === 0}
            onClick={() => exportRosterCsv(event.title, registrations)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2.5" strokeWidth={1.5} />
              <div className="text-sm font-medium text-slate-900">
                {registrations.length === 0
                  ? 'No students registered yet'
                  : 'No students match your search'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {registrations.length === 0
                  ? 'Registrations will appear here as soon as students reserve seats.'
                  : 'Try clearing the search query to see all attendees.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Pass Code</th>
                    <th className="py-2.5 px-4">Registered</th>
                    <th className="py-2.5 px-4 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filtered.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{reg.student_name}</div>
                        <div className="text-xs text-slate-500">
                          {reg.student_email} · {reg.department}
                        </div>
                        {reg.notes && (
                          <div className="text-xs text-slate-500 mt-0.5">Note: {reg.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {reg.student_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        {reg.ticket_code}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatTimestamp(reg.registered_at)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <select
                          aria-label={`Attendance status for ${reg.student_name}`}
                          value={reg.status}
                          disabled={updatingId === reg.id}
                          onChange={(e) =>
                            handleStatusChange(reg.id, e.target.value as RegistrationStatus)
                          }
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
                            reg.status === 'attended'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : reg.status === 'cancelled'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-white text-slate-800 border-slate-300'
                          }`}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="attended">Attended</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
