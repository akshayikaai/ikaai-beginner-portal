import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthorizationError } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin privilege required' },
        { status: 403 }
      );
    }

    // Build CSV rows
    const headers = [
      'Learner ID',
      'Name',
      'Email',
      'Department',
      'Programme',
      'Completion %',
      'Quizzes Passed',
      'Exam Status',
      'Exam Marks',
      'Certificate Status',
      'Certificate No',
      'Verification Token',
      'Account Status',
    ];

    const rows: string[][] = [];

    for (const u of localStore.users) {
      if (u.role !== 'LEARNER') continue;

      const userEnrollments = localStore.enrollments.filter((e) => e.userId === u.id);

      for (const enr of userEnrollments) {
        const prog = localStore.programmes.find((p) => p.id === enr.programmeId);

        // Calculate progress %
        let totalItems = 0;
        let completedItems = 0;
        let totalQuizzes = 0;
        let passedQuizzes = 0;

        if (prog) {
          for (const m of prog.modules) {
            for (const r of m.resources) {
              totalItems++;
              const isDone = localStore.resourceProgress.some(
                (rp) => rp.userId === u.id && rp.resourceId === r.id && rp.completed
              );
              if (isDone) completedItems++;
            }
            if (m.quiz) {
              totalItems++;
              totalQuizzes++;
              const qs = localStore.quizSubmissions.find(
                (q) => q.userId === u.id && q.quizId === m.quiz!.id
              );
              if (qs && qs.percentage >= (m.quiz.passingScore || 70)) {
                completedItems++;
                passedQuizzes++;
              }
            }
          }
        }

        const completionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Written exam status
        const examSub = prog?.writtenExam
          ? localStore.examSubmissions.find(
              (es) => es.userId === u.id && es.examId === prog.writtenExam!.id
            )
          : null;

        const examStatus = examSub ? examSub.status : 'NOT_SUBMITTED';
        const examMarks = examSub?.marks !== undefined && examSub?.marks !== null ? `${examSub.marks}` : 'N/A';

        // Certificate status
        const cert = localStore.certificates.find(
          (c) => c.userId === u.id && c.programmeId === enr.programmeId
        );

        rows.push([
          u.id,
          u.name,
          u.email,
          u.department,
          prog?.title || enr.programmeId,
          `${completionPct}%`,
          `${passedQuizzes}/${totalQuizzes}`,
          examStatus,
          examMarks,
          cert ? 'ISSUED' : 'PENDING',
          cert ? cert.certificateNo : 'None',
          cert ? cert.verificationId : 'None',
          u.isAnonymised ? 'ANONYMISED (DPDP)' : 'ACTIVE',
        ]);
      }
    }

    // Convert to CSV format with RFC 4180 escaping
    const escapeCsv = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ikaai-academy-cohort-report.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error('Error generating cohort export:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
