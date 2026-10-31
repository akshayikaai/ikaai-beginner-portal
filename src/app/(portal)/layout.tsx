import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, localStore } from '@/lib/db';
import { PortalShell } from '@/components/portal-shell';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = session.user.id;
  const programmes = await db.getProgrammes();
  const userEnrollments = localStore.enrollments.filter((e) => e.userId === userId);

  // Compute progress for each programme
  const initialProgress: Record<string, { completedCount: number; totalCount: number; percentage: number }> = {};
  for (const prog of programmes) {
    initialProgress[prog.id] = await db.getProgressSummary(userId, prog.id);
  }

  // Pre-load user progress map
  const userProgressRecords: Record<string, boolean> = {};
  localStore.resourceProgress
    .filter((rp) => rp.userId === userId && rp.completed)
    .forEach((rp) => {
      userProgressRecords[rp.resourceId] = true;
    });

  const userQuizScores: Record<string, boolean> = {};
  localStore.quizSubmissions
    .filter((qs) => qs.userId === userId)
    .forEach((qs) => {
      userQuizScores[qs.quizId] = true;
    });

  const hasConsented = await db.hasConsented(userId);

  return (
    <PortalShell
      programmes={programmes as any}
      userEnrollments={userEnrollments}
      initialProgress={initialProgress}
      userProgressRecords={userProgressRecords}
      userQuizScores={userQuizScores}
      hasConsented={hasConsented}
    >
      {children}
    </PortalShell>
  );
}
