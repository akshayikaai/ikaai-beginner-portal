import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { db, localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { resourceId } = await req.json();

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });
    }

    // Verify enrollment
    let foundResource: any = null;
    let foundProgId: string | null = null;

    for (const prog of localStore.programmes) {
      for (const mod of prog.modules) {
        const res = mod.resources.find((r) => r.id === resourceId);
        if (res) {
          foundResource = res;
          foundProgId = prog.id;
          break;
        }
      }
      if (foundResource) break;
    }

    if (!foundResource || !foundProgId) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Check enrollment if learner
    if (user.role === 'LEARNER') {
      const isEnrolled = localStore.enrollments.some(
        (e) => e.userId === user.userId && e.programmeId === foundProgId && e.status === 'ACTIVE'
      );
      if (!isEnrolled) {
        return NextResponse.json(
          { error: 'Cross-programme access forbidden: Learner not enrolled in this programme' },
          { status: 403 }
        );
      }
    }

    // Idempotent start: preserve first startedAt
    let record = localStore.resourceProgress.find(
      (rp) => rp.userId === user.userId && rp.resourceId === resourceId
    );

    if (!record) {
      record = {
        userId: user.userId,
        resourceId,
        completed: false,
        startedAt: new Date(),
        secondsSpent: 0,
      };
      localStore.resourceProgress.push(record);
    } else if (!record.startedAt) {
      record.startedAt = new Date();
    }
    // If startedAt was already set, it is preserved (idempotent)

    return NextResponse.json({
      success: true,
      resourceId,
      startedAt: record.startedAt,
      readingTime: foundResource.readingTime,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
