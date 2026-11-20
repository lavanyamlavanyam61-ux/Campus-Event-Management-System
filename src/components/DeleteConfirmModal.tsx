import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { CampusEvent } from '../types';

interface DeleteConfirmModalProps {
  event: CampusEvent | null;
  onClose: () => void;
  onConfirm: (eventId: number) => Promise<void>;
}

export function DeleteConfirmModal({ event, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!event) {
    return null;
  }

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(event.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="delete-modal-title" className="font-display text-base font-semibold text-slate-900">
                Delete Campus Event
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-700 mt-4 leading-relaxed">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-slate-900">{event.title}</span>? All{' '}
          <span className="font-mono tabular-nums">{event.registered_count}</span> active student
          registrations linked to this event will also be removed.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Delete Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
