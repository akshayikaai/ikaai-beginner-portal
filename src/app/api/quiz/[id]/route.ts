import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const quizId = params.id;

    // Find quiz in programmes
    let foundQuiz: any = null;
    let foundProgId: string | null = null;

    for (const prog of localStore.programmes) {
      for (const mod of prog.modules) {
        if (mod.quiz && mod.quiz.id === quizId) {
          foundQuiz = mod.quiz;
          foundProgId = prog.id;
          break;
        }
      }
      if (foundQuiz) break;
    }

    if (!foundQuiz || !foundProgId) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Verify enrollment if learner
    if (user.role === 'LEARNER') {
      const isEnrolled = localStore.enrollments.some(
        (e) => e.userId === user.userId && e.programmeId === foundProgId && e.status === 'ACTIVE'
      );
      if (!isEnrolled) {
        return NextResponse.json(
          { error: 'Cross-programme access forbidden: Learner not enrolled in this programme' },
          { status: 403 }
        );
      }
    }

    // Check if user has already submitted this quiz
    const existingSubmission = localStore.quizSubmissions
      .filter((qs) => qs.userId === user.userId && qs.quizId === quizId)
      .sort((a, b) => b.attemptNo - a.attemptNo)[0];

    // CRITICAL SECURITY RULE: Strip correctIndex completely for learners
    const safeQuestions = foundQuiz.questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      sortOrder: q.sortOrder,
      // correctIndex is omitted completely!
    }));

    return NextResponse.json({
      id: foundQuiz.id,
      title: foundQuiz.title,
      instructions: foundQuiz.instructions,
      passingScore: foundQuiz.passingScore,
      questionsCount: safeQuestions.length,
      questions: safeQuestions,
      submission: existingSubmission
        ? {
            score: existingSubmission.score,
            total: existingSubmission.total,
            percentage: existingSubmission.percentage,
            attemptNo: existingSubmission.attemptNo,
            submittedAt: existingSubmission.submittedAt,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
