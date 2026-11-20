import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getDb } from './db.ts';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  student_id: string;
  department: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'meridian-campus-events-dev-secret-2026';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function resolveUserFromHeader(req: Request): AuthUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: number | string };
    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      return null;
    }

    const db = getDb();
    const row = db
      .prepare('SELECT id, name, email, role, student_id, department FROM users WHERE id = ?')
      .get(userId) as AuthUser | undefined;

    return row || null;
  } catch {
    return null;
  }
}

export function authenticateOptional(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const user = resolveUserFromHeader(req);
  if (user) {
    req.user = user;
  }
  next();
}

export function authenticateRequired(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = resolveUserFromHeader(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges are required for this action.' });
    return;
  }
  next();
}
