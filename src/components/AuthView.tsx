import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User as UserIcon, Building2, IdCard, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import type { User, UserRole } from '../types';

interface AuthViewProps {
  onAuthenticated: (token: string, user: User) => void;
  onBrowseGuest?: () => void;
}

export function AuthView({ onAuthenticated, onBrowseGuest }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [adminCode, setAdminCode] = useState('');
  const [demoMode, setDemoMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getConfig()
      .then((cfg) => {
        if (active) setDemoMode(cfg.demoMode);
      })
      .catch(() => {
        // Default to demoMode true if config request fails
      });
    return () => {
      active = false;
    };
  }, []);

  const validateForm = (): string | null => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return 'Please enter a valid university email address.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (mode === 'register') {
      if (name.trim().length < 2) {
        return 'Please enter your full name (at least 2 characters).';
      }
      if (password !== confirmPassword) {
        return 'Passwords do not match.';
      }
      if (department.trim().length < 2) {
        return 'Please specify your academic department or office.';
      }
      if (role === 'admin' && !adminCode.trim()) {
        return 'Please enter the Administrator Invite Code.';
      }
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login(email.trim(), password);
        onAuthenticated(res.token, res.user);
      } else {
        const res = await api.registerAccount({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          student_id: studentId.trim(),
          department: department.trim(),
          admin_code: role === 'admin' ? adminCode.trim() : undefined,
        });
        onAuthenticated(res.token, res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, demoPassword: string) => {
    setError(null);
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      const res = await api.login(demoEmail, demoPassword);
      onAuthenticated(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Institutional Showcase Panel */}
      <div className="lg:w-7/12 relative bg-slate-900 text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        <img
          src="/src/assets/images/event_symposium_hall_1795149841948.jpg"
          alt="University Lecture Hall during an academic symposium"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/75 to-slate-900/50"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <span className="font-display text-lg font-semibold tracking-tight text-white whitespace-nowrap">
            Meridian University
          </span>
          {onBrowseGuest && (
            <button
              type="button"
              onClick={onBrowseGuest}
              className="text-sm font-medium text-slate-200 hover:text-white underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Browse Public Calendar
            </button>
          )}
        </div>

        <div className="relative z-10 max-w-xl my-12 lg:my-0">
          <p className="text-xs font-medium tracking-wide text-blue-300 mb-3">
            Campus Event Management System
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight [text-wrap:balance]">
            Academic symposia, studio showcases, and student life in one place.
          </h1>
          <p className="mt-5 text-base text-slate-300 leading-relaxed max-w-lg">
            Discover upcoming departmental lectures, hackathons, and career summits. Reserve seats
            with instant registration passes or manage event rosters and attendance across campus.
          </p>

          <div className="mt-10 pt-8 border-t border-white/15 grid grid-cols-3 gap-6">
            <div>
              <div className="font-mono text-2xl font-semibold text-white tabular-nums">8+</div>
              <div className="text-xs text-slate-300 mt-1">Active Campus Events</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-white tabular-nums">6</div>
              <div className="text-xs text-slate-300 mt-1">Academic Categories</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-white tabular-nums">100%</div>
              <div className="text-xs text-slate-300 mt-1">Live Seat Tracking</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          Office of Student Affairs &amp; Academic Scheduling
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:w-5/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-white border-l border-slate-200">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Sign in to Campus Portal' : 'Create University Account'}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              {mode === 'login'
                ? 'Access event registrations, passes, and role-based tools.'
                : 'Register as a student or campus administrator.'}
            </p>
          </div>

          {/* Segmented Mode Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="auth-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="auth-role" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Account Role
                    </label>
                    <select
                      id="auth-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="auth-student-id" className="block text-sm font-medium text-slate-700 mb-1.5">
                      {role === 'admin' ? 'Staff ID (Optional)' : 'Student ID (Optional)'}
                    </label>
                    <div className="relative">
                      <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-student-id"
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder={role === 'admin' ? 'ADM-2041' : 'STU-2026-0192'}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-dept" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Department / Office
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-dept"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Science & Engineering"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                {role === 'admin' && (
                  <div>
                    <label htmlFor="auth-admin-code" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Administrator Invite Code
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-admin-code"
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="Enter university staff invite code"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                University Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              <span>{loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Access */}
          {demoMode && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-3">
                Quick Demo Access (Seeded Accounts)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoSignIn('student@university.edu', 'Student123!')}
                  className="text-left px-3.5 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-semibold text-slate-900">Student Demo</div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">student@university.edu</div>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoSignIn('admin@university.edu', 'Admin123!')}
                  className="text-left px-3.5 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-semibold text-slate-900">Admin Demo</div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">admin@university.edu</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
