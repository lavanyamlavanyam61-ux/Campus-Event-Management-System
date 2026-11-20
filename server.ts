import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { initDb, getDb } from './server/db.ts';
import {
  authenticateOptional,
  authenticateRequired,
  requireAdmin,
  signToken,
  type AuthenticatedRequest,
  type AuthUser,
} from './server/auth.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

initDb();

const app = express();
app.use(express.json({ limit: '2mb' }));

function generateTicketCode(eventId: number): string {
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const paddedEvent = String(eventId).padStart(2, '0');
  return `CU-${paddedEvent}${Math.floor(10 + Math.random() * 89)}-${randomSuffix}`;
}

function formatEventRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    event_date: String(row.event_date),
    start_time: String(row.start_time),
    end_time: String(row.end_time),
    location: String(row.location),
    organizer: String(row.organizer),
    department: String(row.department),
    capacity: Number(row.capacity),
    image_url: String(row.image_url),
    status: String(row.status),
    is_featured: Boolean(row.is_featured),
    registered_count: Number(row.registered_count || 0),
    user_registration: row.user_reg_id
      ? {
          id: Number(row.user_reg_id),
          ticket_code: String(row.user_reg_ticket),
          status: String(row.user_reg_status),
          notes: String(row.user_reg_notes || ''),
          registered_at: String(row.user_reg_at),
        }
      : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

// Health check for Docker and monitoring
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, student_id, department } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    return;
  }

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ error: 'Please enter a valid university email address.' });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const assignedRole: 'student' | 'admin' = role === 'admin' ? 'admin' : 'student';
  const cleanDept =
    typeof department === 'string' && department.trim().length >= 2
      ? department.trim()
      : assignedRole === 'admin'
        ? 'Office of Student Affairs'
        : 'General Studies';

  const cleanStudentId =
    typeof student_id === 'string' && student_id.trim().length >= 3
      ? student_id.trim().toUpperCase()
      : `${assignedRole === 'admin' ? 'ADM' : 'STU'}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, student_id, department, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name.trim(), normalizedEmail, passwordHash, assignedRole, cleanStudentId, cleanDept, now);

  const user: AuthUser = {
    id: Number(result.lastInsertRowid),
    name: name.trim(),
    email: normalizedEmail,
    role: assignedRole,
    student_id: cleanStudentId,
    department: cleanDept,
  };

  const token = signToken(user);
  res.status(201).json({ token, user });
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || !password || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const db = getDb();
  const row = db
    .prepare(
      'SELECT id, name, email, password_hash, role, student_id, department FROM users WHERE email = ?'
    )
    .get(normalizedEmail) as (AuthUser & { password_hash: string }) | undefined;

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email address or password.' });
    return;
  }

  const user: AuthUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    student_id: row.student_id,
    department: row.department,
  };

  const token = signToken(user);
  res.json({ token, user });
});

// Auth: Current user
app.get('/api/auth/me', authenticateRequired, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// Events: List with filtering & search
app.get('/api/events', authenticateOptional, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userId = req.user?.id ?? -1;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort.trim() : 'date_asc';

  const whereClauses: string[] = [];
  const params: Array<string | number> = [userId];

  if (search) {
    whereClauses.push(
      '(LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(e.location) LIKE ? OR LOWER(e.organizer) LIKE ? OR LOWER(e.department) LIKE ?)'
    );
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  if (category && category !== 'All') {
    whereClauses.push('e.category = ?');
    params.push(category);
  }

  if (status && status !== 'all') {
    whereClauses.push('e.status = ?');
    params.push(status);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let orderSql = 'ORDER BY e.event_date ASC, e.start_time ASC';
  if (sort === 'date_desc') {
    orderSql = 'ORDER BY e.event_date DESC, e.start_time DESC';
  } else if (sort === 'popular') {
    orderSql = 'ORDER BY registered_count DESC, e.event_date ASC';
  }

  const query = `
    SELECT
      e.*,
      (
        SELECT COUNT(*)
        FROM registrations r
        WHERE r.event_id = e.id AND r.status IN ('confirmed', 'attended')
      ) AS registered_count,
      ur.id AS user_reg_id,
      ur.ticket_code AS user_reg_ticket,
      ur.status AS user_reg_status,
      ur.notes AS user_reg_notes,
      ur.registered_at AS user_reg_at
    FROM events e
    LEFT JOIN registrations ur ON ur.event_id = e.id AND ur.user_id = ?
    ${whereSql}
    ${orderSql}
  `;

  const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;
  res.json({ events: rows.map(formatEventRow) });
});

// Events: Single event details
app.get('/api/events/:id', authenticateOptional, (req: AuthenticatedRequest, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    res.status(400).json({ error: 'Invalid event ID.' });
    return;
  }

  const db = getDb();
  const userId = req.user?.id ?? -1;

  const row = db
    .prepare(
      `
      SELECT
        e.*,
        (
          SELECT COUNT(*)
          FROM registrations r
          WHERE r.event_id = e.id AND r.status IN ('confirmed', 'attended')
        ) AS registered_count,
        ur.id AS user_reg_id,
        ur.ticket_code AS user_reg_ticket,
        ur.status AS user_reg_status,
        ur.notes AS user_reg_notes,
        ur.registered_at AS user_reg_at
      FROM events e
      LEFT JOIN registrations ur ON ur.event_id = e.id AND ur.user_id = ?
      WHERE e.id = ?
      `
    )
    .get(userId, eventId) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }

  res.json({ event: formatEventRow(row) });
});

function validateEventPayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const event_date = typeof body.event_date === 'string' ? body.event_date.trim() : '';
  const start_time = typeof body.start_time === 'string' ? body.start_time.trim() : '';
  const end_time = typeof body.end_time === 'string' ? body.end_time.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const organizer = typeof body.organizer === 'string' ? body.organizer.trim() : '';
  const department = typeof body.department === 'string' ? body.department.trim() : '';
  const capacity = Number(body.capacity);
  const image_url =
    typeof body.image_url === 'string' && body.image_url.trim().length > 0
      ? body.image_url.trim()
      : '/src/assets/images/event_symposium_hall_1795149841948.jpg';
  const status =
    typeof body.status === 'string' &&
    ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(body.status)
      ? body.status
      : 'upcoming';
  const is_featured = body.is_featured ? 1 : 0;

  if (title.length < 3) return { error: 'Event title must be at least 3 characters.' };
  if (description.length < 15) return { error: 'Description must be at least 15 characters.' };
  if (!category) return { error: 'Please select an event category.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return { error: 'Valid event date (YYYY-MM-DD) is required.' };
  if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
    return { error: 'Valid start and end times (HH:MM) are required.' };
  }
  if (end_time <= start_time) {
    return { error: 'End time must be later than start time.' };
  }
  if (location.length < 2) return { error: 'Location/venue is required.' };
  if (organizer.length < 2) return { error: 'Organizer name is required.' };
  if (department.length < 2) return { error: 'Department is required.' };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
    return { error: 'Capacity must be an integer between 1 and 5,000.' };
  }

  return {
    data: {
      title,
      description,
      category,
      event_date,
      start_time,
      end_time,
      location,
      organizer,
      department,
      capacity,
      image_url,
      status,
      is_featured,
    },
  };
}

// Events: Create (Admin only)
app.post('/api/events', authenticateRequired, requireAdmin, (req: AuthenticatedRequest, res) => {
  const parsed = validateEventPayload((req.body || {}) as Record<string, unknown>);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const d = parsed.data;
  const db = getDb();
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO events (
        title, description, category, event_date, start_time, end_time,
        location, organizer, department, capacity, image_url, status, is_featured,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      d.title,
      d.description,
      d.category,
      d.event_date,
      d.start_time,
      d.end_time,
      d.location,
      d.organizer,
      d.department,
      d.capacity,
      d.image_url,
      d.status,
      d.is_featured,
      req.user!.id,
      now,
      now
    );

  const createdRow = db
    .prepare('SELECT *, 0 AS registered_count FROM events WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as Record<string, unknown>;

  res.status(201).json({ event: formatEventRow(createdRow) });
});

// Events: Update (Admin only)
app.put('/api/events/:id', authenticateRequired, requireAdmin, (req: AuthenticatedRequest, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    res.status(400).json({ error: 'Invalid event ID.' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
  if (!existing) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }

  const parsed = validateEventPayload((req.body || {}) as Record<string, unknown>);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const d = parsed.data;
  const activeCountRow = db
    .prepare(
      "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND status IN ('confirmed', 'attended')"
    )
    .get(eventId) as { count: number };

  if (d.capacity < activeCountRow.count) {
    res.status(400).json({
      error: `Capacity (${d.capacity}) cannot be lower than currently confirmed registrations (${activeCountRow.count}).`,
    });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE events SET
      title = ?, description = ?, category = ?, event_date = ?, start_time = ?, end_time = ?,
      location = ?, organizer = ?, department = ?, capacity = ?, image_url = ?, status = ?,
      is_featured = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    d.title,
    d.description,
    d.category,
    d.event_date,
    d.start_time,
    d.end_time,
    d.location,
    d.organizer,
    d.department,
    d.capacity,
    d.image_url,
    d.status,
    d.is_featured,
    now,
    eventId
  );

  const updatedRow = db
    .prepare(
      `SELECT e.*,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status IN ('confirmed', 'attended')) AS registered_count
       FROM events e WHERE e.id = ?`
    )
    .get(eventId) as Record<string, unknown>;

  res.json({ event: formatEventRow(updatedRow) });
});

// Events: Delete (Admin only)
app.delete('/api/events/:id', authenticateRequired, requireAdmin, (req: AuthenticatedRequest, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    res.status(400).json({ error: 'Invalid event ID.' });
    return;
  }

  const db = getDb();
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(eventId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }

  res.json({ deleted: true, id: eventId });
});

// Registrations: Register for an event
app.post('/api/events/:id/register', authenticateRequired, (req: AuthenticatedRequest, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    res.status(400).json({ error: 'Invalid event ID.' });
    return;
  }

  const db = getDb();
  const event = db
    .prepare('SELECT id, title, capacity, status FROM events WHERE id = ?')
    .get(eventId) as { id: number; title: string; capacity: number; status: string } | undefined;

  if (!event) {
    res.status(404).json({ error: 'Event not found.' });
    return;
  }

  if (event.status === 'cancelled' || event.status === 'completed') {
    res.status(400).json({ error: `Cannot register because this event is ${event.status}.` });
    return;
  }

  const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 300) : '';
  const userId = req.user!.id;

  const existing = db
    .prepare('SELECT id, status, ticket_code, registered_at FROM registrations WHERE event_id = ? AND user_id = ?')
    .get(eventId, userId) as
    | { id: number; status: string; ticket_code: string; registered_at: string }
    | undefined;

  if (existing && (existing.status === 'confirmed' || existing.status === 'attended')) {
    res.status(409).json({ error: 'You are already registered for this event.' });
    return;
  }

  const activeCount = db
    .prepare(
      "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND status IN ('confirmed', 'attended')"
    )
    .get(eventId) as { count: number };

  if (activeCount.count >= event.capacity) {
    res.status(409).json({ error: 'This event has reached full seating capacity.' });
    return;
  }

  const now = new Date().toISOString();

  if (existing && existing.status === 'cancelled') {
    const newCode = generateTicketCode(eventId);
    db.prepare(
      "UPDATE registrations SET status = 'confirmed', ticket_code = ?, notes = ?, registered_at = ? WHERE id = ?"
    ).run(newCode, notes, now, existing.id);

    res.status(201).json({
      registration: {
        id: existing.id,
        event_id: eventId,
        user_id: userId,
        ticket_code: newCode,
        status: 'confirmed',
        notes,
        registered_at: now,
      },
    });
    return;
  }

  const ticketCode = generateTicketCode(eventId);
  const result = db
    .prepare(
      `INSERT INTO registrations (event_id, user_id, ticket_code, status, notes, registered_at)
       VALUES (?, ?, ?, 'confirmed', ?, ?)`
    )
    .run(eventId, userId, ticketCode, notes, now);

  res.status(201).json({
    registration: {
      id: Number(result.lastInsertRowid),
      event_id: eventId,
      user_id: userId,
      ticket_code: ticketCode,
      status: 'confirmed',
      notes,
      registered_at: now,
    },
  });
});

// Registrations: Cancel current user's registration for an event
app.delete('/api/events/:id/register', authenticateRequired, (req: AuthenticatedRequest, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    res.status(400).json({ error: 'Invalid event ID.' });
    return;
  }

  const db = getDb();
  const result = db
    .prepare(
      "UPDATE registrations SET status = 'cancelled' WHERE event_id = ? AND user_id = ? AND status != 'cancelled'"
    )
    .run(eventId, req.user!.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'No active registration found for this event.' });
    return;
  }

  res.json({ cancelled: true, event_id: eventId });
});

// Registrations: Get current user's registrations
app.get('/api/registrations/me', authenticateRequired, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT
        r.id AS registration_id,
        r.ticket_code,
        r.status AS registration_status,
        r.notes,
        r.registered_at,
        e.id AS event_id,
        e.title,
        e.description,
        e.category,
        e.event_date,
        e.start_time,
        e.end_time,
        e.location,
        e.organizer,
        e.department,
        e.capacity,
        e.image_url,
        e.status AS event_status,
        (
          SELECT COUNT(*)
          FROM registrations r2
          WHERE r2.event_id = e.id AND r2.status IN ('confirmed', 'attended')
        ) AS registered_count
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE r.user_id = ?
      ORDER BY
        CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END ASC,
        e.event_date ASC,
        e.start_time ASC
      `
    )
    .all(req.user!.id) as Array<Record<string, unknown>>;

  res.json({ registrations: rows });
});

// Registrations: View registered students for an event (Admin only)
app.get(
  '/api/events/:id/registrations',
  authenticateRequired,
  requireAdmin,
  (req: AuthenticatedRequest, res) => {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      res.status(400).json({ error: 'Invalid event ID.' });
      return;
    }

    const db = getDb();
    const event = db
      .prepare('SELECT id, title, capacity, event_date, location FROM events WHERE id = ?')
      .get(eventId) as Record<string, unknown> | undefined;

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const rows = db
      .prepare(
        `
        SELECT
          r.id,
          r.event_id,
          r.user_id,
          r.ticket_code,
          r.status,
          r.notes,
          r.registered_at,
          u.name AS student_name,
          u.email AS student_email,
          u.student_id,
          u.department,
          u.role
        FROM registrations r
        JOIN users u ON u.id = r.user_id
        WHERE r.event_id = ?
        ORDER BY
          CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END ASC,
          r.registered_at DESC
        `
      )
      .all(eventId) as Array<Record<string, unknown>>;

    res.json({ event, registrations: rows });
  }
);

// Registrations: Update registration status (Admin check-in / cancellation)
app.patch(
  '/api/registrations/:id/status',
  authenticateRequired,
  requireAdmin,
  (req: AuthenticatedRequest, res) => {
    const regId = Number(req.params.id);
    const status = typeof req.body?.status === 'string' ? req.body.status : '';
    if (!Number.isInteger(regId) || regId <= 0) {
      res.status(400).json({ error: 'Invalid registration ID.' });
      return;
    }
    if (!['confirmed', 'attended', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }

    const db = getDb();
    const result = db.prepare('UPDATE registrations SET status = ? WHERE id = ?').run(status, regId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    res.json({ updated: true, id: regId, status });
  }
);

// Dashboard Statistics (Student + Admin)
app.get('/api/stats', authenticateRequired, (req: AuthenticatedRequest, res) => {
  const db = getDb();

  const summary = db
    .prepare(
      `
      SELECT
        (SELECT COUNT(*) FROM events) AS total_events,
        (SELECT COUNT(*) FROM events WHERE status = 'upcoming') AS upcoming_events,
        (SELECT COUNT(*) FROM events WHERE status = 'completed') AS completed_events,
        (SELECT COUNT(*) FROM registrations WHERE status IN ('confirmed', 'attended')) AS total_registrations,
        (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
        (SELECT COALESCE(SUM(capacity), 0) FROM events WHERE status != 'cancelled') AS total_capacity
      `
    )
    .get() as {
    total_events: number;
    upcoming_events: number;
    completed_events: number;
    total_registrations: number;
    total_students: number;
    total_capacity: number;
  };

  const categoryBreakdown = db
    .prepare(
      `
      SELECT
        e.category,
        COUNT(DISTINCT e.id) AS event_count,
        COALESCE(SUM(e.capacity), 0) AS total_capacity,
        COUNT(CASE WHEN r.status IN ('confirmed', 'attended') THEN 1 END) AS registration_count
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      GROUP BY e.category
      ORDER BY registration_count DESC, event_count DESC
      `
    )
    .all() as Array<{
    category: string;
    event_count: number;
    total_capacity: number;
    registration_count: number;
  }>;

  const recentRegistrations =
    req.user!.role === 'admin'
      ? db
          .prepare(
            `
            SELECT
              r.id,
              r.ticket_code,
              r.status,
              r.registered_at,
              u.name AS student_name,
              u.student_id,
              u.department,
              e.id AS event_id,
              e.title AS event_title,
              e.event_date
            FROM registrations r
            JOIN users u ON u.id = r.user_id
            JOIN events e ON e.id = r.event_id
            ORDER BY r.registered_at DESC
            LIMIT 8
            `
          )
          .all()
      : [];

  const myStats = db
    .prepare(
      `
      SELECT
        COUNT(CASE WHEN r.status IN ('confirmed', 'attended') THEN 1 END) AS active_registrations,
        COUNT(CASE WHEN r.status = 'attended' THEN 1 END) AS attended_events,
        COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) AS cancelled_registrations
      FROM registrations r
      WHERE r.user_id = ?
      `
    )
    .get(req.user!.id) as {
    active_registrations: number;
    attended_events: number;
    cancelled_registrations: number;
  };

  const utilizationPct =
    summary.total_capacity > 0
      ? Math.round((summary.total_registrations / summary.total_capacity) * 100)
      : 0;

  res.json({
    summary: {
      ...summary,
      utilization_pct: utilizationPct,
    },
    categoryBreakdown,
    recentRegistrations,
    myStats,
  });
});

async function startServer() {
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meridian Campus Events server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
