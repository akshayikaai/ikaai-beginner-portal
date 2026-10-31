import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const actor = await requireRole(['INSTRUCTOR', 'ADMIN'], req);
    const { userId, quizId, reason } = await req.json();

    if (!userId || !quizId) {
      return NextResponse.json(
        { error: 'userId and quizId are required' },
        { status: 400 }
      );
    }

    // Verify programme assignment if instructor
    let foundProgId: string | null = null;
    for (const prog of localStore.programmes) {
      for (const mod of prog.modules) {
        if (mod.quiz && mod.quiz.id === quizId) {
          foundProgId = prog.id;
          break;
        }
      }
      if (foundProgId) break;
    }

    if (actor.role === 'INSTRUCTOR' && foundProgId) {
      const prog = localStore.programmes.find((p) => p.id === foundProgId);
      if (!prog?.instructors.includes(actor.userId)) {
        return NextResponse.json(
          { error: 'Cross-programme access forbidden: Instructor not assigned to this programme' },
          { status: 403 }
        );
      }
    }

    // Find latest submission for user and quiz
    const submission = localStore.quizSubmissions
      .filter((qs) => qs.userId === userId && qs.quizId === quizId)
      .sort((a, b) => b.attemptNo - a.attemptNo)[0];

    if (!submission) {
      return NextResponse.json(
        { error: 'No previous quiz submission found for this user' },
        { status: 404 }
      );
    }

    // Authorize reset: increment resetCount
    submission.resetCount += 1;
    submission.resetById = actor.userId;
    submission.resetReason = reason || 'Instructor granted retake attempt';

    console.log(
      `🔄 [QUIZ RESET LOG]: Quiz ${quizId} for user ${userId} reset by ${actor.name} (${actor.email}). Reason: ${submission.resetReason}`
    );

    return NextResponse.json({
      success: true,
      message: `Quiz attempt reset granted for user ${userId}. Retake now permitted.`,
      resetCount: submission.resetCount,
      resetById: actor.userId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
