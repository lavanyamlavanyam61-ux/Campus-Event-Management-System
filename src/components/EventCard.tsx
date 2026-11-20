import { Calendar, MapPin, Users, Pencil, Trash2 } from 'lucide-react';
import type { CampusEvent, UserRole } from '../types';
import { formatEventDate, formatTimeRange } from '../utils/format';
import { EventImage } from './EventImage';
import { StatusText } from './StatusText';

interface EventCardProps {
  event: CampusEvent;
  userRole: UserRole | null;
  onViewDetails: (event: CampusEvent) => void;
  onQuickRegister?: (event: CampusEvent) => void;
  onEdit?: (event: CampusEvent) => void;
  onDelete?: (event: CampusEvent) => void;
  onViewRoster?: (event: CampusEvent) => void;
  busyEventId?: number | null;
}

export function EventCard({
  event,
  userRole,
  onViewDetails,
  onQuickRegister,
  onEdit,
  onDelete,
  onViewRoster,
  busyEventId,
}: EventCardProps) {
  const isRegistered =
    event.user_registration &&
    (event.user_registration.status === 'confirmed' ||
      event.user_registration.status === 'attended');
  const isFull = event.registered_count >= event.capacity;
  const isClosed = event.status === 'completed' || event.status === 'cancelled';
  const fillPct = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));
  const isBusy = busyEventId === event.id;

  return (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-colors hover:border-slate-300">
      <button
        type="button"
        onClick={() => onViewDetails(event)}
        className="aspect-[16/9] w-full overflow-hidden bg-slate-100 block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <EventImage
          src={event.image_url}
          alt={event.title}
          category={event.category}
          className="transition-transform duration-200 hover:scale-[1.02]"
        />
      </button>

      <div className="p-5 flex-1 flex flex-col">
        {/* Unboxed Metadata Line (Zero-Pill Rule) */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="font-medium text-blue-700">{event.category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{event.department}</span>
          </div>
          {isRegistered ? (
            <StatusText status={event.user_registration!.status} />
          ) : isClosed ? (
            <StatusText status={event.status} />
          ) : isFull ? (
            <StatusText status="full" />
          ) : (
            <StatusText status={event.status} />
          )}
        </div>

        <h3 className="font-display text-base font-semibold text-slate-900 mt-2 leading-snug line-clamp-2">
          <button
            type="button"
            onClick={() => onViewDetails(event)}
            className="text-left hover:text-blue-700 transition-colors cursor-pointer"
          >
            {event.title}
          </button>
        </h3>

        <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed flex-1">
          {event.description}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="tabular-nums truncate">
              {formatEventDate(event.event_date)} · {formatTimeRange(event.start_time, event.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">Seats Filled</span>
            <span className="font-mono font-medium text-slate-700 tabular-nums">
              {event.registered_count} / {event.capacity} ({fillPct}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isFull ? 'bg-red-600' : fillPct >= 80 ? 'bg-amber-600' : 'bg-blue-700'
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Card Action Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(event)}
            className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Event Details
          </button>

          {userRole === 'admin' && onEdit && onDelete && onViewRoster ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onViewRoster(event)}
                title="View Registered Students"
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Roster</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(event)}
                aria-label={`Edit ${event.title}`}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(event)}
                aria-label={`Delete ${event.title}`}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            onQuickRegister && (
              <button
                type="button"
                disabled={isBusy || (!isRegistered && (isFull || isClosed))}
                onClick={() => onQuickRegister(event)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                  isRegistered
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : isFull || isClosed
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {isBusy
                  ? 'Updating...'
                  : isRegistered
                    ? 'Registered'
                    : isClosed
                      ? 'Closed'
                      : isFull
                        ? 'Full'
                        : userRole
                          ? 'Register'
                          : 'Sign In to Register'}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  );
}
