export type UserRole = 'student' | 'admin';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type RegistrationStatus = 'confirmed' | 'attended' | 'cancelled';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  student_id: string;
  department: string;
}

export interface UserRegistration {
  id: number;
  ticket_code: string;
  status: RegistrationStatus;
  notes: string;
  registered_at: string;
}

export interface CampusEvent {
  id: number;
  title: string;
  description: string;
  category: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer: string;
  department: string;
  capacity: number;
  image_url: string;
  status: EventStatus;
  is_featured: boolean;
  registered_count: number;
  user_registration: UserRegistration | null;
  created_at: string;
  updated_at: string;
}

export interface MyRegistrationItem {
  registration_id: number;
  ticket_code: string;
  registration_status: RegistrationStatus;
  notes: string;
  registered_at: string;
  event_id: number;
  title: string;
  description: string;
  category: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer: string;
  department: string;
  capacity: number;
  image_url: string;
  event_status: EventStatus;
  registered_count: number;
}

export interface RosterRegistration {
  id: number;
  event_id: number;
  user_id: number;
  ticket_code: string;
  status: RegistrationStatus;
  notes: string;
  registered_at: string;
  student_name: string;
  student_email: string;
  student_id: string;
  department: string;
  role: UserRole;
}

export interface CategoryStat {
  category: string;
  event_count: number;
  total_capacity: number;
  registration_count: number;
}

export interface RecentRegistrationStat {
  id: number;
  ticket_code: string;
  status: RegistrationStatus;
  registered_at: string;
  student_name: string;
  student_id: string;
  department: string;
  event_id: number;
  event_title: string;
  event_date: string;
}

export interface DashboardStats {
  summary: {
    total_events: number;
    upcoming_events: number;
    completed_events: number;
    total_registrations: number;
    total_students: number;
    total_capacity: number;
    utilization_pct: number;
  };
  categoryBreakdown: CategoryStat[];
  recentRegistrations: RecentRegistrationStat[];
  myStats: {
    active_registrations: number;
    attended_events: number;
    cancelled_registrations: number;
  };
}

export interface EventFormData {
  title: string;
  description: string;
  category: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer: string;
  department: string;
  capacity: number;
  image_url: string;
  status: EventStatus;
  is_featured: boolean;
}

export const EVENT_CATEGORIES = [
  'Academic',
  'Technology',
  'Arts & Culture',
  'Career',
  'Workshop',
  'Athletics',
] as const;

export const EVENT_IMAGE_PRESETS = [
  {
    label: 'Auditorium & Symposium',
    url: '/src/assets/images/event_symposium_hall_1795149841948.jpg',
  },
  {
    label: 'Engineering & Robotics Lab',
    url: '/src/assets/images/event_hackathon_lab_1795149842473.jpg',
  },
  {
    label: 'Campus Arts Pavilion',
    url: '/src/assets/images/event_arts_gallery_1795149842832.jpg',
  },
  {
    label: 'Student Union Atrium',
    url: '/src/assets/images/event_career_summit_1795149843021.jpg',
  },
] as const;
