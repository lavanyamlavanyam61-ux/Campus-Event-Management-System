import { useState, useEffect, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  EVENT_CATEGORIES,
  EVENT_IMAGE_PRESETS,
  type CampusEvent,
  type EventFormData,
  type EventStatus,
} from '../types';

interface EventFormModalProps {
  open: boolean;
  editingEvent: CampusEvent | null;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
}

const DEFAULT_FORM: EventFormData = {
  title: '',
  description: '',
  category: 'Academic',
  event_date: '2026-12-10',
  start_time: '14:00',
  end_time: '16:00',
  location: '',
  organizer: '',
  department: '',
  capacity: 100,
  image_url: EVENT_IMAGE_PRESETS[0].url,
  status: 'upcoming',
  is_featured: false,
};

export function EventFormModal({ open, editingEvent, onClose, onSubmit }: EventFormModalProps) {
  const [form, setForm] = useState<EventFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData | 'form', string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        description: editingEvent.description,
        category: editingEvent.category,
        event_date: editingEvent.event_date,
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time,
        location: editingEvent.location,
        organizer: editingEvent.organizer,
        department: editingEvent.department,
        capacity: editingEvent.capacity,
        image_url: editingEvent.image_url,
        status: editingEvent.status,
        is_featured: editingEvent.is_featured,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [editingEvent, open]);

  if (!open) {
    return null;
  }

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof EventFormData | 'form', string>> = {};
    if (form.title.trim().length < 3) {
      nextErrors.title = 'Title must be at least 3 characters.';
    }
    if (form.description.trim().length < 15) {
      nextErrors.description = 'Provide at least 15 characters describing the event.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.event_date)) {
      nextErrors.event_date = 'Valid date is required.';
    }
    if (!form.start_time || !form.end_time || form.end_time <= form.start_time) {
      nextErrors.end_time = 'End time must be later than start time.';
    }
    if (form.location.trim().length < 2) {
      nextErrors.location = 'Location/venue is required.';
    }
    if (form.organizer.trim().length < 2) {
      nextErrors.organizer = 'Organizer is required.';
    }
    if (form.department.trim().length < 2) {
      nextErrors.department = 'Department is required.';
    }
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1 || Number(form.capacity) > 5000) {
      nextErrors.capacity = 'Capacity must be between 1 and 5,000.';
    }
    if (editingEvent && Number(form.capacity) < editingEvent.registered_count) {
      nextErrors.capacity = `Cannot set capacity below ${editingEvent.registered_count} confirmed registrations.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        organizer: form.organizer.trim(),
        department: form.department.trim(),
        capacity: Number(form.capacity),
      });
      onClose();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Unable to save event.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 id="event-form-title" className="font-display text-lg font-semibold text-slate-900">
            {editingEvent ? 'Edit Campus Event' : 'Create Campus Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {errors.form && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {errors.form}
            </div>
          )}

          <div>
            <label htmlFor="ev-title" className="block text-xs font-medium text-slate-700 mb-1.5">
              Event Title
            </label>
            <input
              id="ev-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Spring Quantum Computing Colloquium"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ev-category" className="block text-xs font-medium text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="ev-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ev-status" className="block text-xs font-medium text-slate-700 mb-1.5">
                Event Status
              </label>
              <select
                id="ev-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="ev-capacity" className="block text-xs font-medium text-slate-700 mb-1.5">
                Seat Capacity
              </label>
              <input
                id="ev-capacity"
                type="number"
                min={1}
                max={5000}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {errors.capacity && <p className="text-xs text-red-600 mt-1">{errors.capacity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ev-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                Date
              </label>
              <input
                id="ev-date"
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {errors.event_date && <p className="text-xs text-red-600 mt-1">{errors.event_date}</p>}
            </div>

            <div>
              <label htmlFor="ev-start" className="block text-xs font-medium text-slate-700 mb-1.5">
                Start Time
              </label>
              <input
                id="ev-start"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ev-end" className="block text-xs font-medium text-slate-700 mb-1.5">
                End Time
              </label>
              <input
                id="ev-end"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {errors.end_time && <p className="text-xs text-red-600 mt-1">{errors.end_time}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-location" className="block text-xs font-medium text-slate-700 mb-1.5">
                Venue / Room
              </label>
              <input
                id="ev-location"
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Engineering Center Room 201"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            </div>

            <div>
              <label htmlFor="ev-organizer" className="block text-xs font-medium text-slate-700 mb-1.5">
                Organizer / Host Group
              </label>
              <input
                id="ev-organizer"
                type="text"
                value={form.organizer}
                onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                placeholder="e.g., Robotics Society"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {errors.organizer && <p className="text-xs text-red-600 mt-1">{errors.organizer}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-department" className="block text-xs font-medium text-slate-700 mb-1.5">
                Sponsoring Department
              </label>
              <input
                id="ev-department"
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g., School of Engineering"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
            </div>

            <div>
              <label htmlFor="ev-image" className="block text-xs font-medium text-slate-700 mb-1.5">
                Campus Venue Banner
              </label>
              <select
                id="ev-image"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {EVENT_IMAGE_PRESETS.map((preset) => (
                  <option key={preset.url} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ev-description" className="block text-xs font-medium text-slate-700 mb-1.5">
              Description &amp; Agenda
            </label>
            <textarea
              id="ev-description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Outline key speakers, agenda highlights, prerequisites, or materials..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          <label className="inline-flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            <span>Feature this event at the top of the campus calendar</span>
          </label>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
