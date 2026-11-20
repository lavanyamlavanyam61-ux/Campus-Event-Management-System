import { Plus, ArrowUpRight } from 'lucide-react';
import type { DashboardStats } from '../types';
import { formatEventDate, formatTimestamp } from '../utils/format';
import { StatSummaryGrid } from './StatSummaryGrid';
import { StatusText } from './StatusText';

interface AdminAnalyticsViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onCreateEvent: () => void;
  onManageEvents: () => void;
}

export function AdminAnalyticsView({
  stats,
  loading,
  onCreateEvent,
  onManageEvents,
}: AdminAnalyticsViewProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Campus Events',
      value: stats.summary.total_events,
      detail: `${stats.summary.upcoming_events} upcoming · ${stats.summary.completed_events} completed`,
    },
    {
      label: 'Confirmed Registrations',
      value: stats.summary.total_registrations,
      detail: `Across ${stats.summary.total_capacity} total available seats`,
    },
    {
      label: 'Campus Seat Utilization',
      value: `${stats.summary.utilization_pct}%`,
      detail: 'Average fill rate across active events',
    },
    {
      label: 'Registered Students',
      value: stats.summary.total_students,
      detail: 'Active student accounts in portal',
    },
  ];

  const maxReg = Math.max(1, ...stats.categoryBreakdown.map((c) => c.registration_count));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Campus Operations Summary
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time registration throughput, seat utilization, and departmental distribution.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onManageEvents}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Manage Events</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={onCreateEvent}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      <StatSummaryGrid items={statItems} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Category Distribution */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Registrations by Category
            </h3>
            <span className="text-xs text-slate-500">Live Totals</span>
          </div>

          <div className="space-y-4">
            {stats.categoryBreakdown.map((cat) => {
              const barPct = Math.round((cat.registration_count / maxReg) * 100);
              const utilPct =
                cat.total_capacity > 0
                  ? Math.round((cat.registration_count / cat.total_capacity) * 100)
                  : 0;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-800">
                      {cat.category}{' '}
                      <span className="text-slate-400 font-normal">
                        ({cat.event_count} {cat.event_count === 1 ? 'event' : 'events'})
                      </span>
                    </span>
                    <span className="font-mono text-slate-700 tabular-nums">
                      {cat.registration_count} / {cat.total_capacity} ({utilPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full"
                      style={{ width: `${Math.max(4, barPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Campus Registrations */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Recent Student Registrations
            </h3>
            <span className="text-xs text-slate-500 tabular-nums">
              Latest {stats.recentRegistrations.length}
            </span>
          </div>

          {stats.recentRegistrations.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No registrations recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-5">Student</th>
                    <th className="py-2.5 px-4">Event</th>
                    <th className="py-2.5 px-4">Pass Code</th>
                    <th className="py-2.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {stats.recentRegistrations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-5">
                        <div className="font-medium text-slate-900">{item.student_name}</div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {item.student_id} · {item.department}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 truncate max-w-[210px]">
                          {item.event_title}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {formatEventDate(item.event_date)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                          {item.ticket_code}
                        </div>
                        <div className="text-xs text-slate-400 tabular-nums">
                          {formatTimestamp(item.registered_at)}
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <StatusText status={item.status} />
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
