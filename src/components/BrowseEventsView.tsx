import { CalendarDays, Plus, Search } from 'lucide-react';
import { EVENT_CATEGORIES, type CampusEvent, type UserRole } from '../types';
import { EventCard } from './EventCard';

interface BrowseEventsViewProps {
  events: CampusEvent[];
  loading: boolean;
  userRole: UserRole | null;
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onResetFilters: () => void;
  onViewDetails: (event: CampusEvent) => void;
  onQuickRegister: (event: CampusEvent) => void;
  onCreateEvent?: () => void;
  onEditEvent?: (event: CampusEvent) => void;
  onDeleteEvent?: (event: CampusEvent) => void;
  onViewRoster?: (event: CampusEvent) => void;
  busyEventId: number | null;
}

export function BrowseEventsView({
  events,
  loading,
  userRole,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  onResetFilters,
  onViewDetails,
  onQuickRegister,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onViewRoster,
  busyEventId,
}: BrowseEventsViewProps) {
  const categories = ['All', ...EVENT_CATEGORIES];

  return (
    <div className="space-y-6">
      {/* Toolbar: Search, Status, Sort */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search events by title, department, organizer, or venue..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <select
              aria-label="Filter by event status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="upcoming">Upcoming Only</option>
              <option value="all">All Statuses</option>
              <option value="ongoing">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              aria-label="Sort events"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="date_asc">Soonest First</option>
              <option value="popular">Most Popular</option>
              <option value="date_desc">Latest Date</option>
            </select>

            {userRole === 'admin' && onCreateEvent && (
              <button
                type="button"
                onClick={onCreateEvent}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Segmented Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="tabular-nums">
          Showing {events.length} {events.length === 1 ? 'event' : 'events'}
          {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
        </span>
        {(search || selectedCategory !== 'All' || selectedStatus !== 'upcoming') && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-blue-700 hover:text-blue-800 font-medium cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[400px] animate-pulse"
            >
              <div className="aspect-[16/9] bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CalendarDays className="w-8 h-8 text-slate-400 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="font-display text-base font-semibold text-slate-900">
            No matching campus events
          </h3>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
            Try adjusting your search keywords, switching the status filter to All Statuses, or
            selecting another academic category.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              userRole={userRole}
              onViewDetails={onViewDetails}
              onQuickRegister={onQuickRegister}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
              onViewRoster={onViewRoster}
              busyEventId={busyEventId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
