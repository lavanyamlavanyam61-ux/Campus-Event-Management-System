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

const TOKEN_STORAGE_KEY = 'meridian_campus_token';

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
    return request('/api/config');
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
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
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request('/api/auth/me');
  },

  async getEvents(filters?: {
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
  }): Promise<{ events: CampusEvent[] }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.sort) params.set('sort', filters.sort);
    const qs = params.toString();
    return request(`/api/events${qs ? `?${qs}` : ''}`);
  },

  async createEvent(data: EventFormData): Promise<{ event: CampusEvent }> {
    return request('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEvent(id: number, data: EventFormData): Promise<{ event: CampusEvent }> {
    return request(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEvent(id: number): Promise<{ deleted: boolean; id: number }> {
    return request(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },

  async registerForEvent(eventId: number, notes = ''): Promise<{ registration: unknown }> {
    return request(`/api/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async cancelRegistration(eventId: number): Promise<{ cancelled: boolean; event_id: number }> {
    return request(`/api/events/${eventId}/register`, {
      method: 'DELETE',
    });
  },

  async getMyRegistrations(): Promise<{ registrations: MyRegistrationItem[] }> {
    return request('/api/registrations/me');
  },

  async getEventRoster(eventId: number): Promise<{
    event: { id: number; title: string; capacity: number; event_date: string; location: string };
    registrations: RosterRegistration[];
  }> {
    return request(`/api/events/${eventId}/registrations`);
  },

  async updateRegistrationStatus(
    registrationId: number,
    status: RegistrationStatus
  ): Promise<{ updated: boolean; id: number; status: RegistrationStatus }> {
    return request(`/api/registrations/${registrationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getStats(): Promise<DashboardStats> {
    return request('/api/stats');
  },
};
