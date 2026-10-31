import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const actor = await requireRole(['INSTRUCTOR', 'ADMIN'], req);
    const { submissionId, marks, feedback } = await req.json();

    if (!submissionId || typeof marks !== 'number') {
      return NextResponse.json(
        { error: 'submissionId and numeric marks are required' },
        { status: 400 }
      );
    }

    // Find submission
    const submission = localStore.examSubmissions.find((es) => es.id === submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Exam submission not found' }, { status: 404 });
    }

    // Find programme and exam definition
    let foundProg: any = null;
    for (const prog of localStore.programmes) {
      if (prog.writtenExam && prog.writtenExam.id === submission.examId) {
        foundProg = prog;
        break;
      }
    }

    if (!foundProg) {
      return NextResponse.json({ error: 'Programme or exam not found' }, { status: 404 });
    }

    // Verify instructor assignment to programme
    if (actor.role === 'INSTRUCTOR') {
      if (!foundProg.instructors.includes(actor.userId)) {
        return NextResponse.json(
          { error: 'Cross-programme access forbidden: Instructor not assigned to this programme' },
          { status: 403 }
        );
      }
    }

    // Calculate maximum marks allowed from sum of questions
    const totalMaxMarks = foundProg.writtenExam.questions.reduce(
      (sum: number, q: any) => sum + (q.maxMarks || 25),
      0
    );

    if (marks < 0 || marks > totalMaxMarks) {
      return NextResponse.json(
        {
          error: `Marks must be between 0 and maximum possible marks (${totalMaxMarks})`,
          totalMaxMarks,
        },
        { status: 400 }
      );
    }

    const percentage = totalMaxMarks > 0 ? Math.round((marks / totalMaxMarks) * 100) : 0;
    const passingThreshold = foundProg.writtenExam.passingMarks || 70;
    const passed = percentage >= passingThreshold;

    submission.status = 'GRADED';
    submission.marks = marks;
    submission.feedback = feedback || '';
    submission.gradedAt = new Date();
    (submission as any).gradedById = actor.userId;

    console.log(
      `📝 [EXAM GRADED]: Submission ${submissionId} graded by ${actor.name}: ${marks}/${totalMaxMarks} (${percentage}%, Passed: ${passed})`
    );

    return NextResponse.json({
      success: true,
      message: 'Exam graded successfully',
      submissionId,
      marks,
      totalMaxMarks,
      percentage,
      passed,
      gradedAt: submission.gradedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
