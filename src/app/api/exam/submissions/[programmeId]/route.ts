import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { programmeId: string } }
) {
  try {
    const actor = await requireRole(['INSTRUCTOR', 'ADMIN'], req);
    const programmeId = params.programmeId;

    const prog = localStore.programmes.find(
      (p) => p.id === programmeId || p.slug === programmeId
    );

    if (!prog) {
      return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
    }

    // Verify instructor assignment
    if (actor.role === 'INSTRUCTOR' && !prog.instructors.includes(actor.userId)) {
      return NextResponse.json(
        { error: 'Cross-programme access forbidden: Instructor not assigned to this programme' },
        { status: 403 }
      );
    }

    if (!prog.writtenExam) {
      return NextResponse.json({ submissions: [] });
    }

    const examId = prog.writtenExam.id;
    const submissions = localStore.examSubmissions.filter((es) => es.examId === examId);

    const totalMaxMarks = prog.writtenExam.questions.reduce(
      (sum: number, q: any) => sum + (q.maxMarks || 25),
      0
    );

    const enriched = submissions.map((sub) => {
      const student = localStore.users.find((u) => u.id === sub.userId);
      return {
        id: sub.id,
        userId: sub.userId,
        studentName: student?.name || 'Unknown Learner',
        studentEmail: student?.email || '',
        status: sub.status,
        answersJson: sub.answersJson,
        marks: sub.marks,
        totalMaxMarks,
        feedback: sub.feedback,
        submittedAt: sub.submittedAt,
        gradedAt: sub.gradedAt,
      };
    });

    return NextResponse.json({
      programmeId: prog.id,
      programmeTitle: prog.title,
      examTitle: prog.writtenExam.title,
      totalMaxMarks,
      passingMarks:
        prog.writtenExam.passingMarks || prog.writtenExam.passingPercentage || 70,
      submissions: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
