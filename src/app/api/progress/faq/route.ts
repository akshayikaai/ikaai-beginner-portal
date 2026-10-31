import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { faqId } = await req.json();

    if (!faqId) {
      return NextResponse.json({ error: 'faqId is required' }, { status: 400 });
    }

    if (!(localStore as any).faqProgress) {
      (localStore as any).faqProgress = new Set<string>();
    }

    const key = `${user.userId}:${faqId}`;
    (localStore as any).faqProgress.add(key);

    return NextResponse.json({
      success: true,
      faqId,
      read: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
