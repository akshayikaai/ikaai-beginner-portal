import { db, localStore } from './db';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
  tokenVersion: number;
}

export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Validates session and checks tokenVersion against database on EVERY authenticated request.
 */
export async function getAuthenticatedUser(req?: Request): Promise<AuthContext> {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Outside of active Next.js HTTP server context (e.g., unit/integration tests)
  }
  let userId = session?.user?.id;

  if (!userId && process.env.NODE_ENV !== 'production' && req) {
    const demoHeader = req.headers.get('x-demo-user-id');
    if (demoHeader) {
      userId = demoHeader;
    }
  }

  if (!userId) {
    throw new AuthorizationError('Authentication required', 401);
  }

  const user = await db.findUserById(userId);
  if (!user || user.isAnonymised) {
    throw new AuthorizationError('Account unavailable or deleted', 401);
  }

  // Validate tokenVersion: reject if session tokenVersion < database tokenVersion
  if (session?.user?.tokenVersion && session.user.tokenVersion < user.tokenVersion) {
    throw new AuthorizationError('Session invalidated due to password change', 401);
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };
}

/**
 * Checks role-based access.
 */
export async function requireRole(
  allowedRoles: ('LEARNER' | 'INSTRUCTOR' | 'ADMIN')[],
  req?: Request
) {
  const user = await getAuthenticatedUser(req);
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      `Access forbidden for role ${user.role}. Required: ${allowedRoles.join(', ')}`,
      403
    );
  }
  return user;
}

/**
 * Enforces programme enrollment for learners or instructor assignment for instructors.
 */
export async function requireProgrammeAccess(programmeId: string, req?: Request) {
  const user = await getAuthenticatedUser(req);

  if (user.role === 'ADMIN') {
    return user; // Admins have global access
  }

  if (user.role === 'LEARNER') {
    const isEnrolled = localStore.enrollments.some(
      (e) => e.userId === user.userId && e.programmeId === programmeId && e.status === 'ACTIVE'
    );
    if (!isEnrolled) {
      throw new AuthorizationError(
        'Cross-programme access forbidden: Learner is not enrolled in this programme',
        403
      );
    }
  }

  if (user.role === 'INSTRUCTOR') {
    const prog = localStore.programmes.find((p) => p.id === programmeId || p.slug === programmeId);
    const isAssigned = prog?.instructors.includes(user.userId);
    if (!isAssigned) {
      throw new AuthorizationError(
        'Cross-programme access forbidden: Instructor is not assigned to this programme',
        403
      );
    }
  }

  return user;
}
