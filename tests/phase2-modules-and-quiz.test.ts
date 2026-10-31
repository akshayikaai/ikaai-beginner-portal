import { describe, it, expect, beforeEach } from 'vitest';
import { POST as startTimer } from '../src/app/api/progress/resource/start/route';
import { POST as completeTimer } from '../src/app/api/progress/resource/complete/route';
import { GET as getQuiz } from '../src/app/api/quiz/[id]/route';
import { GET as getQuizKey } from '../src/app/api/quiz/[id]/key/route';
import { POST as submitQuiz } from '../src/app/api/quiz/submit/route';
import { POST as resetQuiz } from '../src/app/api/quiz/reset/route';
import { POST as trackFaq } from '../src/app/api/progress/faq/route';
import { localStore } from '../src/lib/db';

describe('Phase 2: Modules, Resources, Quizzes & FAQs API Suite', () => {
  const priyaId = 'user-learner-1'; // Enrolled in Research
  const sunitaId = 'user-learner-4'; // Enrolled in HR only
  const vikramId = 'user-inst-1'; // Instructor for Research
  const nehaId = 'user-inst-2'; // Instructor for HR
  const testResourceId = 'res-res-2-1';
  const testQuizId = 'quiz-res-2';

  beforeEach(() => {
    // Reset test user progress for clean state
    localStore.resourceProgress = localStore.resourceProgress.filter(
      (rp) => !(rp.userId === priyaId && rp.resourceId === testResourceId)
    );
    localStore.quizSubmissions = localStore.quizSubmissions.filter(
      (qs) => !(qs.userId === priyaId && qs.quizId === testQuizId)
    );
  });

  describe('1. Server Timer Start & Idempotency', () => {
    it('starts reading timer and records startedAt timestamp on server', async () => {
      const req = new Request('http://localhost/api/progress/resource/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ resourceId: testResourceId }),
      });

      const res = await startTimer(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.startedAt).toBeDefined();

      const stored = localStore.resourceProgress.find(
        (rp) => rp.userId === priyaId && rp.resourceId === testResourceId
      );
      expect(stored).toBeDefined();
      expect(stored?.completed).toBe(false);
    });

    it('is idempotent: preserves original startedAt on subsequent calls', async () => {
      const firstStart = new Date(Date.now() - 10000); // 10s ago
      localStore.resourceProgress.push({
        userId: priyaId,
        resourceId: testResourceId,
        completed: false,
        startedAt: firstStart,
        secondsSpent: 0,
      });

      const req = new Request('http://localhost/api/progress/resource/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ resourceId: testResourceId }),
      });

      const res = await startTimer(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      // Ensure the timestamp returned matches the original firstStart
      expect(new Date(data.startedAt).getTime()).toBe(firstStart.getTime());
    });

    it('blocks unenrolled learner from starting resource with 403', async () => {
      const req = new Request('http://localhost/api/progress/resource/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': sunitaId, // HR learner trying to access Research resource
        },
        body: JSON.stringify({ resourceId: testResourceId }),
      });

      const res = await startTimer(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toMatch(/Cross-programme access forbidden/);
    });
  });

  describe('2. Server Elapsed Time Validation on Completion', () => {
    it('rejects completion when timer has not been started on server', async () => {
      const req = new Request('http://localhost/api/progress/resource/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ resourceId: testResourceId }),
      });

      const res = await completeTimer(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/Resource was not started on server/);
    });

    it('rejects completion when elapsed time is less than readingTime - 2s buffer', async () => {
      // Simulate resource started 10 seconds ago (required is 30s)
      localStore.resourceProgress.push({
        userId: priyaId,
        resourceId: testResourceId,
        completed: false,
        startedAt: new Date(Date.now() - 10000),
        secondsSpent: 0,
      });

      const req = new Request('http://localhost/api/progress/resource/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ resourceId: testResourceId }),
      });

      const res = await completeTimer(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/Reading timer requirement not met/);
      expect(data.remainingSeconds).toBeGreaterThan(0);
    });

    it('accepts completion when elapsed time meets reading requirement', async () => {
      // Simulate resource started 31 seconds ago
      localStore.resourceProgress.push({
        userId: priyaId,
        resourceId: testResourceId,
        completed: false,
        startedAt: new Date(Date.now() - 31000),
        secondsSpent: 0,
      });

      const req = new Request('http://localhost/api/progress/resource/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ resourceId: testResourceId }),
      });

      const res = await completeTimer(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.completed).toBe(true);

      const stored = localStore.resourceProgress.find(
        (rp) => rp.userId === priyaId && rp.resourceId === testResourceId
      );
      expect(stored?.completed).toBe(true);
      expect(stored?.secondsSpent).toBeGreaterThanOrEqual(28);
    });
  });

  describe('3. Quiz Key Endpoint Security', () => {
    it('GET /api/quiz/[id] strips correctIndex completely for learners', async () => {
      const req = new Request(`http://localhost/api/quiz/${testQuizId}`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': priyaId,
        },
      });

      const res = await getQuiz(req, { params: { id: testQuizId } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions).toBeDefined();
      expect(data.questions.length).toBeGreaterThan(0);

      // Verify NO question has correctIndex exposed
      for (const q of data.questions) {
        expect(q.correctIndex).toBeUndefined();
        expect(q.question).toBeDefined();
        expect(q.options).toBeDefined();
      }
    });

    it('GET /api/quiz/[id]/key reveals correctIndex to assigned instructor', async () => {
      const req = new Request(`http://localhost/api/quiz/${testQuizId}/key`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': vikramId, // Instructor assigned to Research
        },
      });

      const res = await getQuizKey(req, { params: { id: testQuizId } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.questions).toBeDefined();
      for (const q of data.questions) {
        expect(typeof q.correctIndex).toBe('number');
      }
    });

    it('GET /api/quiz/[id]/key rejects learners with 403 Forbidden', async () => {
      const req = new Request(`http://localhost/api/quiz/${testQuizId}/key`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': priyaId, // Learner
        },
      });

      const res = await getQuizKey(req, { params: { id: testQuizId } });
      expect(res.status).toBe(403);
    });

    it('GET /api/quiz/[id]/key rejects unassigned instructors with 403', async () => {
      const req = new Request(`http://localhost/api/quiz/${testQuizId}/key`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': nehaId, // HR Instructor trying to see Research quiz key
        },
      });

      const res = await getQuizKey(req, { params: { id: testQuizId } });
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toMatch(/Instructor not assigned/);
    });
  });

  describe('4. Server-Side Scoring & Single Attempt Rule', () => {
    it('computes score accurately on server and records submission', async () => {
      // Questions in quiz-res-2:
      // q-res-2-1: correctIndex = 1
      // q-res-2-2: correctIndex = 1
      const answers = {
        'q-res-2-1': 1, // correct
        'q-res-2-2': 1, // correct
      };

      const req = new Request('http://localhost/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ quizId: testQuizId, answers }),
      });

      const res = await submitQuiz(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.score).toBe(2);
      expect(data.total).toBe(2);
      expect(data.percentage).toBe(100);
      expect(data.passed).toBe(true);
    });

    it('rejects retake attempts with 409 Conflict under single-attempt rule', async () => {
      // Seed first attempt
      localStore.quizSubmissions.push({
        id: `qs-${priyaId}-${testQuizId}-1`,
        userId: priyaId,
        quizId: testQuizId,
        score: 2,
        total: 2,
        percentage: 100,
        attemptNo: 1,
        resetCount: 0,
        submittedAt: new Date(),
      });

      const answers = {
        'q-res-2-1': 0,
        'q-res-2-2': 0,
      };

      const req = new Request('http://localhost/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ quizId: testQuizId, answers }),
      });

      const res = await submitQuiz(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toMatch(/Single-attempt quiz already completed/);
    });
  });

  describe('5. Instructor Quiz Reset Workflow', () => {
    it('allows assigned instructor to reset quiz attempt with reason logging', async () => {
      // Seed initial attempt
      localStore.quizSubmissions.push({
        id: `qs-${priyaId}-${testQuizId}-1`,
        userId: priyaId,
        quizId: testQuizId,
        score: 1,
        total: 2,
        percentage: 50,
        attemptNo: 1,
        resetCount: 0,
        submittedAt: new Date(),
      });

      const req = new Request('http://localhost/api/quiz/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': vikramId,
        },
        body: JSON.stringify({
          userId: priyaId,
          quizId: testQuizId,
          reason: 'Network disconnect during field connectivity simulation',
        }),
      });

      const res = await resetQuiz(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resetCount).toBe(1);

      // Verify that learner can now submit attempt 2
      const retryReq = new Request('http://localhost/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({
          quizId: testQuizId,
          answers: { 'q-res-2-1': 1, 'q-res-2-2': 0 },
        }),
      });

      const retryRes = await submitQuiz(retryReq);
      const retryData = await retryRes.json();

      expect(retryRes.status).toBe(200);
      expect(retryData.attemptNo).toBe(2);
      expect(retryData.score).toBe(1);
    });
  });

  describe('6. FAQ Progress Tracking', () => {
    it('records FAQ read status', async () => {
      const faqId = 'faq-res-2-1';
      const req = new Request('http://localhost/api/progress/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ faqId }),
      });

      const res = await trackFaq(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.read).toBe(true);
      expect((localStore as any).faqProgress.has(`${priyaId}:${faqId}`)).toBe(true);
    });
  });
});
