import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { channelId, content, programmeId } = await req.json();

    if (!channelId || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'channelId and message content are required' },
        { status: 400 }
      );
    }

    // Verify channel access
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
          { error: 'Forbidden: You cannot send messages to this conversation' },
          { status: 403 }
        );
      }
    }

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channelId,
      programmeId: programmeId || null,
      senderId: user.userId,
      senderName: user.name,
      senderRole: user.role,
      content: content.trim(),
      createdAt: new Date(),
    };

    localStore.chatMessages.push(newMessage);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
