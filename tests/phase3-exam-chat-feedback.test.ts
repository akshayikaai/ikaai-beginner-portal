import { describe, it, expect, beforeEach } from 'vitest';
import { POST as submitExam } from '../src/app/api/exam/submit/route';
import { POST as gradeExam } from '../src/app/api/exam/grade/route';
import { GET as getSubmissions } from '../src/app/api/exam/submissions/[programmeId]/route';
import { POST as submitFeedback, GET as getFeedback } from '../src/app/api/feedback/route';
import { GET as getMyFeedback } from '../src/app/api/feedback/mine/route';
import { GET as getAnnouncements, POST as createAnnouncement } from '../src/app/api/announcements/route';
import { GET as getChatMessages } from '../src/app/api/chat/messages/route';
import { POST as sendChatMessage } from '../src/app/api/chat/send/route';
import { localStore } from '../src/lib/db';

describe('Phase 3: Written Exam, Feedback Privacy, Announcements & Chat API Suite', () => {
  const priyaId = 'user-learner-1'; // Enrolled in Research
  const sunitaId = 'user-learner-4'; // Enrolled in HR only
  const vikramId = 'user-inst-1'; // Instructor for Research
  const nehaId = 'user-inst-2'; // Instructor for HR
  const testExamId = 'exam-research';
  const testProgId = 'prog-research';

  beforeEach(() => {
    // Clean up test submissions for isolated tests
    localStore.examSubmissions = localStore.examSubmissions.filter(
      (es) => !(es.userId === priyaId && es.examId === testExamId)
    );
    localStore.feedback = localStore.feedback.filter((fb) => fb.userId !== 'test-feedback-user');
  });

  describe('1. Written Exam Submission & Single Attempt Rule', () => {
    it('allows enrolled learner to submit written exam answers', async () => {
      const answers = {
        'q-res-1': 'A comprehensive theory of change mapping inputs to sustained outcomes.',
        'q-res-2': 'Dual-entry independent verification and randomized spot checks.',
      };

      const req = new Request('http://localhost/api/exam/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({ examId: testExamId, answers }),
      });

      const res = await submitExam(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('SUBMITTED');

      const saved = localStore.examSubmissions.find(
        (es) => es.userId === priyaId && es.examId === testExamId
      );
      expect(saved).toBeDefined();
      expect(saved?.status).toBe('SUBMITTED');
    });

    it('rejects duplicate exam submission with 409 Conflict', async () => {
      // Seed initial submission
      localStore.examSubmissions.push({
        id: `sub-${priyaId}-${testExamId}`,
        examId: testExamId,
        userId: priyaId,
        status: 'SUBMITTED',
        answersJson: { 'q-res-1': 'Original response' },
        submittedAt: new Date(),
      });

      const req = new Request('http://localhost/api/exam/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({
          examId: testExamId,
          answers: { 'q-res-1': 'Second attempt attempt' },
        }),
      });

      const res = await submitExam(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toMatch(/Written exam has already been submitted/);
    });

    it('blocks unenrolled learner from submitting exam with 403', async () => {
      const req = new Request('http://localhost/api/exam/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': sunitaId, // HR learner trying to submit Research exam
        },
        body: JSON.stringify({
          examId: testExamId,
          answers: { 'q-res-1': 'Unauthorized answer' },
        }),
      });

      const res = await submitExam(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toMatch(/Cross-programme access forbidden/);
    });
  });

  describe('2. Instructor Exam Grading & Authorization', () => {
    const submissionId = `sub-test-grading-${Date.now()}`;

    beforeEach(() => {
      localStore.examSubmissions.push({
        id: submissionId,
        examId: testExamId,
        userId: priyaId,
        status: 'SUBMITTED',
        answersJson: { 'q-res-1': 'Field analysis methodology' },
        submittedAt: new Date(),
      });
    });

    it('allows assigned instructor to grade submission and award marks', async () => {
      const req = new Request('http://localhost/api/exam/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': vikramId, // Instructor for Research
        },
        body: JSON.stringify({
          submissionId,
          marks: 25, // Total max is 30 (3 questions x 10 marks)
          feedback: 'Excellent methodological rigor and clear conceptual framework.',
        }),
      });

      const res = await gradeExam(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.marks).toBe(25);
      expect(data.passed).toBe(true);

      const graded = localStore.examSubmissions.find((es) => es.id === submissionId);
      expect(graded?.status).toBe('GRADED');
      expect(graded?.marks).toBe(25);
    });

    it('rejects marks exceeding total maximum marks with 400', async () => {
      const req = new Request('http://localhost/api/exam/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': vikramId,
        },
        body: JSON.stringify({
          submissionId,
          marks: 50, // Max is 30
          feedback: 'Out of bounds test',
        }),
      });

      const res = await gradeExam(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/Marks must be between 0 and maximum possible marks/);
    });

    it('blocks unassigned instructor from grading with 403', async () => {
      const req = new Request('http://localhost/api/exam/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': nehaId, // HR Instructor trying to grade Research submission
        },
        body: JSON.stringify({
          submissionId,
          marks: 75,
          feedback: 'Unauthorized grading',
        }),
      });

      const res = await gradeExam(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toMatch(/Instructor not assigned to this programme/);
    });

    it('rejects learners from calling grading endpoint with 403', async () => {
      const req = new Request('http://localhost/api/exam/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId, // Learner trying to grade
        },
        body: JSON.stringify({
          submissionId,
          marks: 100,
        }),
      });

      const res = await gradeExam(req);
      expect(res.status).toBe(403);
    });
  });

  describe('3. Anonymous Feedback & DPDP Privacy Rules', () => {
    it('allows learner to submit feedback with rating and comment', async () => {
      const req = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({
          programmeId: testProgId,
          rating: 5,
          comment: 'Very helpful survey sampling field guide.',
          isAnonymous: true,
        }),
      });

      const res = await submitFeedback(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isAnonymous).toBe(true);
    });

    it('enforces rating between 1 and 5 and rejects out-of-range values', async () => {
      const req = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({
          programmeId: testProgId,
          rating: 10, // Invalid
          comment: 'Invalid rating test',
        }),
      });

      const res = await submitFeedback(req);
      expect(res.status).toBe(400);
    });

    it('DPDP PRIVACY: GET /api/feedback strips author info when isAnonymous is true', async () => {
      // Seed anonymous feedback
      localStore.feedback.push({
        id: 'fb-anon-test',
        userId: priyaId,
        programmeId: testProgId,
        rating: 4,
        comment: 'Anonymous feedback privacy test comment.',
        isAnonymous: true,
        createdAt: new Date('2026-10-25T14:32:10.000Z'),
      });

      const req = new Request('http://localhost/api/feedback', {
        method: 'GET',
        headers: {
          'x-demo-user-id': vikramId, // Instructor viewing feedback
        },
      });

      const res = await getFeedback(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      const anonItem = data.feedback.find((f: any) => f.id === 'fb-anon-test');
      expect(anonItem).toBeDefined();

      // STRICT DPDP CHECK 1: Author fields must be omitted / null
      expect(anonItem.authorName).toBeNull();
      expect(anonItem.authorEmail).toBeNull();
      expect(anonItem.userId).toBeUndefined();

      // STRICT DPDP CHECK 2: Timestamp must be truncated to YYYY-MM-DD (no hours or minutes)
      expect(anonItem.date).toBe('2026-10-25');
      expect(anonItem.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('GET /api/feedback/mine returns learner their own submissions history', async () => {
      const req = new Request('http://localhost/api/feedback/mine', {
        method: 'GET',
        headers: {
          'x-demo-user-id': priyaId,
        },
      });

      const res = await getMyFeedback(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.feedback)).toBe(true);
    });
  });

  describe('4. Announcements Feed & Instructor Authoring', () => {
    it('allows authenticated users to retrieve announcements feed', async () => {
      const req = new Request('http://localhost/api/announcements', {
        method: 'GET',
        headers: {
          'x-demo-user-id': priyaId,
        },
      });

      const res = await getAnnouncements(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.announcements.length).toBeGreaterThan(0);
    });

    it('allows instructors to author announcements', async () => {
      const req = new Request('http://localhost/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': vikramId,
        },
        body: JSON.stringify({
          title: 'Upcoming CAPI Calibration Workshop',
          content: 'Hands-on session scheduled for Thursday 10:00 AM.',
          programmeId: testProgId,
          priority: 'IMPORTANT',
        }),
      });

      const res = await createAnnouncement(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.announcement.title).toBe('Upcoming CAPI Calibration Workshop');
    });

    it('rejects learners from publishing announcements with 403', async () => {
      const req = new Request('http://localhost/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId, // Learner
        },
        body: JSON.stringify({
          title: 'Unauthorized announcement',
          content: 'Should be blocked',
        }),
      });

      const res = await createAnnouncement(req);
      expect(res.status).toBe(403);
    });
  });

  describe('5. Cohort & Direct Chat Security', () => {
    it('allows enrolled learner to access cohort chat messages', async () => {
      const req = new Request('http://localhost/api/chat/messages?channelId=cohort:prog-research', {
        method: 'GET',
        headers: {
          'x-demo-user-id': priyaId,
        },
      });

      const res = await getChatMessages(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages.length).toBeGreaterThan(0);
    });

    it('blocks unenrolled learner from cohort chat with 403', async () => {
      const req = new Request('http://localhost/api/chat/messages?channelId=cohort:prog-research', {
        method: 'GET',
        headers: {
          'x-demo-user-id': sunitaId, // HR learner trying to read Research cohort chat
        },
      });

      const res = await getChatMessages(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toMatch(/Cross-programme access forbidden/);
    });

    it('allows enrolled learner to send message in cohort channel', async () => {
      const req = new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': priyaId,
        },
        body: JSON.stringify({
          channelId: 'cohort:prog-research',
          content: 'Hello cohort! Looking forward to collaborating on the baseline survey.',
        }),
      });

      const res = await sendChatMessage(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message.content).toBe('Hello cohort! Looking forward to collaborating on the baseline survey.');
    });

    it('redacts sender name as "Former Member" for anonymised users', async () => {
      // Simulate an anonymised user's past message
      const anonUserId = 'user-anonymised-test';
      localStore.users.push({
        id: anonUserId,
        email: 'anon@anonymised.invalid',
        name: 'Redacted User',
        role: 'LEARNER',
        passwordHash: '',
        tokenVersion: 1,
        isAnonymised: true,
      });

      localStore.chatMessages.push({
        id: 'msg-anon-test',
        channelId: 'cohort:prog-research',
        senderId: anonUserId,
        senderName: 'Redacted User',
        senderRole: 'LEARNER',
        content: 'Historical message from an alumnus who has exited and consented to anonymisation.',
        createdAt: new Date(),
      });

      const req = new Request('http://localhost/api/chat/messages?channelId=cohort:prog-research', {
        method: 'GET',
        headers: {
          'x-demo-user-id': priyaId,
        },
      });

      const res = await getChatMessages(req);
      const data = await res.json();

      const testMsg = data.messages.find((m: any) => m.id === 'msg-anon-test');
      expect(testMsg).toBeDefined();
      expect(testMsg.senderName).toBe('Former Member');
    });
  });
});
