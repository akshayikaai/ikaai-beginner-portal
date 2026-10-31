import { NextResponse } from 'next/server';
import { getAuthenticatedUser, requireRole } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    let allowedProgIds: (string | null)[] = [null]; // Global announcements are always visible

    if (user.role === 'LEARNER') {
      const userEnrollments = localStore.enrollments
        .filter((e) => e.userId === user.userId && e.status === 'ACTIVE')
        .map((e) => e.programmeId);
      allowedProgIds.push(...userEnrollments);
    } else {
      // Instructors and Admins see all announcements
      allowedProgIds = [null, ...localStore.programmes.map((p) => p.id)];
    }

    const announcements = localStore.announcements
      .filter((a) => allowedProgIds.includes(a.programmeId || null))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireRole(['INSTRUCTOR', 'ADMIN'], req);
    const { title, content, programmeId, priority } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    // If programme-specific and author is instructor, check assignment
    if (programmeId && actor.role === 'INSTRUCTOR') {
      const prog = localStore.programmes.find((p) => p.id === programmeId);
      if (!prog?.instructors.includes(actor.userId)) {
        return NextResponse.json(
          { error: 'Cross-programme access forbidden: Instructor not assigned to this programme' },
          { status: 403 }
        );
      }
    }

    const newAnnouncement = {
      id: `ann-${Date.now()}`,
      programmeId: programmeId || null,
      title: title.trim(),
      content: content.trim(),
      priority: (priority as any) || 'NORMAL',
      authorId: actor.userId,
      authorName: actor.name,
      authorRole: actor.role === 'ADMIN' ? 'Administration' : 'Instructor',
      createdAt: new Date(),
    };

    localStore.announcements.unshift(newAnnouncement);

    return NextResponse.json({
      success: true,
      message: 'Announcement published successfully',
      announcement: newAnnouncement,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
