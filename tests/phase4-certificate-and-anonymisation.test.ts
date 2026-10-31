import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getCertificate, POST as issueCertificate } from '@/app/api/certificate/[progId]/route';
import { GET as verifyCertificate } from '@/app/api/verify/[verificationId]/route';
import { POST as anonymiseUser } from '@/app/api/admin/users/anonymise/route';
import { GET as exportReports } from '@/app/api/admin/reports/export/route';
import { localStore } from '@/lib/db';

describe('Phase 4: Certificate Issuance, Public Verification & DPDP Exit Protocol', () => {
  const priyaId = 'user-learner-1'; // Enrolled in Research
  const sunitaId = 'user-learner-4'; // Enrolled in HR
  const rahulId = 'user-learner-2'; // Enrolled in Analyst
  const ananyaId = 'user-learner-3'; // Enrolled in Field (100% complete)
  const adminId = 'user-admin-1';
  const instructorId = 'user-inst-1';

  beforeEach(() => {
    // Reset any state alterations if needed
  });

  describe('1. Certificate Issuance Qualification Gates', () => {
    it('blocks certificate issuance when programme completion is under 100%', async () => {
      // Priya Sharma has 44% progress in prog-research
      const req = new Request('http://localhost:3000/api/certificate/prog-research', {
        method: 'POST',
        headers: { 'x-demo-user-id': priyaId },
      });
      const res = await issueCertificate(req, { params: { progId: 'prog-research' } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.message).toContain('satisfied');
    });

    it('returns eligibility roadmap showing missing completion items', async () => {
      const req = new Request('http://localhost:3000/api/certificate/prog-research', {
        headers: { 'x-demo-user-id': priyaId },
      });
      const res = await getCertificate(req, { params: { progId: 'prog-research' } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.eligibility).toBeDefined();
      expect(json.eligibility.eligible).toBe(false);
      expect(json.eligibility.progress.resourcesComplete).toBe(false);
    });

    it('blocks non-enrolled learner from accessing certificate endpoint', async () => {
      // Sunita Rao is enrolled in prog-hr only
      const req = new Request('http://localhost:3000/api/certificate/prog-research', {
        headers: { 'x-demo-user-id': sunitaId },
      });
      const res = await getCertificate(req, { params: { progId: 'prog-research' } });
      expect(res.status).toBe(403);
    });
  });

  describe('2. Certificate Issuance Execution & Snapshot', () => {
    it('issues valid certificate with historical recipient snapshot when learner fulfills all criteria', async () => {
      // Create a test learner with 100% completion
      const testUserId = `user-test-cert-${Date.now()}`;
      localStore.users.push({
        id: testUserId,
        email: 'test.grad@ikaaiindia.in',
        name: 'Aarav Patel',
        role: 'LEARNER',
        department: 'Research',
        passwordHash: '',
        tokenVersion: 1,
      });

      localStore.enrollments.push({
        userId: testUserId,
        programmeId: 'prog-research',
        status: 'ACTIVE',
        progressLevel: 100,
        completedResources: [],
        quizScores: [],
        examStatus: 'GRADED',
      });

      // Complete all resources for prog-research
      const researchProg = localStore.programmes.find((p) => p.id === 'prog-research')!;
      for (const m of researchProg.modules) {
        for (const r of m.resources) {
          localStore.resourceProgress.push({
            userId: testUserId,
            resourceId: r.id,
            completed: true,
            secondsSpent: 45,
          });
        }
        if (m.quiz) {
          localStore.quizSubmissions.push({
            id: `qs-${testUserId}-${m.quiz.id}`,
            userId: testUserId,
            quizId: m.quiz.id,
            score: 2,
            total: 2,
            percentage: 100,
            attemptNo: 1,
            resetCount: 0,
            submittedAt: new Date(),
          });
        }
      }

      // Add passing graded exam submission (28/30)
      localStore.examSubmissions.push({
        id: `sub-exam-${testUserId}`,
        examId: 'exam-research',
        userId: testUserId,
        status: 'GRADED',
        answersJson: {},
        marks: 28,
        feedback: 'Superb analysis',
        submittedAt: new Date(),
        gradedAt: new Date(),
      });

      const req = new Request('http://localhost:3000/api/certificate/prog-research', {
        method: 'POST',
        headers: { 'x-demo-user-id': testUserId },
      });
      const res = await issueCertificate(req, { params: { progId: 'prog-research' } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.certificate).toBeDefined();
      expect(json.certificate.recipientName).toBe('Aarav Patel');
      expect(json.certificate.certificateNo).toMatch(/^IKAAI-ACAD-2026-\d{4}$/);
      expect(json.certificate.verificationId).toBeDefined();
    });
  });

  describe('3. Public Certificate Verification & Email Redaction', () => {
    it('verifies valid certificate publicly without exposing user email address', async () => {
      // Verified certificate seeded for Ananya Sen (v-ikaai-cert-8492)
      const req = new Request('http://localhost:3000/api/verify/v-ikaai-cert-8492');
      const res = await verifyCertificate(req, {
        params: { verificationId: 'v-ikaai-cert-8492' },
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.valid).toBe(true);
      expect(json.credential).toBeDefined();
      expect(json.credential.recipientName).toBe('Ananya Sen');
      expect(json.credential.certificateNo).toBe('IKAAI-ACAD-2026-0042');
      expect(json.credential.programmeTitle).toBe('Field Operations');
      expect(json.credential.issuer).toBe('Ikaai India Research Pvt. Ltd.');

      // Strict privacy check: email MUST NOT be present
      expect(json.credential.email).toBeUndefined();
      expect(JSON.stringify(json)).not.toContain('field.learner@ikaaiindia.in');
    });

    it('returns 404 for unverified or forged token', async () => {
      const req = new Request('http://localhost:3000/api/verify/fake-token-999');
      const res = await verifyCertificate(req, {
        params: { verificationId: 'fake-token-999' },
      });
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.valid).toBe(false);
      expect(json.message).toContain('could not be verified');
    });
  });

  describe('4. DPDP Act 2023 Exit Anonymisation Protocol', () => {
    it('rejects non-admin attempt to trigger user anonymisation', async () => {
      const req = new Request('http://localhost:3000/api/admin/users/anonymise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': instructorId, // Instructor is not Admin
        },
        body: JSON.stringify({ userId: rahulId }),
      });

      const res = await anonymiseUser(req);
      expect(res.status).toBe(403);
    });

    it('admin anonymises learner: redacts name, transforms email to @anonymised.invalid, clears password & IP', async () => {
      // Test on a fresh test user to preserve standard demo users
      const targetUserId = `user-exit-test-${Date.now()}`;
      localStore.users.push({
        id: targetUserId,
        email: 'rahul.test@ikaaiindia.in',
        name: 'Rahul Test',
        role: 'LEARNER',
        department: 'Data Analyst',
        passwordHash: 'hashed_password_123',
        tokenVersion: 1,
      });

      localStore.consentLogs.push({
        id: `c-test-${Date.now()}`,
        userId: targetUserId,
        purpose: 'TEST_PURPOSE',
        policyVer: 'v1.0',
        consentedAt: new Date(),
        ipAddress: '192.168.1.50',
      });

      const req = new Request('http://localhost:3000/api/admin/users/anonymise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': adminId,
        },
        body: JSON.stringify({ userId: targetUserId }),
      });

      const res = await anonymiseUser(req);
      expect(res.status).toBe(200);

      // Verify in database
      const user = localStore.users.find((u) => u.id === targetUserId)!;
      expect(user.isAnonymised).toBe(true);
      expect(user.name).toBe('Former Learner');
      expect(user.email).toBe(`anonymised-${targetUserId}@anonymised.invalid`);
      expect(user.passwordHash).toBe('');
      expect(user.tokenVersion).toBeGreaterThan(1);

      // Verify consent log IP redacted
      const consent = localStore.consentLogs.find((c) => c.userId === targetUserId)!;
      expect(consent.ipAddress).toBeNull();
    });

    it('preserves Certificate.recipientName snapshot on /verify even after user anonymisation', async () => {
      // Anonymise Ananya Sen (ananyaId)
      const req = new Request('http://localhost:3000/api/admin/users/anonymise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': adminId,
        },
        body: JSON.stringify({ userId: ananyaId }),
      });
      await anonymiseUser(req);

      // Check public verify endpoint
      const verifyReq = new Request('http://localhost:3000/api/verify/v-ikaai-cert-8492');
      const verifyRes = await verifyCertificate(verifyReq, {
        params: { verificationId: 'v-ikaai-cert-8492' },
      });
      expect(verifyRes.status).toBe(200);

      const json = await verifyRes.json();
      expect(json.valid).toBe(true);
      // Historical recipientName snapshot persists!
      expect(json.credential.recipientName).toBe('Ananya Sen');
      expect(json.credential.certificateNo).toBe('IKAAI-ACAD-2026-0042');
    });
  });

  describe('5. Admin Cohort CSV Export', () => {
    it('blocks non-admin from exporting cohort CSV', async () => {
      const req = new Request('http://localhost:3000/api/admin/reports/export', {
        headers: { 'x-demo-user-id': priyaId },
      });
      const res = await exportReports(req);
      expect(res.status).toBe(403);
    });

    it('admin exports cohort CSV containing learner progress, exam status and certificate serials', async () => {
      const req = new Request('http://localhost:3000/api/admin/reports/export', {
        headers: { 'x-demo-user-id': adminId },
      });
      const res = await exportReports(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/csv');
      expect(res.headers.get('Content-Disposition')).toContain('ikaai-academy-cohort-report.csv');

      const csvText = await res.text();
      expect(csvText).toContain('Learner ID,Name,Email,Department,Programme,Completion %,Quizzes Passed,Exam Status,Exam Marks,Certificate Status');
      expect(csvText).toContain('Priya Sharma');
      expect(csvText).toContain('IKAAI-ACAD-2026-0042');
    });
  });
});
