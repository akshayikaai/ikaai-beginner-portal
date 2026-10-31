import { prisma } from './prisma';
import {
  SEED_USERS,
  SEED_PROGRAMMES,
  SEED_ENROLLMENTS,
  SeedUser,
  SeedProgramme,
} from './seed-data';

// In-memory / dynamic store initialized with seed data for instant offline reliability
class Store {
  users: SeedUser[] = [...SEED_USERS];
  programmes: SeedProgramme[] = JSON.parse(JSON.stringify(SEED_PROGRAMMES));
  enrollments = [...SEED_ENROLLMENTS];
  resourceProgress: {
    userId: string;
    resourceId: string;
    completed: boolean;
    startedAt?: Date | null;
    completedAt?: Date | null;
    secondsSpent: number;
  }[] = [];
  quizSubmissions: {
    id: string;
    userId: string;
    quizId: string;
    score: number;
    total: number;
    percentage: number;
    attemptNo: number;
    resetCount: number;
    resetById?: string;
    resetReason?: string;
    submittedAt: Date;
  }[] = [];
  examSubmissions: {
    id: string;
    examId: string;
    userId: string;
    status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';
    answersJson: any;
    marks?: number | null;
    feedback?: string | null;
    submittedAt: Date;
    gradedAt?: Date | null;
  }[] = [];
  consentLogs: {
    id: string;
    userId: string;
    purpose: string;
    policyVer: string;
    consentedAt: Date;
    ipAddress?: string | null;
  }[] = [];
  rateLimitRecords = new Map<string, { count: number; expiresAt: number; firstAttemptAt: number }>();
  passwordResetTokens: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    used: boolean;
  }[] = [];
  announcements: {
    id: string;
    programmeId?: string | null;
    title: string;
    content: string;
    priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
    authorId: string;
    authorName: string;
    authorRole: string;
    createdAt: Date;
  }[] = [];
  chatMessages: {
    id: string;
    channelId: string;
    programmeId?: string | null;
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    createdAt: Date;
  }[] = [];
  feedback: {
    id: string;
    userId: string;
    programmeId: string;
    moduleId?: string | null;
    rating: number;
    comment: string;
    isAnonymous: boolean;
    createdAt: Date;
  }[] = [];
  certificates: {
    id: string;
    certificateNo: string;
    recipientName: string;
    userId: string;
    programmeId: string;
    issuedAt: Date;
    finalGrade: string;
    verificationId: string;
  }[] = [];

  constructor() {
    // Populate initial progress
    for (const enr of SEED_ENROLLMENTS) {
      for (const resId of enr.completedResources) {
        this.resourceProgress.push({
          userId: enr.userId,
          resourceId: resId,
          completed: true,
          startedAt: new Date(Date.now() - 60000),
          completedAt: new Date(),
          secondsSpent: 35,
        });
      }
      for (const qs of enr.quizScores) {
        this.quizSubmissions.push({
          id: `qs-${enr.userId}-${qs.quizId}`,
          userId: enr.userId,
          quizId: qs.quizId,
          score: qs.score,
          total: qs.total,
          percentage: qs.percentage,
          attemptNo: 1,
          resetCount: 0,
          submittedAt: new Date(),
        });
      }
      if (enr.examStatus === 'SUBMITTED' && enr.examAnswers) {
        this.examSubmissions.push({
          id: `sub-${enr.userId}-field`,
          examId: 'exam-field',
          userId: enr.userId,
          status: 'GRADED',
          answersJson: enr.examAnswers,
          marks: 19,
          feedback: 'Exceptional rural community engagement strategy and back-check protocols.',
          submittedAt: new Date(Date.now() - 86400000 * 3),
          gradedAt: new Date(Date.now() - 86400000 * 2),
        });

        this.certificates.push({
          id: 'cert-ananya-1',
          certificateNo: 'IKAAI-ACAD-2026-0042',
          recipientName: 'Ananya Sen',
          userId: enr.userId,
          programmeId: enr.programmeId,
          issuedAt: new Date(Date.now() - 86400000 * 2),
          finalGrade: 'Grade A (95%)',
          verificationId: 'v-ikaai-cert-8492',
        });
      }
    }

    // Seed Announcements
    this.announcements.push(
      {
        id: 'ann-1',
        programmeId: 'prog-research',
        title: 'November 2026 Field Visit Schedule Published',
        content:
          'Field deployment schedules for the upcoming baseline evaluation study in Bihar and Uttar Pradesh are now available. Please ensure Module 3 is completed prior to deployment.',
        priority: 'IMPORTANT',
        authorId: 'user-inst-1',
        authorName: 'Dr. Vikram Mehta',
        authorRole: 'Instructor',
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: 'ann-2',
        programmeId: null, // Global
        title: 'Survey Quality & CAPI Device Guidelines Update',
        content:
          'New CAPI device data sync guidelines and battery maintenance protocols have been uploaded to the institutional handbook. All field teams must review before Friday.',
        priority: 'NORMAL',
        authorId: 'user-admin-1',
        authorName: 'Deepak Joshi',
        authorRole: 'Director',
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        id: 'ann-3',
        programmeId: 'prog-hr',
        title: 'Midterm Written Evaluation Notice',
        content:
          'The HR cohort written evaluation window will open this Thursday. Submissions are reviewed individually by the departmental coordinator.',
        priority: 'IMPORTANT',
        authorId: 'user-inst-2',
        authorName: 'Neha Kapoor',
        authorRole: 'Instructor',
        createdAt: new Date(Date.now() - 86400000 * 1),
      }
    );

    // Seed Chat Messages
    this.chatMessages.push(
      {
        id: 'msg-1',
        channelId: 'cohort:prog-research',
        programmeId: 'prog-research',
        senderId: 'user-inst-1',
        senderName: 'Dr. Vikram Mehta',
        senderRole: 'INSTRUCTOR',
        content:
          'Welcome to the Research Programme cohort! Please begin with Module 0 and complete your digital workspace setup.',
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        id: 'msg-2',
        channelId: 'cohort:prog-research',
        programmeId: 'prog-research',
        senderId: 'user-learner-1',
        senderName: 'Priya Sharma',
        senderRole: 'LEARNER',
        content: 'Thank you Dr. Vikram! The ethics and informed consent modules were very clear.',
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: 'msg-3',
        channelId: 'cohort:prog-research',
        programmeId: 'prog-research',
        senderId: 'user-learner-2',
        senderName: 'Rahul Verma',
        senderRole: 'LEARNER',
        content: 'Excited to review the field sampling methodologies in Module 2.',
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: 'msg-4',
        channelId: 'dm:user-learner-1:user-inst-1',
        programmeId: 'prog-research',
        senderId: 'user-learner-1',
        senderName: 'Priya Sharma',
        senderRole: 'LEARNER',
        content: 'Good morning Dr. Vikram, I had a quick question regarding the counterfactual concept in evaluation studies.',
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        id: 'msg-5',
        channelId: 'dm:user-learner-1:user-inst-1',
        programmeId: 'prog-research',
        senderId: 'user-inst-1',
        senderName: 'Dr. Vikram Mehta',
        senderRole: 'INSTRUCTOR',
        content: 'Good morning Priya! In impact evaluations, a counterfactual estimates what would have happened to beneficiaries in the absence of the intervention. Check section 2 of the M&E primer.',
        createdAt: new Date(Date.now() - 3600000 * 2),
      }
    );

    // Seed Feedback
    this.feedback.push(
      {
        id: 'fb-1',
        userId: 'user-learner-3',
        programmeId: 'prog-research',
        moduleId: 'mod-res-2',
        rating: 5,
        comment:
          'The Results Framework template and LogFrame examples directly helped our field evaluation planning.',
        isAnonymous: false,
        createdAt: new Date(Date.now() - 86400000 * 4),
      },
      {
        id: 'fb-2',
        userId: 'user-learner-1',
        programmeId: 'prog-research',
        moduleId: 'mod-res-0',
        rating: 5,
        comment:
          'Onboarding instructions were thorough. The 30-second reading timer keeps reading structured.',
        isAnonymous: true,
        createdAt: new Date(Date.now() - 86400000 * 2),
      }
    );
  }
}

const globalStore = globalThis as unknown as { __ikaai_store?: Store };
if (!globalStore.__ikaai_store) {
  globalStore.__ikaai_store = new Store();
}
export const localStore = globalStore.__ikaai_store;

let prismaActive: boolean | null = null;
async function isPrismaReady() {
  if (prismaActive !== null) return prismaActive;
  try {
    // Quick probe
    await prisma.$queryRaw`SELECT 1`;
    prismaActive = true;
  } catch {
    prismaActive = false;
  }
  return prismaActive;
}

export const db = {
  async findUserByEmail(email: string) {
    if (await isPrismaReady()) {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) return user;
      } catch {
        // Fallback
      }
    }
    return localStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id: string) {
    if (await isPrismaReady()) {
      try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (user) return user;
      } catch {
        // Fallback
      }
    }
    return localStore.users.find((u) => u.id === id) || null;
  },

  async getProgrammes() {
    if (await isPrismaReady()) {
      try {
        const progs = await prisma.programme.findMany({
          where: { archivedAt: null },
          include: {
            modules: {
              include: { resources: true, quiz: true, faqs: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        });
        if (progs && progs.length > 0) return progs;
      } catch {
        // Fallback
      }
    }
    return localStore.programmes.filter((p) => !p.archivedAt);
  },

  async getProgrammeBySlug(slug: string) {
    if (await isPrismaReady()) {
      try {
        const prog = await prisma.programme.findUnique({
          where: { slug },
          include: {
            modules: {
              include: { resources: true, quiz: true, faqs: true },
              orderBy: { sortOrder: 'asc' },
            },
            instructors: true,
            writtenExam: {
              include: { questions: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        });
        if (prog) return prog;
      } catch {
        // Fallback
      }
    }
    return localStore.programmes.find((p) => p.slug === slug || p.id === slug) || null;
  },

  async getUserEnrollment(userId: string, programmeId: string) {
    if (await isPrismaReady()) {
      try {
        const enr = await prisma.enrollment.findUnique({
          where: { userId_programmeId: { userId, programmeId } },
        });
        if (enr) return enr;
      } catch {
        // Fallback
      }
    }
    return (
      localStore.enrollments.find(
        (e) => e.userId === userId && e.programmeId === programmeId
      ) || null
    );
  },

  async getUserEnrolledProgrammes(userId: string) {
    const userEnrolments = localStore.enrollments.filter((e) => e.userId === userId);
    const progIds = userEnrolments.map((e) => e.programmeId);
    return localStore.programmes.filter((p) => progIds.includes(p.id));
  },

  async getProgressSummary(userId: string, programmeId: string) {
    const prog = localStore.programmes.find((p) => p.id === programmeId || p.slug === programmeId);
    if (!prog) return { completedCount: 0, totalCount: 0, percentage: 0 };

    let totalItems = 0;
    let completedItems = 0;

    for (const mod of prog.modules) {
      for (const res of mod.resources) {
        totalItems++;
        const isDone = localStore.resourceProgress.some(
          (rp) => rp.userId === userId && rp.resourceId === res.id && rp.completed
        );
        if (isDone) completedItems++;
      }
      if (mod.quiz) {
        totalItems++;
        const hasQuiz = localStore.quizSubmissions.some(
          (qs) => qs.userId === userId && qs.quizId === mod.quiz!.id
        );
        if (hasQuiz) completedItems++;
      }
    }

    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return { completedCount: completedItems, totalCount: totalItems, percentage };
  },

  async recordConsent(userId: string, purpose: string, ipAddress?: string) {
    localStore.consentLogs.push({
      id: `consent-${Date.now()}`,
      userId,
      purpose,
      policyVer: 'v1.0-2026',
      consentedAt: new Date(),
      ipAddress: ipAddress || null,
    });
  },

  async hasConsented(userId: string) {
    return localStore.consentLogs.some((c) => c.userId === userId);
  },

  async getCertificate(userId: string, programmeId: string) {
    return (
      localStore.certificates.find(
        (c) => c.userId === userId && c.programmeId === programmeId
      ) || null
    );
  },

  async getCertificateByVerificationId(verificationId: string) {
    const cert = localStore.certificates.find((c) => c.verificationId === verificationId);
    if (!cert) return null;
    const prog = localStore.programmes.find((p) => p.id === cert.programmeId);
    return {
      certificateNo: cert.certificateNo,
      recipientName: cert.recipientName,
      programmeTitle: prog?.title || 'Ikaai Training Programme',
      finalGrade: cert.finalGrade,
      issuedAt: cert.issuedAt,
      verificationId: cert.verificationId,
      issuer: 'Ikaai India Research Pvt. Ltd.',
      accreditation: 'ISO 9001:2015 Certified Management System',
    };
  },

  async checkEligibility(userId: string, programmeId: string) {
    const prog = localStore.programmes.find((p) => p.id === programmeId || p.slug === programmeId);
    if (!prog) return { eligible: false, reason: 'Programme not found' };

    // 1. All resources completed
    let totalResources = 0;
    let completedResources = 0;
    for (const mod of prog.modules) {
      for (const res of mod.resources) {
        totalResources++;
        const isDone = localStore.resourceProgress.some(
          (rp) => rp.userId === userId && rp.resourceId === res.id && rp.completed
        );
        if (isDone) completedResources++;
      }
    }
    const resourcesComplete = totalResources > 0 && completedResources === totalResources;

    // 2. All quizzes passed
    let totalQuizzes = 0;
    let passedQuizzes = 0;
    for (const mod of prog.modules) {
      if (mod.quiz) {
        totalQuizzes++;
        const submission = localStore.quizSubmissions.find(
          (qs) => qs.userId === userId && qs.quizId === mod.quiz!.id
        );
        if (submission && submission.percentage >= (mod.quiz.passingScore || 70)) {
          passedQuizzes++;
        }
      }
    }
    const quizzesComplete = totalQuizzes === 0 || passedQuizzes === totalQuizzes;

    // 3. Written exam graded and passed
    const exam = prog.writtenExam;
    let examPassed = false;
    let examDetails: {
      submitted: boolean;
      graded: boolean;
      marks: number | null;
      totalMarks: number;
      passingThreshold: number;
      passed: boolean;
    } | null = null;

    if (exam) {
      const sub = localStore.examSubmissions.find(
        (es) => es.userId === userId && es.examId === exam.id
      );
      const totalMaxMarks = exam.questions.reduce((sum, q) => sum + q.maxMarks, 0);
      const passingPercentage = exam.passingMarks || exam.passingPercentage || 60;
      const passingThreshold = Math.ceil((totalMaxMarks * passingPercentage) / 100);
      const isGraded = sub?.status === 'GRADED';
      const isPassing = isGraded && (sub.marks ?? 0) >= passingThreshold;
      examPassed = isPassing;
      examDetails = {
        submitted: !!sub,
        graded: isGraded,
        marks: sub?.marks ?? null,
        totalMarks: totalMaxMarks,
        passingThreshold,
        passed: isPassing,
      };
    } else {
      examPassed = true;
    }

    const eligible = resourcesComplete && quizzesComplete && examPassed;

    return {
      eligible,
      progress: {
        completedResources,
        totalResources,
        percentage: totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0,
        resourcesComplete,
      },
      quizzes: {
        passedQuizzes,
        totalQuizzes,
        quizzesComplete,
      },
      exam: examDetails,
    };
  },

  async issueCertificate(userId: string, programmeId: string) {
    const existing = localStore.certificates.find(
      (c) => c.userId === userId && c.programmeId === programmeId
    );
    if (existing) return existing;

    const user = localStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    const eligibility = await this.checkEligibility(userId, programmeId);
    if (!eligibility.eligible) {
      throw new Error('Learner has not satisfied all certificate completion and passing criteria');
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const certNo = `IKAAI-ACAD-2026-${randomSuffix}`;
    const verId = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const newCert = {
      id: `cert-${Date.now()}`,
      certificateNo: certNo,
      recipientName: user.name, // Snapshot of current name at issuance
      userId,
      programmeId,
      issuedAt: new Date(),
      finalGrade: 'Grade A (Distinction)',
      verificationId: verId,
    };

    localStore.certificates.push(newCert);
    return newCert;
  },

  async anonymiseUser(userId: string) {
    const user = localStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    // 1. Redact core user fields
    user.name = 'Former Learner';
    user.email = `anonymised-${userId}@anonymised.invalid`;
    user.passwordHash = '';
    user.avatarUrl = undefined;
    user.tokenVersion = (user.tokenVersion || 1) + 1;
    user.isAnonymised = true;
    user.anonymisedAt = new Date();

    // 2. Redact IP in consent logs
    for (const c of localStore.consentLogs) {
      if (c.userId === userId) {
        c.ipAddress = null;
      }
    }

    // 3. Redact direct chat messages
    for (const msg of localStore.chatMessages) {
      if (
        msg.channelId.startsWith('dm:') &&
        (msg.senderId === userId || msg.channelId.includes(userId))
      ) {
        msg.content = '[Message deleted upon account anonymisation]';
      }
      if (msg.senderId === userId) {
        msg.senderName = 'Former Learner';
      }
    }

    // Note: Certificate.recipientName is preserved as snapshot per DPDP legal retention requirements
    return { success: true, userId, anonymisedAt: user.anonymisedAt };
  },
};
