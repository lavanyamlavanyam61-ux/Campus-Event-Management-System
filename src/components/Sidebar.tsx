import {
  CalendarDays,
  LayoutDashboard,
  Ticket,
  Settings2,
  LogOut,
  X,
  LogIn,
} from 'lucide-react';
import type { User } from '../types';

export type ActiveView = 'dashboard' | 'events' | 'registrations' | 'manage';

interface SidebarProps {
  user: User | null;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
  onRequestAuth: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  user,
  activeView,
  onNavigate,
  onLogout,
  onRequestAuth,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: ActiveView;
    label: string;
    icon: typeof LayoutDashboard;
    visible: boolean;
  }> = [
    {
      id: 'dashboard',
      label: user?.role === 'admin' ? 'Admin Overview' : 'Student Dashboard',
      icon: LayoutDashboard,
      visible: Boolean(user),
    },
    {
      id: 'events',
      label: 'Browse Events',
      icon: CalendarDays,
      visible: true,
    },
    {
      id: 'registrations',
      label: 'My Registrations',
      icon: Ticket,
      visible: Boolean(user),
    },
    {
      id: 'manage',
      label: 'Manage Events',
      icon: Settings2,
      visible: user?.role === 'admin',
    },
  ];

  const handleSelect = (view: ActiveView) => {
    onNavigate(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 shrink-0">
        <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
          Meridian Campus
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Primary Navigation">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400'}`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
      </nav>

      <div className="p-4 border-t border-slate-200 shrink-0">
        {user ? (
          <div className="space-y-3">
            <div className="px-2">
              <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                {user.role === 'admin' ? 'Administrator' : 'Student'} · {user.student_id}
              </div>
              <div className="text-xs text-slate-400 truncate mt-0.5">{user.department}</div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRequestAuth}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
