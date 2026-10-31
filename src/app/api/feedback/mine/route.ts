import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    const myFeedback = localStore.feedback
      .filter((fb) => fb.userId === user.userId)
      .map((fb) => {
        const prog = localStore.programmes.find((p) => p.id === fb.programmeId);
        const mod = prog?.modules.find((m) => m.id === fb.moduleId);
        return {
          id: fb.id,
          programmeId: fb.programmeId,
          programmeTitle: prog?.title || 'Unknown Programme',
          moduleId: fb.moduleId,
          moduleTitle: mod?.title || null,
          rating: fb.rating,
          comment: fb.comment,
          isAnonymous: fb.isAnonymous,
          createdAt: fb.createdAt,
        };
      });

    return NextResponse.json({
      success: true,
      feedback: myFeedback,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
