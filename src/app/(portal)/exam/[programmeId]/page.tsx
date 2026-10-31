import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, localStore } from '@/lib/db';
import { ExamView } from '@/components/exam-view';

export default async function ExamPage({
  params,
}: {
  params: { programmeId: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'user-learner-1';
  const userRole = session?.user?.role || 'LEARNER';

  const prog = await db.getProgrammeBySlug(params.programmeId);

  if (!prog) {
    notFound();
  }

  // Normalize writtenExam definition
  const writtenExam = prog.writtenExam
    ? {
        id: prog.writtenExam.id,
        title: prog.writtenExam.title,
        instructions: prog.writtenExam.instructions,
        passingMarks:
          (prog.writtenExam as any).passingMarks ||
          (prog.writtenExam as any).passingPercentage ||
          70,
        questions: prog.writtenExam.questions,
      }
    : {
        id: `exam-${prog.id}`,
        title: `${prog.title} Final Written Examination`,
        instructions:
          'Answer all questions thoroughly with reference to methodologies covered across modules. Your assigned departmental instructor will review and grade your submission.',
        passingMarks: 70,
        questions: [
          {
            id: `q-${prog.id}-1`,
            question: `How would you formulate a comprehensive evaluation framework for a primary research study in ${prog.title}? Detail the core hypotheses and risk mitigations.`,
            maxMarks: 50,
            sortOrder: 1000,
          },
          {
            id: `q-${prog.id}-2`,
            question:
              'Outline the data verification and survey quality control mechanisms essential during large-scale field deployments.',
            maxMarks: 50,
            sortOrder: 2000,
          },
        ],
      };

  // Find user's own submission
  const userSubmission =
    localStore.examSubmissions.find(
      (es) => es.userId === userId && es.examId === writtenExam.id
    ) || null;

  // If instructor or admin, gather cohort submissions for this exam
  let cohortSubmissions: any[] = [];
  if (userRole === 'INSTRUCTOR' || userRole === 'ADMIN') {
    const rawSubs = localStore.examSubmissions.filter(
      (es) => es.examId === writtenExam.id || es.examId === 'exam-field' || es.examId === 'exam-research'
    );
    cohortSubmissions = rawSubs.map((sub) => {
      const student = localStore.users.find((u) => u.id === sub.userId);
      return {
        id: sub.id,
        userId: sub.userId,
        studentName: student?.name || 'Unknown Learner',
        studentEmail: student?.email || '',
        status: sub.status,
        answersJson: sub.answersJson,
        marks: sub.marks,
        feedback: sub.feedback,
        submittedAt: sub.submittedAt,
        gradedAt: sub.gradedAt,
      };
    });
  }

  return (
    <ExamView
      userRole={userRole}
      currentUserId={userId}
      programme={{
        id: prog.id,
        slug: prog.slug,
        title: prog.title,
        colorTag: prog.colorTag,
      }}
      writtenExam={writtenExam}
      userSubmission={userSubmission}
      cohortSubmissions={cohortSubmissions}
    />
  );
}
