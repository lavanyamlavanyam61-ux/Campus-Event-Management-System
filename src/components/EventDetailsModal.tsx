import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Building2, UserCheck, X, Ticket } from 'lucide-react';
import type { CampusEvent, User } from '../types';
import { formatEventDate, formatTimeRange, formatTimestamp } from '../utils/format';
import { EventImage } from './EventImage';
import { StatusText } from './StatusText';

interface EventDetailsModalProps {
  event: CampusEvent | null;
  user: User | null;
  onClose: () => void;
  onRegister: (eventId: number, notes: string) => Promise<void>;
  onCancelRegistration: (eventId: number) => Promise<void>;
  onRequestAuth: () => void;
}

export function EventDetailsModal({
  event,
  user,
  onClose,
  onRegister,
  onCancelRegistration,
  onRequestAuth,
}: EventDetailsModalProps) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotes('');
    setError(null);
  }, [event?.id]);

  if (!event) {
    return null;
  }

  const activeReg =
    event.user_registration &&
    (event.user_registration.status === 'confirmed' ||
      event.user_registration.status === 'attended')
      ? event.user_registration
      : null;

  const isFull = event.registered_count >= event.capacity;
  const isClosed = event.status === 'completed' || event.status === 'cancelled';
  const remaining = Math.max(0, event.capacity - event.registered_count);
  const fillPct = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));

  const handleRegisterClick = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onRegister(event.id, notes.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register for event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onCancelRegistration(event.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="relative aspect-[16/9] w-full bg-slate-100">
          <EventImage src={event.image_url} alt={event.title} category={event.category} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/95 text-slate-700 hover:text-slate-900 hover:bg-white border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-700">{event.category}</span>
              <span aria-hidden="true">·</span>
              <span>{event.department}</span>
            </div>
            <StatusText status={activeReg ? activeReg.status : event.status} size="md" />
          </div>

          <h2
            id="event-details-title"
            className="font-display text-2xl font-semibold text-slate-900 mt-2.5 leading-tight"
          >
            {event.title}
          </h2>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-4 border-y border-slate-200 text-sm text-slate-700">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="tabular-nums">{formatEventDate(event.event_date)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="tabular-nums">{formatTimeRange(event.start_time, event.end_time)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{event.organizer}</span>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              About This Event
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Seat Availability */}
          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-700">Capacity &amp; Availability</span>
              <span className="font-mono text-slate-700 tabular-nums">
                {event.registered_count} / {event.capacity} registered · {remaining} seats left
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isFull ? 'bg-red-600' : fillPct >= 80 ? 'bg-amber-600' : 'bg-blue-700'
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {/* Active Registration Pass Card */}
          {activeReg && (
            <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-900">
                      Registration Confirmed
                    </div>
                    <div className="text-xs text-emerald-800 mt-0.5 tabular-nums">
                      Reserved {formatTimestamp(activeReg.registered_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-700">Pass Code</div>
                  <div className="font-mono text-sm font-semibold text-emerald-950 tabular-nums">
                    {activeReg.ticket_code}
                  </div>
                </div>
              </div>
              {activeReg.notes && (
                <div className="mt-2.5 pt-2.5 border-t border-emerald-200/80 text-xs text-emerald-900">
                  Note: {activeReg.notes}
                </div>
              )}
            </div>
          )}

          {/* Registration Form / Action Footer */}
          {!user ? (
            <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Sign in with your university account to reserve a seat.
              </p>
              <button
                type="button"
                onClick={onRequestAuth}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign In to Register
              </button>
            </div>
          ) : (
            <div className="mt-6 pt-5 border-t border-slate-200">
              {!activeReg && !isClosed && !isFull && (
                <div className="mb-4">
                  <label
                    htmlFor="reg-notes"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Optional Registration Note (dietary preference, accessibility, or lab topic)
                  </label>
                  <input
                    id="reg-notes"
                    type="text"
                    maxLength={300}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Vegetarian lunch requested"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  Close
                </button>

                {activeReg ? (
                  activeReg.status !== 'attended' && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleCancelClick}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? 'Cancelling...' : 'Cancel Registration'}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled={submitting || isFull || isClosed}
                    onClick={handleRegisterClick}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'Confirming...'
                        : isClosed
                          ? 'Registration Closed'
                          : isFull
                            ? 'Capacity Full'
                            : 'Confirm Registration'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
