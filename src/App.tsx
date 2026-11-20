/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Menu, Plus, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api, getStoredToken, setStoredToken } from './api/client';
import type {
  CampusEvent,
  DashboardStats,
  EventFormData,
  MyRegistrationItem,
  User,
} from './types';
import { AuthView } from './components/AuthView';
import { Sidebar, type ActiveView } from './components/Sidebar';
import { StudentDashboardView } from './components/StudentDashboardView';
import { AdminAnalyticsView } from './components/AdminAnalyticsView';
import { AdminManageEventsView } from './components/AdminManageEventsView';
import { BrowseEventsView } from './components/BrowseEventsView';
import { MyRegistrationsView } from './components/MyRegistrationsView';
import { EventDetailsModal } from './components/EventDetailsModal';
import { EventFormModal } from './components/EventFormModal';
import { RosterModal } from './components/RosterModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authBootstrapping, setAuthBootstrapping] = useState(true);
  const [guestBrowsing, setGuestBrowsing] = useState(false);

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState<MyRegistrationItem[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters for BrowseEventsView
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('upcoming');
  const [sortBy, setSortBy] = useState('date_asc');

  // Modals & Action States
  const [detailEvent, setDetailEvent] = useState<CampusEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
  const [rosterEvent, setRosterEvent] = useState<CampusEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampusEvent | null>(null);
  const [busyEventId, setBusyEventId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Bootstrap existing JWT session
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthBootstrapping(false);
      return;
    }

    api
      .getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => {
        setAuthBootstrapping(false);
      });
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const isManageView = activeView === 'manage';
      const res = await api.getEvents({
        search: isManageView ? '' : search.trim(),
        category: isManageView ? 'All' : selectedCategory,
        status: isManageView ? 'all' : selectedStatus,
        sort: sortBy,
      });
      setEvents(res.events);
      setDetailEvent((prev) => {
        if (!prev) return null;
        return res.events.find((e) => e.id === prev.id) || prev;
      });
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Unable to load events.');
    } finally {
      setEventsLoading(false);
    }
  }, [activeView, search, selectedCategory, selectedStatus, sortBy, showToast]);

  const loadUserScopedData = useCallback(async () => {
    if (!user) return;
    setRegistrationsLoading(true);
    setStatsLoading(true);
    try {
      const [regRes, statsRes] = await Promise.all([api.getMyRegistrations(), api.getStats()]);
      setMyRegistrations(regRes.registrations);
      setStats(statsRes);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Unable to load dashboard metrics.');
    } finally {
      setRegistrationsLoading(false);
      setStatsLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user || guestBrowsing) {
      loadEvents();
    }
  }, [user, guestBrowsing, loadEvents]);

  useEffect(() => {
    if (user) {
      loadUserScopedData();
    } else {
      setMyRegistrations([]);
      setStats(null);
    }
  }, [user, loadUserScopedData]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadEvents(), loadUserScopedData()]);
  }, [loadEvents, loadUserScopedData]);

  const handleAuthenticated = (token: string, authedUser: User) => {
    setStoredToken(token);
    setUser(authedUser);
    setGuestBrowsing(false);
    setActiveView('dashboard');
    showToast('success', `Signed in as ${authedUser.name}`);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setGuestBrowsing(false);
    setActiveView('dashboard');
    setDetailEvent(null);
  };

  const handleRegister = async (eventId: number, notes: string) => {
    if (!user) {
      setGuestBrowsing(false);
      return;
    }
    setBusyEventId(eventId);
    try {
      await api.registerForEvent(eventId, notes);
      await refreshAll();
      showToast('success', 'Seat reserved! Your registration pass is confirmed.');
    } finally {
      setBusyEventId(null);
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    setBusyEventId(eventId);
    try {
      await api.cancelRegistration(eventId);
      await refreshAll();
      showToast('success', 'Registration cancelled and seat released.');
    } finally {
      setBusyEventId(null);
    }
  };

  const handleQuickRegister = async (event: CampusEvent) => {
    if (!user) {
      setGuestBrowsing(false);
      return;
    }
    const isRegistered =
      event.user_registration &&
      (event.user_registration.status === 'confirmed' ||
        event.user_registration.status === 'attended');

    if (isRegistered) {
      setDetailEvent(event);
      return;
    }

    try {
      await handleRegister(event.id, '');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Registration failed.');
    }
  };

  const handleSaveEvent = async (data: EventFormData) => {
    if (editingEvent) {
      await api.updateEvent(editingEvent.id, data);
      showToast('success', 'Event updated successfully.');
    } else {
      await api.createEvent(data);
      showToast('success', 'New campus event published.');
    }
    await refreshAll();
  };

  const handleDeleteEvent = async (eventId: number) => {
    await api.deleteEvent(eventId);
    showToast('success', 'Campus event deleted.');
    if (detailEvent?.id === eventId) {
      setDetailEvent(null);
    }
    await refreshAll();
  };

  const handleViewEventById = (eventId: number) => {
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setDetailEvent(found);
      return;
    }
    // Fallback if filtered out of current Browse list
    setSelectedStatus('all');
    setSelectedCategory('All');
    setSearch('');
    api
      .getEvents({ status: 'all' })
      .then((res) => {
        const match = res.events.find((e) => e.id === eventId);
        if (match) setDetailEvent(match);
      })
      .catch(() => {
        showToast('error', 'Unable to open event details.');
      });
  };

  if (authBootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-medium text-slate-600">Loading Meridian Campus Portal...</div>
      </div>
    );
  }

  if (!user && !guestBrowsing) {
    return (
      <AuthView
        onAuthenticated={handleAuthenticated}
        onBrowseGuest={() => {
          setGuestBrowsing(true);
          setActiveView('events');
        }}
      />
    );
  }

  const pageTitleMap: Record<ActiveView, string> = {
    dashboard: user?.role === 'admin' ? 'Administrator Overview' : 'Student Dashboard',
    events: 'Campus Event Directory',
    registrations: 'My Registrations',
    manage: 'Manage Campus Events',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        user={user}
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={handleLogout}
        onRequestAuth={() => setGuestBrowsing(false)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Contextual Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">
                Meridian University · {user ? (user.role === 'admin' ? 'Admin Portal' : 'Student Portal') : 'Public Calendar'}
              </div>
              <h1 className="font-display text-base font-semibold text-slate-900 truncate">
                {pageTitleMap[activeView]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user?.role === 'admin' ? (
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Event</span>
              </button>
            ) : !user ? (
              <button
                type="button"
                onClick={() => setGuestBrowsing(false)}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('registrations')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                My Passes ({stats?.myStats.active_registrations ?? myRegistrations.filter((r) => r.registration_status !== 'cancelled').length})
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && user?.role === 'admin' && (
            <AdminAnalyticsView
              stats={stats}
              loading={statsLoading}
              onCreateEvent={() => {
                setEditingEvent(null);
                setFormOpen(true);
              }}
              onManageEvents={() => setActiveView('manage')}
            />
          )}

          {activeView === 'dashboard' && user?.role === 'student' && (
            <StudentDashboardView
              user={user}
              stats={stats}
              events={events}
              myRegistrations={myRegistrations}
              onViewDetails={setDetailEvent}
              onQuickRegister={handleQuickRegister}
              onNavigateEvents={() => setActiveView('events')}
              onNavigateRegistrations={() => setActiveView('registrations')}
              busyEventId={busyEventId}
            />
          )}

          {activeView === 'events' && (
            <BrowseEventsView
              events={events}
              loading={eventsLoading}
              userRole={user?.role ?? null}
              search={search}
              onSearchChange={setSearch}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onResetFilters={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedStatus('upcoming');
                setSortBy('date_asc');
              }}
              onViewDetails={setDetailEvent}
              onQuickRegister={handleQuickRegister}
              onCreateEvent={() => {
                setEditingEvent(null);
                setFormOpen(true);
              }}
              onEditEvent={(ev) => {
                setEditingEvent(ev);
                setFormOpen(true);
              }}
              onDeleteEvent={setDeleteTarget}
              onViewRoster={setRosterEvent}
              busyEventId={busyEventId}
            />
          )}

          {activeView === 'registrations' && user && (
            <MyRegistrationsView
              registrations={myRegistrations}
              loading={registrationsLoading}
              onCancelRegistration={handleCancelRegistration}
              onViewEvent={handleViewEventById}
              onBrowseEvents={() => setActiveView('events')}
            />
          )}

          {activeView === 'manage' && user?.role === 'admin' && (
            <AdminManageEventsView
              events={events}
              loading={eventsLoading}
              onCreateEvent={() => {
                setEditingEvent(null);
                setFormOpen(true);
              }}
              onEditEvent={(ev) => {
                setEditingEvent(ev);
                setFormOpen(true);
              }}
              onDeleteEvent={setDeleteTarget}
              onViewRoster={setRosterEvent}
              onViewDetails={setDetailEvent}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <EventDetailsModal
        event={detailEvent}
        user={user}
        onClose={() => setDetailEvent(null)}
        onRegister={handleRegister}
        onCancelRegistration={handleCancelRegistration}
        onRequestAuth={() => {
          setDetailEvent(null);
          setGuestBrowsing(false);
        }}
      />

      <EventFormModal
        open={formOpen}
        editingEvent={editingEvent}
        onClose={() => {
          setFormOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleSaveEvent}
      />

      <RosterModal
        event={rosterEvent}
        onClose={() => setRosterEvent(null)}
        onStatusChanged={refreshAll}
      />

      <DeleteConfirmModal
        event={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEvent}
      />

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-900'
              : 'bg-white border-red-200 text-red-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
            className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
