import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, localStore } from '@/lib/db';
import { AnnouncementsView } from '@/components/announcements-view';

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'user-learner-1';
  const userRole = session?.user?.role || 'LEARNER';

  const rawProgrammes = await db.getProgrammes();
  const programmes = rawProgrammes.map((p: any) => ({
    id: p.id,
    title: p.title,
    colorTag: p.colorTag,
  }));

  // Filter visible announcements
  let allowedProgIds: (string | null)[] = [null];
  if (userRole === 'LEARNER') {
    const userEnrollments = localStore.enrollments
      .filter((e) => e.userId === userId && e.status === 'ACTIVE')
      .map((e) => e.programmeId);
    allowedProgIds.push(...userEnrollments);
  } else {
    allowedProgIds = [null, ...localStore.programmes.map((p) => p.id)];
  }

  const announcements = localStore.announcements
    .filter((a) => allowedProgIds.includes(a.programmeId || null))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AnnouncementsView
      userRole={userRole}
      announcements={announcements}
      programmes={programmes}
    />
  );
}
