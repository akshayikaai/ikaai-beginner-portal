import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, localStore } from '@/lib/db';
import { GradesView } from '@/components/grades-view';

export default async function GradesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'user-learner-1';
  const userRole = session?.user?.role || 'LEARNER';

  const enrolledProgrammes = await db.getUserEnrolledProgrammes(userId);
  const primaryProgramme = enrolledProgrammes[0] || (await db.getProgrammeBySlug('research'));

  // Overall milestone progress
  const progressSummary = await db.getProgressSummary(userId, primaryProgramme.id);

  // Module Quizzes Breakdown
  const modulesWithGrades = (primaryProgramme.modules || []).map((m: any, idx: number) => {
    let submission: any = null;
    if (m.quiz) {
      const qs = localStore.quizSubmissions
        .filter((q) => q.userId === userId && q.quizId === m.quiz.id)
        .sort((a, b) => b.attemptNo - a.attemptNo)[0];
      if (qs) {
        submission = {
          score: qs.score,
          total: qs.total,
          percentage: qs.percentage,
          attemptNo: qs.attemptNo,
          resetCount: qs.resetCount,
          submittedAt: qs.submittedAt,
        };
      }
    }

    return {
      moduleId: m.id,
      moduleTitle: m.title,
      sortOrder: m.sortOrder || idx * 1000,
      quiz: m.quiz
        ? {
            id: m.quiz.id,
            title: m.quiz.title,
            passingScore: m.quiz.passingScore || 70,
          }
        : null,
      submission,
    };
  });

  // Written Exam info
  let examGrade: any = null;
  const writtenExam = primaryProgramme.writtenExam;
  if (writtenExam) {
    const totalMaxMarks = writtenExam.questions.reduce(
      (sum: number, q: any) => sum + (q.maxMarks || 25),
      0
    );

    const sub = localStore.examSubmissions.find(
      (es) => es.userId === userId && es.examId === writtenExam.id
    );

    examGrade = {
      id: writtenExam.id,
      title: writtenExam.title,
      passingMarks: (writtenExam as any).passingMarks || (writtenExam as any).passingPercentage || 70,
      totalMaxMarks,
      status: sub?.status || 'NOT_SUBMITTED',
      marks: sub?.marks || null,
      feedback: sub?.feedback || null,
      submittedAt: sub?.submittedAt || null,
      gradedAt: sub?.gradedAt || null,
    };
  }

  // Instructor Cohort Grades Roster
  let cohortGrades: any[] = [];
  if (userRole === 'INSTRUCTOR' || userRole === 'ADMIN') {
    const learners = localStore.users.filter((u) => u.role === 'LEARNER' && !u.isAnonymised);
    for (const l of learners) {
      const userEnr = localStore.enrollments.find((e) => e.userId === l.id);
      const prog = localStore.programmes.find((p) => p.id === userEnr?.programmeId) || primaryProgramme;

      const pSummary = await db.getProgressSummary(l.id, prog.id);

      const lQuizzes = localStore.quizSubmissions.filter((q) => q.userId === l.id);
      const lQuizAvg =
        lQuizzes.length > 0
          ? Math.round(lQuizzes.reduce((acc, q) => acc + q.percentage, 0) / lQuizzes.length)
          : null;

      const lExam = localStore.examSubmissions.find((es) => es.userId === l.id);

      cohortGrades.push({
        userId: l.id,
        name: l.name,
        email: l.email,
        programmeTitle: prog.title,
        progressPercent: pSummary.percentage,
        quizAverage: lQuizAvg,
        examStatus: lExam?.status || 'NOT_SUBMITTED',
        examMarks: lExam?.marks || null,
      });
    }
  }

  return (
    <GradesView
      userRole={userRole}
      programme={{
        id: primaryProgramme.id,
        title: primaryProgramme.title,
        colorTag: primaryProgramme.colorTag,
      }}
      overallProgress={progressSummary.percentage}
      modules={modulesWithGrades}
      exam={examGrade}
      cohortGrades={cohortGrades}
    />
  );
}
