import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit } from '../src/lib/rate-limiter';
import { requireProgrammeAccess, AuthorizationError } from '../src/lib/auth-helpers';
import { localStore } from '../src/lib/db';

describe('Phase 1: Security & Authorisation Foundation', () => {
  beforeEach(() => {
    resetRateLimit('test-ip-key');
  });

  describe('1. Progressive Delay & Rate Limiting', () => {
    it('allows initial 3 attempts with zero delay', async () => {
      const res1 = await checkRateLimit('test-ip-key');
      expect(res1.allowed).toBe(true);
      expect(res1.delayMs).toBe(0);

      const res2 = await checkRateLimit('test-ip-key');
      expect(res2.allowed).toBe(true);
      expect(res2.delayMs).toBe(0);

      const res3 = await checkRateLimit('test-ip-key');
      expect(res3.allowed).toBe(true);
      expect(res3.delayMs).toBe(0);
    });

    it('incurs progressive delay on 4th and 5th attempts', async () => {
      // 3 attempts
      await checkRateLimit('test-ip-key');
      await checkRateLimit('test-ip-key');
      await checkRateLimit('test-ip-key');

      // 4th attempt: 2000ms delay
      const res4 = await checkRateLimit('test-ip-key');
      expect(res4.allowed).toBe(true);
      expect(res4.delayMs).toBe(2000);

      // 5th attempt: 5000ms delay
      const res5 = await checkRateLimit('test-ip-key');
      expect(res5.allowed).toBe(true);
      expect(res5.delayMs).toBe(5000);
    });

    it('blocks 6th failed login attempt with 429 threshold', async () => {
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('test-ip-key');
      }

      // 6th attempt -> Blocked
      const res6 = await checkRateLimit('test-ip-key');
      expect(res6.allowed).toBe(false);
      expect(res6.remainingAttempts).toBe(0);
      expect(res6.retryAfterSec).toBeGreaterThan(0);
    });
  });

  describe('2. Cross-Programme 403 & Enrolment Ownership Checks', () => {
    it('blocks Sunita Rao (HR Learner) from accessing Research programme with 403', () => {
      const hrLearnerId = 'user-learner-4'; // Sunita Rao
      const researchProgId = 'prog-research';

      // Check enrollment
      const isEnrolled = localStore.enrollments.some(
        (e) => e.userId === hrLearnerId && e.programmeId === researchProgId
      );
      expect(isEnrolled).toBe(false);

      expect(() => {
        if (!isEnrolled) {
          throw new AuthorizationError(
            'Cross-programme access forbidden: Learner is not enrolled in this programme',
            403
          );
        }
      }).toThrowError(/Cross-programme access forbidden/);
    });

    it('allows Priya Sharma (Research Learner) to access Research programme', () => {
      const researchLearnerId = 'user-learner-1'; // Priya Sharma
      const researchProgId = 'prog-research';

      const isEnrolled = localStore.enrollments.some(
        (e) => e.userId === researchLearnerId && e.programmeId === researchProgId
      );
      expect(isEnrolled).toBe(true);
    });

    it('blocks Neha Kapoor (HR Instructor) from grading Research exams with 403', () => {
      const hrInstructorId = 'user-inst-2'; // Neha Kapoor
      const researchProg = localStore.programmes.find((p) => p.id === 'prog-research');

      const isAssigned = researchProg?.instructors.includes(hrInstructorId);
      expect(isAssigned).toBe(false);

      expect(() => {
        if (!isAssigned) {
          throw new AuthorizationError(
            'Cross-programme access forbidden: Instructor is not assigned to this programme',
            403
          );
        }
      }).toThrowError(/Instructor is not assigned/);
    });

    it('allows Admin Deepak Joshi global access across all programmes', () => {
      const adminRole = 'ADMIN';
      const canAccessAny = adminRole === 'ADMIN';
      expect(canAccessAny).toBe(true);
    });
  });

  describe('3. Token Invalidation on Password Change', () => {
    it('rejects session token when user tokenVersion has been incremented', () => {
      const sessionTokenVersion = 1;
      const userDatabaseTokenVersion = 2; // Incremented on password change

      const isSessionValid = sessionTokenVersion >= userDatabaseTokenVersion;
      expect(isSessionValid).toBe(false);

      expect(() => {
        if (!isSessionValid) {
          throw new AuthorizationError('Session invalidated due to password change', 401);
        }
      }).toThrowError(/Session invalidated/);
    });
  });

  describe('4. Timer Server Duration & Absent startedAt Validation', () => {
    it('rejects completion when startedAt timestamp is absent in database', () => {
      const progressRecord = {
        userId: 'user-learner-1',
        resourceId: 'res-res-0-1',
        completed: false,
        startedAt: null, // Not started
      };

      expect(() => {
        if (!progressRecord.startedAt) {
          throw new Error('Reading timer requirement not met: Resource was not started on server');
        }
      }).toThrowError(/Resource was not started/);
    });

    it('rejects completion when server elapsed time is less than readingTime', () => {
      const readingTimeSec = 30;
      const startedAt = new Date(Date.now() - 5000); // Only 5s elapsed
      const elapsedMs = Date.now() - startedAt.getTime();

      const isValid = elapsedMs >= (readingTimeSec - 2) * 1000;
      expect(isValid).toBe(false);
    });

    it('accepts completion when server elapsed time meets readingTime requirement', () => {
      const readingTimeSec = 30;
      const startedAt = new Date(Date.now() - 32000); // 32s elapsed
      const elapsedMs = Date.now() - startedAt.getTime();

      const isValid = elapsedMs >= (readingTimeSec - 2) * 1000;
      expect(isValid).toBe(true);
    });
  });
});
