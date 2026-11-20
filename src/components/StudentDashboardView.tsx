import { ArrowRight, Calendar, MapPin, Ticket } from 'lucide-react';
import type { CampusEvent, DashboardStats, MyRegistrationItem, User } from '../types';
import { formatEventDate, formatTimeRange } from '../utils/format';
import { EventCard } from './EventCard';
import { StatSummaryGrid } from './StatSummaryGrid';

interface StudentDashboardViewProps {
  user: User;
  stats: DashboardStats | null;
  events: CampusEvent[];
  myRegistrations: MyRegistrationItem[];
  onViewDetails: (event: CampusEvent) => void;
  onQuickRegister: (event: CampusEvent) => void;
  onNavigateEvents: () => void;
  onNavigateRegistrations: () => void;
  busyEventId: number | null;
}

export function StudentDashboardView({
  user,
  stats,
  events,
  myRegistrations,
  onViewDetails,
  onQuickRegister,
  onNavigateEvents,
  onNavigateRegistrations,
  busyEventId,
}: StudentDashboardViewProps) {
  const upcomingRegs = myRegistrations.filter(
    (r) => r.registration_status === 'confirmed' && r.event_status === 'upcoming'
  );
  const nextReg = upcomingRegs[0] || null;
  const featuredEvents = events.filter((e) => e.status === 'upcoming').slice(0, 3);

  const statItems = [
    {
      label: 'Upcoming Campus Events',
      value: stats?.summary.upcoming_events ?? events.filter((e) => e.status === 'upcoming').length,
      detail: 'Open across 6 university categories',
    },
    {
      label: 'My Active Registrations',
      value: stats?.myStats.active_registrations ?? upcomingRegs.length,
      detail: 'Confirmed and attended passes',
    },
    {
      label: 'Events Attended',
      value: stats?.myStats.attended_events ?? 0,
      detail: 'Verified semester check-ins',
    },
    {
      label: 'Next Scheduled Event',
      value: nextReg ? formatEventDate(nextReg.event_date) : 'None yet',
      detail: nextReg ? nextReg.title : 'Browse calendar to reserve a seat',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Welcome back, {user.name.split(' ')[0]}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {user.department} · Student ID <span className="font-mono">{user.student_id}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateEvents}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <span>Explore All Events</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <StatSummaryGrid items={statItems} />

      {/* Next Confirmed Event Spotlight */}
      {nextReg && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs font-medium text-blue-700">Next Confirmed Pass</div>
            <h3 className="font-display text-lg font-semibold text-slate-900">{nextReg.title}</h3>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatEventDate(nextReg.event_date)} ·{' '}
                {formatTimeRange(nextReg.start_time, nextReg.end_time)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {nextReg.location}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-800 tabular-nums">
                <Ticket className="w-3.5 h-3.5 text-slate-400" />
                {nextReg.ticket_code}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateRegistrations}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-center cursor-pointer"
          >
            View My Passes
          </button>
        </div>
      )}

      {/* Recommended Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-slate-900">
            Upcoming on Campus
          </h3>
          <button
            type="button"
            onClick={onNavigateEvents}
            className="text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
          >
            View full directory
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {featuredEvents.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              userRole={user.role}
              onViewDetails={onViewDetails}
              onQuickRegister={onQuickRegister}
              busyEventId={busyEventId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
