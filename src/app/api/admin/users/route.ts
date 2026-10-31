import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthorizationError } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin privilege required' },
        { status: 403 }
      );
    }

    // Map users with their enrollment progress
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
        anonymisedAt: u.anonymisedAt || null,
        enrollments: enrSummaries,
      };
    });

    return NextResponse.json({ users: userList });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
