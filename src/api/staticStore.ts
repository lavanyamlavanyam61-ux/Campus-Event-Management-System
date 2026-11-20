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

const STORAGE_KEY = 'meridian_campus_static_db_v1';
const SESSION_USER_KEY = 'meridian_campus_static_session_v1';

interface StoredUser extends User {
  password: string;
}

interface StoredRegistration {
  id: number;
  event_id: number;
  user_id: number;
  ticket_code: string;
  status: RegistrationStatus;
  notes: string;
  registered_at: string;
}

interface StaticDatabase {
  users: StoredUser[];
  events: Array<Omit<CampusEvent, 'registered_count' | 'user_registration'>>;
  registrations: StoredRegistration[];
  nextIds: {
    user: number;
    event: number;
    registration: number;
  };
}

function createInitialDb(): StaticDatabase {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 1,
        name: 'Dr. Elena Vance',
        email: 'admin@university.edu',
        password: 'Admin123!',
        role: 'admin',
        student_id: 'ADM-1042',
        department: 'Office of Student Affairs',
      },
      {
        id: 2,
        name: 'Maya Lin',
        email: 'student@university.edu',
        password: 'Student123!',
        role: 'student',
        student_id: 'STU-2026-0841',
        department: 'Computer Science & Engineering',
      },
      {
        id: 3,
        name: 'Marcus Thorne',
        email: 'm.thorne@university.edu',
        password: 'Student123!',
        role: 'student',
        student_id: 'STU-2026-0319',
        department: 'Architecture & Urban Design',
      },
      {
        id: 4,
        name: 'Priya Nair',
        email: 'p.nair@university.edu',
        password: 'Student123!',
        role: 'student',
        student_id: 'STU-2026-1124',
        department: 'Biomedical Engineering',
      },
    ],
    events: [
      {
        id: 1,
        title: 'Annual AI & Systems Research Symposium',
        description:
          'A full-day academic symposium bringing together faculty researchers, doctoral candidates, and undergraduate fellows to present breakthroughs in distributed systems, trustworthy machine learning, and sustainable compute infrastructure.',
        category: 'Academic',
        event_date: '2026-11-24',
        start_time: '09:30',
        end_time: '16:00',
        location: 'Memorial Auditorium, Hall A',
        organizer: 'Dean’s Research Council',
        department: 'School of Engineering',
        capacity: 180,
        image_url: './src/assets/images/event_symposium_hall_1795149841948.jpg',
        status: 'upcoming',
        is_featured: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        title: 'Fall Autonomous Robotics & Hardware Hackathon',
        description:
          'Twenty-four-hour campus build sprint focused on embedded perception, autonomous rovers, and rapid PCB prototyping. Teams of 2–4 students receive microcontroller kits and mentorship from graduate lab leads.',
        category: 'Technology',
        event_date: '2026-11-28',
        start_time: '10:00',
        end_time: '20:00',
        location: 'Innovation & Robotics Lab 204',
        organizer: 'ACM & IEEE Student Chapters',
        department: 'Electrical & Computer Engineering',
        capacity: 60,
        image_url: './src/assets/images/event_hackathon_lab_1795149842473.jpg',
        status: 'upcoming',
        is_featured: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        title: 'Winter Contemporary Architecture & Design Showcase',
        description:
          'Curated evening exhibition presenting thesis models, spatial installations, archival printmaking, and timber fabrication studies produced across the Fall studio sequence.',
        category: 'Arts & Culture',
        event_date: '2026-12-02',
        start_time: '17:30',
        end_time: '20:30',
        location: 'North Pavilion Gallery',
        organizer: 'Curatorial Collective',
        department: 'Architecture & Fine Arts',
        capacity: 90,
        image_url: './src/assets/images/event_arts_gallery_1795149842832.jpg',
        status: 'upcoming',
        is_featured: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        title: 'University Career & Alumni Leadership Summit',
        description:
          'Connect directly with 35+ alumni directors, research labs, and public-sector fellows for 1:1 portfolio critiques, summer fellowship advising, and technical mock interviews.',
        category: 'Career',
        event_date: '2026-12-05',
        start_time: '11:00',
        end_time: '15:30',
        location: 'Founder’s Student Union Atrium',
        organizer: 'Office of Career Development',
        department: 'University Advising',
        capacity: 220,
        image_url: './src/assets/images/event_career_summit_1795149843021.jpg',
        status: 'upcoming',
        is_featured: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 5,
        title: 'Distributed Systems & Cloud Security Workshop',
        description:
          'Hands-on technical seminar covering zero-trust container orchestration, TLS mutual authentication, and reproducible builds in Docker environments.',
        category: 'Workshop',
        event_date: '2026-12-09',
        start_time: '14:00',
        end_time: '16:30',
        location: 'Science Center Room 310',
        organizer: 'Systems Security Group',
        department: 'Computer Science & Engineering',
        capacity: 45,
        image_url: './src/assets/images/event_hackathon_lab_1795149842473.jpg',
        status: 'upcoming',
        is_featured: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: 6,
        title: 'Quantitative Finance & Empirical Economics Expo',
        description:
          'Annual fall forum featuring student econometric research presentations, algorithmic market-microstructure demos, and graduate school application workshops.',
        category: 'Career',
        event_date: '2026-11-10',
        start_time: '10:00',
        end_time: '14:00',
        location: 'Economics Commons, Room 102',
        organizer: 'Undergraduate Economics Society',
        department: 'Economics & Public Policy',
        capacity: 80,
        image_url: './src/assets/images/event_career_summit_1795149843021.jpg',
        status: 'completed',
        is_featured: false,
        created_at: now,
        updated_at: now,
      },
    ],
    registrations: [
      {
        id: 1,
        event_id: 1,
        user_id: 2,
        ticket_code: 'CU-2401-ML',
        status: 'confirmed',
        notes: 'Interested in the distributed systems keynote.',
        registered_at: now,
      },
      {
        id: 2,
        event_id: 1,
        user_id: 3,
        ticket_code: 'CU-2402-MT',
        status: 'confirmed',
        notes: '',
        registered_at: now,
      },
      {
        id: 3,
        event_id: 3,
        user_id: 2,
        ticket_code: 'CU-0201-ML',
        status: 'confirmed',
        notes: '',
        registered_at: now,
      },
      {
        id: 4,
        event_id: 6,
        user_id: 2,
        ticket_code: 'CU-1001-ML',
        status: 'attended',
        notes: '',
        registered_at: now,
      },
    ],
    nextIds: { user: 5, event: 7, registration: 5 },
  };
}

function loadDb(): StaticDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as StaticDatabase;
    }
  } catch {
    // Fallback to initial db
  }
  const initial = createInitialDb();
  saveDb(initial);
  return initial;
}

function saveDb(db: StaticDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors
  }
}

function sanitizeUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    student_id: u.student_id,
    department: u.department,
  };
}

function getCurrentUser(db: StaticDatabase): User | null {
  try {
    const idStr = localStorage.getItem(SESSION_USER_KEY);
    if (!idStr) return null;
    const found = db.users.find((u) => u.id === Number(idStr));
    return found ? sanitizeUser(found) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(userId: number | null): void {
  try {
    if (userId === null) {
      localStorage.removeItem(SESSION_USER_KEY);
    } else {
      localStorage.setItem(SESSION_USER_KEY, String(userId));
    }
  } catch {
    // Ignore
  }
}

function enrichEvent(
  db: StaticDatabase,
  ev: StaticDatabase['events'][number],
  currentUserId: number | null
): CampusEvent {
  const registered_count = db.registrations.filter(
    (r) => r.event_id === ev.id && (r.status === 'confirmed' || r.status === 'attended')
  ).length;

  const userReg =
    currentUserId !== null
      ? db.registrations.find((r) => r.event_id === ev.id && r.user_id === currentUserId)
      : undefined;

  return {
    ...ev,
    registered_count,
    user_registration: userReg
      ? {
          id: userReg.id,
          ticket_code: userReg.ticket_code,
          status: userReg.status,
          notes: userReg.notes,
          registered_at: userReg.registered_at,
        }
      : null,
  };
}

export const staticStore = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const db = loadDb();
    const found = db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!found) {
      throw new Error('Invalid email address or password.');
    }
    setCurrentUser(found.id);
    return { token: `static-session-${found.id}`, user: sanitizeUser(found) };
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
    const db = loadDb();
    const cleanEmail = data.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }
    if (data.role === 'admin' && data.admin_code?.trim() !== 'MERIDIAN-ADMIN-2026') {
      throw new Error('A valid Administrator Invite Code is required to register an admin account.');
    }
    const id = db.nextIds.user++;
    const newUser: StoredUser = {
      id,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password,
      role: data.role,
      student_id:
        data.student_id.trim().toUpperCase() ||
        `${data.role === 'admin' ? 'ADM' : 'STU'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      department: data.department.trim() || 'General Studies',
    };
    db.users.push(newUser);
    saveDb(db);
    setCurrentUser(id);
    return { token: `static-session-${id}`, user: sanitizeUser(newUser) };
  },

  async getMe(): Promise<{ user: User }> {
    const db = loadDb();
    const user = getCurrentUser(db);
    if (!user) {
      throw new Error('Authentication required.');
    }
    return { user };
  },

  async getEvents(filters?: {
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
  }): Promise<{ events: CampusEvent[] }> {
    const db = loadDb();
    const user = getCurrentUser(db);
    let items = db.events.map((ev) => enrichEvent(db, ev, user?.id ?? null));

    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }
    if (filters?.category && filters.category !== 'All') {
      items = items.filter((e) => e.category === filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      items = items.filter((e) => e.status === filters.status);
    }

    if (filters?.sort === 'date_desc') {
      items.sort((a, b) => b.event_date.localeCompare(a.event_date));
    } else if (filters?.sort === 'popular') {
      items.sort((a, b) => b.registered_count - a.registered_count);
    } else {
      items.sort((a, b) => a.event_date.localeCompare(b.event_date));
    }

    return { events: items };
  },

  async createEvent(data: EventFormData): Promise<{ event: CampusEvent }> {
    const db = loadDb();
    const user = getCurrentUser(db);
    if (!user || user.role !== 'admin') throw new Error('Administrator privileges required.');
    const now = new Date().toISOString();
    const id = db.nextIds.event++;
    const ev = { ...data, id, created_at: now, updated_at: now };
    db.events.push(ev);
    saveDb(db);
    return { event: enrichEvent(db, ev, user.id) };
  },

  async updateEvent(id: number, data: EventFormData): Promise<{ event: CampusEvent }> {
    const db = loadDb();
    const user = getCurrentUser(db);
    if (!user || user.role !== 'admin') throw new Error('Administrator privileges required.');
    const idx = db.events.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Event not found.');
    const updated = { ...db.events[idx], ...data, updated_at: new Date().toISOString() };
    db.events[idx] = updated;
    saveDb(db);
    return { event: enrichEvent(db, updated, user.id) };
  },

  async deleteEvent(id: number): Promise<{ deleted: boolean; id: number }> {
    const db = loadDb();
    const user = getCurrentUser(db);
    if (!user || user.role !== 'admin') throw new Error('Administrator privileges required.');
    db.events = db.events.filter((e) => e.id !== id);
    db.registrations = db.registrations.filter((r) => r.event_id !== id);
    saveDb(db);
    return { deleted: true, id };
  },

  async registerForEvent(eventId: number, notes = ''): Promise<{ registration: unknown }> {
    const db = loadDb();
    const user = getCurrentUser(db);
    if (!user) throw new Error('Authentication required.');
    const ev = db.events.find((e) => e.id === eventId);
    if (!ev) throw new Error('Event not found.');
    const existing = db.registrations.find((r) => r.event_id === eventId && r.user_id === user.id);
    if (existing && existing.status !== 'cancelled') {
      throw new Error('You are already registered for this event.');
    }
    const activeCount = db.registrations.filter(
      (r) => r.event_id === eventId && (r.status === 'confirmed' || r.status === 'attended')
    ).length;
    if (activeCount >= ev.capacity) {
      throw new Error('This event has reached full seating capacity.');
    }
    const now = new Date().toISOString();
    const code = `CU-${String(eventId).padStart(2, '0')}${Math.floor(10 + Math.random() * 89)}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
    if (existing) {
      existing.status = 'confirmed';
      existing.ticket_code = code;
      existing.notes = notes;
      existing.registered_at = now;
      saveDb(db);
      return { registration: existing };
    }
    const reg: StoredRegistration = {
      id: db.nextIds.registration++,
      event_id: eventId,
      user_id: user.id,
      ticket_code: code,
      status: 'confirmed',
      notes,
      registered_at: now,
    };
    db.registrations.push(reg);
    saveDb(db);
    return { registration: reg };
  },

  async cancelRegistration(eventId: number): Promise<{ cancelled: boolean; event_id: number }> {
    const db = loadDb();
    const user = getCurrentUser(db);
    if (!user) throw new Error('Authentication required.');
    const existing = db.registrations.find(
      (r) => r.event_id === eventId && r.user_id === user.id && r.status !== 'cancelled'
    );
    if (!existing) throw new Error('No active registration found.');
    existing.status = 'cancelled';
    saveDb(db);
    return { cancelled: true, event_id: eventId };
  },

  async getMyRegistrations(): Promise<{ registrations: MyRegistrationItem[] }> {
    const db = loadDb();
    const user = getCurrentUser(db);
    if (!user) throw new Error('Authentication required.');
    const rows: MyRegistrationItem[] = [];
    for (const r of db.registrations) {
      if (r.user_id !== user.id) continue;
      const ev = db.events.find((e) => e.id === r.event_id);
      if (!ev) continue;
      const registered_count = db.registrations.filter(
        (x) => x.event_id === ev.id && (x.status === 'confirmed' || x.status === 'attended')
      ).length;
      rows.push({
        registration_id: r.id,
        ticket_code: r.ticket_code,
        registration_status: r.status,
        notes: r.notes,
        registered_at: r.registered_at,
        event_id: ev.id,
        title: ev.title,
        description: ev.description,
        category: ev.category,
        event_date: ev.event_date,
        start_time: ev.start_time,
        end_time: ev.end_time,
        location: ev.location,
        organizer: ev.organizer,
        department: ev.department,
        capacity: ev.capacity,
        image_url: ev.image_url,
        event_status: ev.status,
        registered_count,
      });
    }
    return { registrations: rows };
  },

  async getEventRoster(eventId: number): Promise<{
    event: { id: number; title: string; capacity: number; event_date: string; location: string };
    registrations: RosterRegistration[];
  }> {
    const db = loadDb();
    const ev = db.events.find((e) => e.id === eventId);
    if (!ev) throw new Error('Event not found.');
    const registrations: RosterRegistration[] = db.registrations
      .filter((r) => r.event_id === eventId)
      .map((r) => {
        const u = db.users.find((usr) => usr.id === r.user_id);
        return {
          id: r.id,
          event_id: r.event_id,
          user_id: r.user_id,
          ticket_code: r.ticket_code,
          status: r.status,
          notes: r.notes,
          registered_at: r.registered_at,
          student_name: u?.name || 'Student',
          student_email: u?.email || '',
          student_id: u?.student_id || '',
          department: u?.department || '',
          role: u?.role || 'student',
        };
      });
    return {
      event: {
        id: ev.id,
        title: ev.title,
        capacity: ev.capacity,
        event_date: ev.event_date,
        location: ev.location,
      },
      registrations,
    };
  },

  async updateRegistrationStatus(
    registrationId: number,
    status: RegistrationStatus
  ): Promise<{ updated: boolean; id: number; status: RegistrationStatus }> {
    const db = loadDb();
    const reg = db.registrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error('Registration not found.');
    reg.status = status;
    saveDb(db);
    return { updated: true, id: registrationId, status };
  },

  async getStats(): Promise<DashboardStats> {
    const db = loadDb();
    const user = getCurrentUser(db);
    const activeRegs = db.registrations.filter(
      (r) => r.status === 'confirmed' || r.status === 'attended'
    );
    const total_capacity = db.events
      .filter((e) => e.status !== 'cancelled')
      .reduce((acc, e) => acc + e.capacity, 0);

    const categoryMap = new Map<
      string,
      { category: string; event_count: number; total_capacity: number; registration_count: number }
    >();
    for (const ev of db.events) {
      const cur = categoryMap.get(ev.category) || {
        category: ev.category,
        event_count: 0,
        total_capacity: 0,
        registration_count: 0,
      };
      cur.event_count += 1;
      cur.total_capacity += ev.capacity;
      cur.registration_count += activeRegs.filter((r) => r.event_id === ev.id).length;
      categoryMap.set(ev.category, cur);
    }

    const recentRegistrations =
      user?.role === 'admin'
        ? db.registrations
            .slice(-8)
            .reverse()
            .map((r) => {
              const u = db.users.find((usr) => usr.id === r.user_id);
              const ev = db.events.find((e) => e.id === r.event_id);
              return {
                id: r.id,
                ticket_code: r.ticket_code,
                status: r.status,
                registered_at: r.registered_at,
                student_name: u?.name || 'Student',
                student_id: u?.student_id || '',
                department: u?.department || '',
                event_id: r.event_id,
                event_title: ev?.title || 'Event',
                event_date: ev?.event_date || '',
              };
            })
        : [];

    const myRegs = user ? db.registrations.filter((r) => r.user_id === user.id) : [];

    return {
      summary: {
        total_events: db.events.length,
        upcoming_events: db.events.filter((e) => e.status === 'upcoming').length,
        completed_events: db.events.filter((e) => e.status === 'completed').length,
        total_registrations: activeRegs.length,
        total_students: db.users.filter((u) => u.role === 'student').length,
        total_capacity,
        utilization_pct:
          total_capacity > 0 ? Math.round((activeRegs.length / total_capacity) * 100) : 0,
      },
      categoryBreakdown: Array.from(categoryMap.values()),
      recentRegistrations,
      myStats: {
        active_registrations: myRegs.filter(
          (r) => r.status === 'confirmed' || r.status === 'attended'
        ).length,
        attended_events: myRegs.filter((r) => r.status === 'attended').length,
        cancelled_registrations: myRegs.filter((r) => r.status === 'cancelled').length,
      },
    };
  },
};
