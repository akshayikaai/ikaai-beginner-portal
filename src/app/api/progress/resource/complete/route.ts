import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { resourceId } = await req.json();

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });
    }

    // Find resource specification
    let foundResource: any = null;
    for (const prog of localStore.programmes) {
      for (const mod of prog.modules) {
        const res = mod.resources.find((r) => r.id === resourceId);
        if (res) {
          foundResource = res;
          break;
        }
      }
      if (foundResource) break;
    }

    if (!foundResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Retrieve server-recorded startedAt (strictly ignore any client-supplied timestamp)
    const record = localStore.resourceProgress.find(
      (rp) => rp.userId === user.userId && rp.resourceId === resourceId
    );

    if (!record || !record.startedAt) {
      return NextResponse.json(
        { error: 'Reading timer requirement not met: Resource was not started on server' },
        { status: 400 }
      );
    }

    const readingTimeSec = foundResource.readingTime || 30;
    const now = Date.now();
    const startedAtMs = new Date(record.startedAt).getTime();
    const elapsedMs = now - startedAtMs;

    // 2-second buffer for network latency
    const requiredMs = (readingTimeSec - 2) * 1000;

    if (elapsedMs < requiredMs) {
      const remainingSec = Math.ceil((requiredMs - elapsedMs) / 1000);
      return NextResponse.json(
        {
          error: `Reading timer requirement not met. Please continue reading for ${remainingSec} more seconds.`,
          remainingSeconds: remainingSec,
        },
        { status: 400 }
      );
    }

    // Mark as completed
    record.completed = true;
    record.completedAt = new Date();
    record.secondsSpent = Math.round(elapsedMs / 1000);

    return NextResponse.json({
      success: true,
      message: 'Resource completed successfully',
      resourceId,
      completed: true,
      completedAt: record.completedAt,
      secondsSpent: record.secondsSpent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
