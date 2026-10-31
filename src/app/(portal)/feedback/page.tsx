import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, localStore } from '@/lib/db';
import { FeedbackView } from '@/components/feedback-view';

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'user-learner-1';
  const userRole = session?.user?.role || 'LEARNER';

  const rawProgrammes = await db.getProgrammes();
  const programmes = rawProgrammes.map((p: any) => ({
    id: p.id,
    title: p.title,
    colorTag: p.colorTag,
    modules: (p.modules || []).map((m: any) => ({ id: m.id, title: m.title })),
  }));

  // Fetch learner's own feedback
  const myFeedback = localStore.feedback
    .filter((fb) => fb.userId === userId)
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

  // If instructor or admin, prepare safe feedback list
  let instructorFeedback: any[] = [];
  if (userRole === 'INSTRUCTOR' || userRole === 'ADMIN') {
    let allowedProgIds: string[] = [];
    if (userRole === 'ADMIN') {
      allowedProgIds = localStore.programmes.map((p) => p.id);
    } else {
      allowedProgIds = localStore.programmes
        .filter((p) => p.instructors.includes(userId))
        .map((p) => p.id);
    }

    const filtered = localStore.feedback.filter((fb) => allowedProgIds.includes(fb.programmeId));

    instructorFeedback = filtered.map((fb) => {
      const prog = localStore.programmes.find((p) => p.id === fb.programmeId);
      const mod = prog?.modules.find((m) => m.id === fb.moduleId);
      const dateStr = new Date(fb.createdAt).toISOString().slice(0, 10);

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
          date: dateStr,
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
  }

  return (
    <FeedbackView
      userRole={userRole}
      programmes={programmes}
      myFeedback={myFeedback}
      instructorFeedback={instructorFeedback}
    />
  );
}
