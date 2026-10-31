import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { localStore } from '@/lib/db';
import { ChatView } from '@/components/chat-view';

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'user-learner-1';
  const userName = session?.user?.name || 'Priya Sharma';
  const userRole = session?.user?.role || 'LEARNER';

  // Build channels based on user's access
  const channels: any[] = [];

  // Cohort channels
  for (const prog of localStore.programmes) {
    if (userRole === 'ADMIN') {
      channels.push({
        id: `cohort:${prog.id}`,
        name: `${prog.title} Cohort`,
        type: 'cohort',
        description: `Official group discussion for ${prog.title} researchers`,
        colorTag: prog.colorTag,
      });
    } else if (userRole === 'LEARNER') {
      const isEnrolled = localStore.enrollments.some(
        (e) => e.userId === userId && e.programmeId === prog.id && e.status === 'ACTIVE'
      );
      if (isEnrolled) {
        channels.push({
          id: `cohort:${prog.id}`,
          name: `${prog.title} Cohort`,
          type: 'cohort',
          description: `Official group discussion for ${prog.title} researchers`,
          colorTag: prog.colorTag,
        });
      }
    } else if (userRole === 'INSTRUCTOR') {
      if (prog.instructors.includes(userId)) {
        channels.push({
          id: `cohort:${prog.id}`,
          name: `${prog.title} Cohort`,
          type: 'cohort',
          description: `Official group discussion for ${prog.title} researchers`,
          colorTag: prog.colorTag,
        });
      }
    }
  }

  // Direct message channels with instructors
  if (userRole === 'LEARNER') {
    const instructors = localStore.users.filter((u) => u.role === 'INSTRUCTOR');
    for (const inst of instructors) {
      channels.push({
        id: `dm:${userId}:${inst.id}`,
        name: inst.name,
        type: 'dm',
        description: `Direct mentorship with ${inst.name} (${inst.email})`,
      });
    }
  } else if (userRole === 'INSTRUCTOR') {
    // Show direct chats with learners who have messaged
    const learners = localStore.users.filter((u) => u.role === 'LEARNER');
    for (const l of learners) {
      channels.push({
        id: `dm:${l.id}:${userId}`,
        name: l.name,
        type: 'dm',
        description: `Direct mentorship with ${l.name}`,
      });
    }
  }

  // Pre-load messages for all channels
  const initialMessages: Record<string, any[]> = {};
  for (const chan of channels) {
    const msgs = localStore.chatMessages
      .filter((m) => m.channelId === chan.id)
      .map((m) => {
        const sender = localStore.users.find((u) => u.id === m.senderId);
        return {
          id: m.id,
          channelId: m.channelId,
          senderId: m.senderId,
          senderName: sender?.isAnonymised ? 'Former Member' : m.senderName,
          senderRole: m.senderRole,
          content: m.content,
          createdAt: m.createdAt,
          isSelf: m.senderId === userId,
        };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    initialMessages[chan.id] = msgs;
  }

  return (
    <ChatView
      currentUserId={userId}
      currentUserName={userName}
      currentUserRole={userRole}
      channels={channels}
      initialMessages={initialMessages}
    />
  );
}
