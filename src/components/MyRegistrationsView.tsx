import { useState } from 'react';
import { Calendar, MapPin, Ticket, Search } from 'lucide-react';
import type { MyRegistrationItem } from '../types';
import { formatEventDate, formatTimeRange, formatTimestamp } from '../utils/format';
import { StatusText } from './StatusText';

interface MyRegistrationsViewProps {
  registrations: MyRegistrationItem[];
  loading: boolean;
  onCancelRegistration: (eventId: number) => Promise<void>;
  onViewEvent: (eventId: number) => void;
  onBrowseEvents: () => void;
}

export function MyRegistrationsView({
  registrations,
  loading,
  onCancelRegistration,
  onViewEvent,
  onBrowseEvents,
}: MyRegistrationsViewProps) {
  const [filterTab, setFilterTab] = useState<'active' | 'all' | 'cancelled'>('active');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const filtered = registrations.filter((item) => {
    if (filterTab === 'active' && item.registration_status === 'cancelled') return false;
    if (filterTab === 'cancelled' && item.registration_status !== 'cancelled') return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.ticket_code.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCancel = async (eventId: number) => {
    setCancellingId(eventId);
    try {
      await onCancelRegistration(eventId);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          {(
            [
              { id: 'active', label: 'Active Passes' },
              { id: 'all', label: 'All History' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pass code or event..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 animate-pulse flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <Ticket className="w-8 h-8 text-slate-400 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-display text-base font-semibold text-slate-900">
            No matching registrations
          </h3>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
            {filterTab === 'active'
              ? 'You have no active event registrations in this view. Browse upcoming campus events to reserve a seat.'
              : 'No records match your current filter criteria.'}
          </p>
          <button
            type="button"
            onClick={onBrowseEvents}
            className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            Browse Upcoming Events
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Event</th>
                  <th className="py-3 px-4">Date &amp; Venue</th>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((reg) => {
                  const isCancelled = reg.registration_status === 'cancelled';
                  const isAttended = reg.registration_status === 'attended';
                  return (
                    <tr key={reg.registration_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5 align-top">
                        <button
                          type="button"
                          onClick={() => onViewEvent(reg.event_id)}
                          className="font-medium text-slate-900 hover:text-blue-700 text-left transition-colors cursor-pointer"
                        >
                          {reg.title}
                        </button>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {reg.category} · {reg.organizer}
                        </div>
                        {reg.notes && (
                          <div className="text-xs text-slate-500 mt-1">Note: {reg.notes}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-top text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5 tabular-nums whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {formatEventDate(reg.event_date)} ·{' '}
                            {formatTimeRange(reg.start_time, reg.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{reg.location}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                          {reg.ticket_code}
                        </span>
                        <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                          {formatTimestamp(reg.registered_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <StatusText status={reg.registration_status} />
                      </td>
                      <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewEvent(reg.event_id)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          {!isCancelled && !isAttended && (
                            <button
                              type="button"
                              disabled={cancellingId === reg.event_id}
                              onClick={() => handleCancel(reg.event_id)}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {cancellingId === reg.event_id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
