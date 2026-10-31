import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { localStore } from '@/lib/db';
import { AdminView } from '@/components/admin-view';

export const metadata = {
  title: 'Admin Workspace & Cohort Analytics | Ikaai Academy',
};

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Preload users data
  const userList = localStore.users.map((u) => {
    const enrollments = localStore.enrollments.filter((e) => e.userId === u.id);
    const enrSummaries = enrollments.map((enr) => {
      const prog = localStore.programmes.find((p) => p.id === enr.programmeId);
      const cert = localStore.certificates.find(
        (c) => c.userId === u.id && c.programmeId === enr.programmeId
      );
      return {
        programmeId: enr.programmeId,
        programmeTitle: prog?.title || enr.programmeId,
        status: enr.status,
        certificateIssued: !!cert,
      };
    });

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      isAnonymised: !!u.isAnonymised,
      anonymisedAt: u.anonymisedAt ? u.anonymisedAt.toISOString() : null,
      enrollments: enrSummaries,
    };
  });

  return <AdminView initialUsers={userList} />;
}
