import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['INSTRUCTOR', 'ADMIN'], req);
    const quizId = params.id;

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

    // If instructor, verify assignment to programme
    if (user.role === 'INSTRUCTOR') {
      const prog = localStore.programmes.find((p) => p.id === foundProgId);
      if (!prog?.instructors.includes(user.userId)) {
        return NextResponse.json(
          { error: 'Cross-programme access forbidden: Instructor not assigned to this programme' },
          { status: 403 }
        );
      }
    }

    // Return full questions WITH correctIndex
    return NextResponse.json({
      id: foundQuiz.id,
      title: foundQuiz.title,
      passingScore: foundQuiz.passingScore,
      questions: foundQuiz.questions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
