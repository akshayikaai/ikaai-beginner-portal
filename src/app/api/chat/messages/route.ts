import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
    }

    // Authorization checks based on channel type
    if (channelId.startsWith('cohort:')) {
      const progId = channelId.replace('cohort:', '');
      const prog = localStore.programmes.find((p) => p.id === progId);

      if (!prog) {
        return NextResponse.json({ error: 'Cohort programme not found' }, { status: 404 });
      }

      if (user.role === 'LEARNER') {
        const isEnrolled = localStore.enrollments.some(
          (e) => e.userId === user.userId && e.programmeId === progId && e.status === 'ACTIVE'
        );
        if (!isEnrolled) {
          return NextResponse.json(
            { error: 'Cross-programme access forbidden: Learner not enrolled in this cohort' },
            { status: 403 }
          );
        }
      } else if (user.role === 'INSTRUCTOR') {
        if (!prog.instructors.includes(user.userId)) {
          return NextResponse.json(
            { error: 'Cross-programme access forbidden: Instructor not assigned to this cohort' },
            { status: 403 }
          );
        }
      }
    } else if (channelId.startsWith('dm:')) {
      const parts = channelId.split(':');
      const u1 = parts[1];
      const u2 = parts[2];

      if (user.role !== 'ADMIN' && user.userId !== u1 && user.userId !== u2) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this direct message conversation' },
          { status: 403 }
        );
      }
    }

    // Retrieve and sanitize messages
    const messages = localStore.chatMessages
      .filter((m) => m.channelId === channelId)
      .map((m) => {
        const sender = localStore.users.find((u) => u.id === m.senderId);
        const isAnonymised = sender?.isAnonymised || false;

        return {
          id: m.id,
          channelId: m.channelId,
          senderId: m.senderId,
          senderName: isAnonymised ? 'Former Member' : m.senderName,
          senderRole: m.senderRole,
          content: m.content,
          createdAt: m.createdAt,
          isSelf: m.senderId === user.userId,
        };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({
      success: true,
      channelId,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
