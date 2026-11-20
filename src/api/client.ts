import type {
  CampusEvent,
  DashboardStats,
  EventFormData,
  MyRegistrationItem,
  RegistrationStatus,
  RosterRegistration,
  User,
  UserRole,
} from '../types';
import { staticStore } from './staticStore';

const TOKEN_STORAGE_KEY = 'meridian_campus_token';

let backendModePromise: Promise<'express' | 'static'> | null = null;

async function detectBackendMode(): Promise<'express' | 'static'> {
  if (!backendModePromise) {
    backendModePromise = (async () => {
      try {
        const res = await fetch('./api/health', { method: 'GET' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return 'express';
        }
      } catch {
        // Network error or static host
      }
      try {
        const rootRes = await fetch('/api/health', { method: 'GET' });
        const contentType = rootRes.headers.get('content-type') || '';
        if (rootRes.ok && contentType.includes('application/json')) {
          return 'express';
        }
      } catch {
        // Static-only host (e.g., GitHub Pages)
      }
      return 'static';
    })();
  }
  return backendModePromise;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted frames
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  async getConfig(): Promise<{ demoMode: boolean }> {
    if ((await detectBackendMode()) === 'static') {
      return { demoMode: true };
    }
    return request('/api/config');
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.login(email, password);
    }
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async registerAccount(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    student_id: string;
    department: string;
    admin_code?: string;
  }): Promise<{ token: string; user: User }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.registerAccount(data);
    }
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ user: User }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.getMe();
    }
    return request('/api/auth/me');
  },

  async getEvents(filters?: {
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
  }): Promise<{ events: CampusEvent[] }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.getEvents(filters);
    }
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.sort) params.set('sort', filters.sort);
    const qs = params.toString();
    return request(`/api/events${qs ? `?${qs}` : ''}`);
  },

  async createEvent(data: EventFormData): Promise<{ event: CampusEvent }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.createEvent(data);
    }
    return request('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEvent(id: number, data: EventFormData): Promise<{ event: CampusEvent }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.updateEvent(id, data);
    }
    return request(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEvent(id: number): Promise<{ deleted: boolean; id: number }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.deleteEvent(id);
    }
    return request(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },

  async registerForEvent(eventId: number, notes = ''): Promise<{ registration: unknown }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.registerForEvent(eventId, notes);
    }
    return request(`/api/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async cancelRegistration(eventId: number): Promise<{ cancelled: boolean; event_id: number }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.cancelRegistration(eventId);
    }
    return request(`/api/events/${eventId}/register`, {
      method: 'DELETE',
    });
  },

  async getMyRegistrations(): Promise<{ registrations: MyRegistrationItem[] }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.getMyRegistrations();
    }
    return request('/api/registrations/me');
  },

  async getEventRoster(eventId: number): Promise<{
    event: { id: number; title: string; capacity: number; event_date: string; location: string };
    registrations: RosterRegistration[];
  }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.getEventRoster(eventId);
    }
    return request(`/api/events/${eventId}/registrations`);
  },

  async updateRegistrationStatus(
    registrationId: number,
    status: RegistrationStatus
  ): Promise<{ updated: boolean; id: number; status: RegistrationStatus }> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.updateRegistrationStatus(registrationId, status);
    }
    return request(`/api/registrations/${registrationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getStats(): Promise<DashboardStats> {
    if ((await detectBackendMode()) === 'static') {
      return staticStore.getStats();
    }
    return request('/api/stats');
  },
};
