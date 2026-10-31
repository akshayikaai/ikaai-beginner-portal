import { NextResponse } from 'next/server';
import { getAuthenticatedUser, requireRole } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

// POST /api/feedback: Learners submit feedback
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { programmeId, moduleId, rating, comment, isAnonymous } = await req.json();

    if (!programmeId || typeof rating !== 'number' || !comment) {
      return NextResponse.json(
        { error: 'programmeId, numeric rating (1-5), and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (comment.length > 2000) {
      return NextResponse.json(
        { error: 'Comment must not exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Verify enrollment if learner
    if (user.role === 'LEARNER') {
      const isEnrolled = localStore.enrollments.some(
        (e) => e.userId === user.userId && e.programmeId === programmeId && e.status === 'ACTIVE'
      );
      if (!isEnrolled) {
        return NextResponse.json(
          { error: 'Cross-programme access forbidden: Learner not enrolled in this programme' },
          { status: 403 }
        );
      }
    }

    const feedbackRecord = {
      id: `fb-${user.userId}-${Date.now()}`,
      userId: user.userId,
      programmeId,
      moduleId: moduleId || null,
      rating,
      comment: comment.trim(),
      isAnonymous: Boolean(isAnonymous),
      createdAt: new Date(),
    };

    localStore.feedback.push(feedbackRecord);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback. Your submission has been securely recorded.',
      feedbackId: feedbackRecord.id,
      isAnonymous: feedbackRecord.isAnonymous,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}

// GET /api/feedback: Instructors and Admins view feedback
export async function GET(req: Request) {
  try {
    const actor = await requireRole(['INSTRUCTOR', 'ADMIN'], req);

    // Identify programmes assigned to actor
    let allowedProgIds: string[] = [];
    if (actor.role === 'ADMIN') {
      allowedProgIds = localStore.programmes.map((p) => p.id);
    } else {
      allowedProgIds = localStore.programmes
        .filter((p) => p.instructors.includes(actor.userId))
        .map((p) => p.id);
    }

    const filtered = localStore.feedback.filter((fb) => allowedProgIds.includes(fb.programmeId));

    // CRITICAL DPDP PRIVACY RULES:
    // 1. If anonymous, strip author identity entirely (omitted from API response).
    // 2. Truncate timestamp to YYYY-MM-DD (remove time-of-day to prevent timing correlation).
    const safeFeedback = filtered.map((fb) => {
      const prog = localStore.programmes.find((p) => p.id === fb.programmeId);
      const mod = prog?.modules.find((m) => m.id === fb.moduleId);

      const dateStr = new Date(fb.createdAt).toISOString().slice(0, 10); // YYYY-MM-DD strictly

      if (fb.isAnonymous) {
        return {
          id: fb.id,
          programmeId: fb.programmeId,
          programmeTitle: prog?.title || 'Unknown Programme',
          moduleId: fb.moduleId,
          moduleTitle: mod?.title || null,
          rating: fb.rating,
          comment: fb.comment,
          isAnonymous: true,
          authorName: null,
          authorEmail: null,
          date: dateStr, // date only, no time
        };
      }

      const author = localStore.users.find((u) => u.id === fb.userId);
      return {
        id: fb.id,
        programmeId: fb.programmeId,
        programmeTitle: prog?.title || 'Unknown Programme',
        moduleId: fb.moduleId,
        moduleTitle: mod?.title || null,
        rating: fb.rating,
        comment: fb.comment,
        isAnonymous: false,
        authorName: author?.name || 'Intern',
        authorEmail: author?.email || '',
        date: dateStr,
      };
    });

    return NextResponse.json({
      success: true,
      count: safeFeedback.length,
      feedback: safeFeedback,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
