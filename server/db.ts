import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call initDb() first.');
  }
  return dbInstance;
}

export function initDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'campus_events.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'admin')),
      student_id TEXT NOT NULL,
      department TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      location TEXT NOT NULL,
      organizer TEXT NOT NULL,
      department TEXT NOT NULL,
      capacity INTEGER NOT NULL CHECK(capacity >= 1),
      image_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
      is_featured INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'attended', 'cancelled')),
      notes TEXT NOT NULL DEFAULT '',
      registered_at TEXT NOT NULL,
      UNIQUE(event_id, user_id)
    );
  `);

  dbInstance = db;
  seedDatabase(db);
  return db;
}

function seedDatabase(db: DatabaseSync): void {
  const userCountRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCountRow.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const adminHash = bcrypt.hashSync('Admin123!', 10);
  const studentHash = bcrypt.hashSync('Student123!', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, student_id, department, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminResult = insertUser.run(
    'Dr. Elena Vance',
    'admin@university.edu',
    adminHash,
    'admin',
    'ADM-1042',
    'Office of Student Affairs',
    now
  );
  const adminId = Number(adminResult.lastInsertRowid);

  const student1 = insertUser.run(
    'Maya Lin',
    'student@university.edu',
    studentHash,
    'student',
    'STU-2026-0841',
    'Computer Science & Engineering',
    now
  );
  const student1Id = Number(student1.lastInsertRowid);

  const student2 = insertUser.run(
    'Marcus Thorne',
    'm.thorne@university.edu',
    studentHash,
    'student',
    'STU-2026-0319',
    'Architecture & Urban Design',
    now
  );
  const student2Id = Number(student2.lastInsertRowid);

  const student3 = insertUser.run(
    'Priya Nair',
    'p.nair@university.edu',
    studentHash,
    'student',
    'STU-2026-1124',
    'Biomedical Engineering',
    now
  );
  const student3Id = Number(student3.lastInsertRowid);

  const student4 = insertUser.run(
    'Julian Mercer',
    'j.mercer@university.edu',
    studentHash,
    'student',
    'STU-2026-0592',
    'Economics & Public Policy',
    now
  );
  const student4Id = Number(student4.lastInsertRowid);

  const insertEvent = db.prepare(`
    INSERT INTO events (
      title, description, category, event_date, start_time, end_time,
      location, organizer, department, capacity, image_url, status, is_featured,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seededEvents = [
    {
      title: 'Annual AI & Systems Research Symposium',
      description:
        'A full-day academic symposium bringing together faculty researchers, doctoral candidates, and undergraduate fellows to present breakthroughs in distributed systems, trustworthy machine learning, and sustainable compute infrastructure. Includes keynote address, peer poster sessions, and lunch roundtable.',
      category: 'Academic',
      event_date: '2026-11-24',
      start_time: '09:30',
      end_time: '16:00',
      location: 'Memorial Auditorium, Hall A',
      organizer: 'Dean’s Research Council',
      department: 'School of Engineering',
      capacity: 180,
      image_url: '/src/assets/images/event_symposium_hall_1795149841948.jpg',
      status: 'upcoming',
      is_featured: 1,
    },
    {
      title: 'Fall Autonomous Robotics & Hardware Hackathon',
      description:
        'Twenty-four-hour campus build sprint focused on embedded perception, autonomous rovers, and rapid PCB prototyping. Teams of 2–4 students receive microcontroller kits, benchtop oscilloscope access, and mentorship from graduate lab leads.',
      category: 'Technology',
      event_date: '2026-11-28',
      start_time: '10:00',
      end_time: '20:00',
      location: 'Innovation & Robotics Lab 204',
      organizer: 'ACM & IEEE Student Chapters',
      department: 'Electrical & Computer Engineering',
      capacity: 60,
      image_url: '/src/assets/images/event_hackathon_lab_1795149842473.jpg',
      status: 'upcoming',
      is_featured: 1,
    },
    {
      title: 'Winter Contemporary Architecture & Design Showcase',
      description:
        'Curated evening exhibition presenting thesis models, spatial installations, archival printmaking, and timber fabrication studies produced across the Fall studio sequence. Open critique walkthrough begins at 18:00.',
      category: 'Arts & Culture',
      event_date: '2026-12-02',
      start_time: '17:30',
      end_time: '20:30',
      location: 'North Pavilion Gallery',
      organizer: 'Curatorial Collective',
      department: 'Architecture & Fine Arts',
      capacity: 90,
      image_url: '/src/assets/images/event_arts_gallery_1795149842832.jpg',
      status: 'upcoming',
      is_featured: 0,
    },
    {
      title: 'University Career & Alumni Leadership Summit',
      description:
        'Connect directly with 35+ alumni directors, research labs, and public-sector fellows for 1:1 portfolio critiques, summer fellowship advising, and technical mock interviews in the sunlit Student Union Atrium.',
      category: 'Career',
      event_date: '2026-12-05',
      start_time: '11:00',
      end_time: '15:30',
      location: 'Founder’s Student Union Atrium',
      organizer: 'Office of Career Development',
      department: 'University Advising',
      capacity: 220,
      image_url: '/src/assets/images/event_career_summit_1795149843021.jpg',
      status: 'upcoming',
      is_featured: 1,
    },
    {
      title: 'Distributed Systems & Cloud Security Workshop',
      description:
        'Hands-on technical seminar covering zero-trust container orchestration, TLS mutual authentication, and reproducible builds in Docker environments. Bring a laptop with Docker Desktop or Linux CLI ready.',
      category: 'Workshop',
      event_date: '2026-12-09',
      start_time: '14:00',
      end_time: '16:30',
      location: 'Science Center Room 310',
      organizer: 'Systems Security Group',
      department: 'Computer Science & Engineering',
      capacity: 45,
      image_url: '/src/assets/images/event_hackathon_lab_1795149842473.jpg',
      status: 'upcoming',
      is_featured: 0,
    },
    {
      title: 'Biomedical Ethics & Global Health Colloquium',
      description:
        'Interdisciplinary panel examining clinical trial transparency, diagnostic equity in rural clinics, and regulatory governance for AI-assisted radiology across international health networks.',
      category: 'Academic',
      event_date: '2026-12-12',
      start_time: '13:00',
      end_time: '15:00',
      location: 'Health Sciences Lecture Hall 1',
      organizer: 'Bioethics Faculty Fellows',
      department: 'Biomedical Engineering',
      capacity: 110,
      image_url: '/src/assets/images/event_symposium_hall_1795149841948.jpg',
      status: 'upcoming',
      is_featured: 0,
    },
    {
      title: 'Chamber Orchestra & Student Film Scoring Night',
      description:
        'Live chamber ensemble performance accompanying original short films directed by senior Media Arts candidates. Followed by an acoustic Q&A with student composers and sound designers.',
      category: 'Arts & Culture',
      event_date: '2026-12-15',
      start_time: '19:00',
      end_time: '21:30',
      location: 'Pavilion Concert Hall',
      organizer: 'Conservatory & Media Arts Guild',
      department: 'Music & Media Arts',
      capacity: 140,
      image_url: '/src/assets/images/event_arts_gallery_1795149842832.jpg',
      status: 'upcoming',
      is_featured: 0,
    },
    {
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
      image_url: '/src/assets/images/event_career_summit_1795149843021.jpg',
      status: 'completed',
      is_featured: 0,
    },
  ];

  const eventIds: number[] = [];
  for (const ev of seededEvents) {
    const res = insertEvent.run(
      ev.title,
      ev.description,
      ev.category,
      ev.event_date,
      ev.start_time,
      ev.end_time,
      ev.location,
      ev.organizer,
      ev.department,
      ev.capacity,
      ev.image_url,
      ev.status,
      ev.is_featured,
      adminId,
      now,
      now
    );
    eventIds.push(Number(res.lastInsertRowid));
  }

  const insertReg = db.prepare(`
    INSERT INTO registrations (event_id, user_id, ticket_code, status, notes, registered_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const seedRegs = [
    { eventIdx: 0, userId: student1Id, code: 'CU-2401-ML', status: 'confirmed', notes: 'Interested in the distributed systems keynote.' },
    { eventIdx: 0, userId: student2Id, code: 'CU-2402-MT', status: 'confirmed', notes: '' },
    { eventIdx: 0, userId: student3Id, code: 'CU-2403-PN', status: 'confirmed', notes: 'Vegetarian lunch preference.' },
    { eventIdx: 0, userId: student4Id, code: 'CU-2404-JM', status: 'confirmed', notes: '' },
    { eventIdx: 1, userId: student2Id, code: 'CU-2801-MT', status: 'confirmed', notes: 'Bringing custom lidar sensor module.' },
    { eventIdx: 1, userId: student3Id, code: 'CU-2802-PN', status: 'confirmed', notes: '' },
    { eventIdx: 2, userId: student1Id, code: 'CU-0201-ML', status: 'confirmed', notes: '' },
    { eventIdx: 2, userId: student4Id, code: 'CU-0202-JM', status: 'confirmed', notes: '' },
    { eventIdx: 3, userId: student2Id, code: 'CU-0501-MT', status: 'confirmed', notes: 'Portfolio review slot requested.' },
    { eventIdx: 3, userId: student3Id, code: 'CU-0502-PN', status: 'confirmed', notes: '' },
    { eventIdx: 3, userId: student4Id, code: 'CU-0503-JM', status: 'confirmed', notes: '' },
    { eventIdx: 4, userId: student3Id, code: 'CU-0901-PN', status: 'confirmed', notes: '' },
    { eventIdx: 7, userId: student1Id, code: 'CU-1001-ML', status: 'attended', notes: '' },
    { eventIdx: 7, userId: student4Id, code: 'CU-1002-JM', status: 'attended', notes: '' },
  ];

  for (const r of seedRegs) {
    insertReg.run(eventIds[r.eventIdx], r.userId, r.code, r.status, r.notes, now);
  }
}
