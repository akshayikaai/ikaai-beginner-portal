import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { examId, answers } = await req.json();

    if (!examId || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'examId and answers object are required' },
        { status: 400 }
      );
    }

    // Find the programme associated with this exam
    let foundProg: any = null;
    for (const prog of localStore.programmes) {
      if (prog.writtenExam && prog.writtenExam.id === examId) {
        foundProg = prog;
        break;
      }
    }

    if (!foundProg) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check learner enrollment
    if (user.role === 'LEARNER') {
      const isEnrolled = localStore.enrollments.some(
        (e) => e.userId === user.userId && e.programmeId === foundProg.id && e.status === 'ACTIVE'
      );
      if (!isEnrolled) {
        return NextResponse.json(
          { error: 'Cross-programme access forbidden: Learner not enrolled in this programme' },
          { status: 403 }
        );
      }
    }

    // Enforce single submission rule
    const existing = localStore.examSubmissions.find(
      (es) => es.userId === user.userId && es.examId === examId
    );

    if (existing && (existing.status === 'SUBMITTED' || existing.status === 'GRADED')) {
      return NextResponse.json(
        {
          error: 'Written exam has already been submitted. Retakes are not permitted.',
          status: existing.status,
          submittedAt: existing.submittedAt,
        },
        { status: 409 }
      );
    }

    const submissionId = `sub-${user.userId}-${examId}-${Date.now()}`;
    const newSubmission = {
      id: submissionId,
      examId,
      userId: user.userId,
      status: 'SUBMITTED' as const,
      answersJson: answers,
      marks: null,
      feedback: null,
      submittedAt: new Date(),
      gradedAt: null,
    };

    if (existing) {
      Object.assign(existing, newSubmission);
    } else {
      localStore.examSubmissions.push(newSubmission);
    }

    return NextResponse.json({
      success: true,
      message: 'Written examination submitted successfully. Your assigned instructor will review your methodology and rigor.',
      submissionId,
      status: 'SUBMITTED',
      submittedAt: newSubmission.submittedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
