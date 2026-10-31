import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { quizId, answers } = await req.json();

    if (!quizId || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'quizId and answers object are required' },
        { status: 400 }
      );
    }

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

    // Verify enrollment
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

    // Check existing submissions and attempt count
    const existingSubmissions = localStore.quizSubmissions
      .filter((qs) => qs.userId === user.userId && qs.quizId === quizId)
      .sort((a, b) => b.attemptNo - a.attemptNo);

    const latestSubmission = existingSubmissions[0];
    let currentAttemptNo = 1;

    if (latestSubmission) {
      // Check if reset was granted
      if (latestSubmission.resetCount === 0 || existingSubmissions.length > latestSubmission.resetCount) {
        return NextResponse.json(
          {
            error: 'Single-attempt quiz already completed. Retakes are not permitted unless reset by an instructor.',
            submission: {
              score: latestSubmission.score,
              total: latestSubmission.total,
              percentage: latestSubmission.percentage,
              submittedAt: latestSubmission.submittedAt,
            },
          },
          { status: 409 }
        );
      }
      currentAttemptNo = latestSubmission.attemptNo + 1;
    }

    // Server-side scoring computation: NEVER trust client score
    let score = 0;
    const total = foundQuiz.questions.length;

    for (const q of foundQuiz.questions) {
      const selectedIndex = answers[q.id];
      if (typeof selectedIndex === 'number' && selectedIndex === q.correctIndex) {
        score++;
      }
    }

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    const submissionRecord = {
      id: `qs-${user.userId}-${quizId}-${currentAttemptNo}-${Date.now()}`,
      userId: user.userId,
      quizId,
      score,
      total,
      percentage,
      attemptNo: currentAttemptNo,
      resetCount: 0,
      submittedAt: new Date(),
    };

    localStore.quizSubmissions.push(submissionRecord);

    return NextResponse.json({
      success: true,
      message: `Quiz submitted successfully: ${score} / ${total} (${percentage}%)`,
      score,
      total,
      percentage,
      passed: percentage >= (foundQuiz.passingScore || 70),
      attemptNo: currentAttemptNo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
