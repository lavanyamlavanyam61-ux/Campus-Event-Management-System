import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react';
import { useState } from 'react';
import type { CampusEvent } from '../types';
import { formatEventDate, formatTimeRange } from '../utils/format';
import { StatusText } from './StatusText';

interface AdminManageEventsViewProps {
  events: CampusEvent[];
  loading: boolean;
  onCreateEvent: () => void;
  onEditEvent: (event: CampusEvent) => void;
  onDeleteEvent: (event: CampusEvent) => void;
  onViewRoster: (event: CampusEvent) => void;
  onViewDetails: (event: CampusEvent) => void;
}

export function AdminManageEventsView({
  events,
  loading,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onViewRoster,
  onViewDetails,
}: AdminManageEventsViewProps) {
  const [search, setSearch] = useState('');

  const filtered = events.filter((ev) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.category.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q) ||
      ev.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter events by title, venue, or department..."
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <button
          type="button"
          onClick={onCreateEvent}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-display text-base font-semibold text-slate-900">
              No events found
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Create a new campus event or clear your search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Event Title &amp; Department</th>
                  <th className="py-3 px-4">Schedule &amp; Venue</th>
                  <th className="py-3 px-4">Registrations</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((ev) => {
                  const pct = Math.min(100, Math.round((ev.registered_count / ev.capacity) * 100));
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 align-top">
                        <button
                          type="button"
                          onClick={() => onViewDetails(ev)}
                          className="font-medium text-slate-900 hover:text-blue-700 text-left transition-colors cursor-pointer"
                        >
                          {ev.title}
                        </button>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {ev.category} · {ev.department}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top text-xs text-slate-600">
                        <div className="tabular-nums whitespace-nowrap font-medium text-slate-800">
                          {formatEventDate(ev.event_date)} · {formatTimeRange(ev.start_time, ev.end_time)}
                        </div>
                        <div className="text-slate-500 mt-0.5">{ev.location}</div>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono text-xs font-medium text-slate-800 tabular-nums">
                          {ev.registered_count} / {ev.capacity} ({pct}%)
                        </div>
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 100 ? 'bg-red-600' : 'bg-blue-700'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <StatusText status={ev.status} />
                      </td>
                      <td className="py-3.5 px-5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewRoster(ev)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Roster</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditEvent(ev)}
                            aria-label={`Edit ${ev.title}`}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEvent(ev)}
                            aria-label={`Delete ${ev.title}`}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
