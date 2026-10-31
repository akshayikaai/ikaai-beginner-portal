import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const hasConsented = await db.hasConsented(user.userId);
    return NextResponse.json({ hasConsented });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json().catch(() => ({}));
    const purpose = body.purpose || 'ONBOARDING_TRAINING_2026';
    const ip = req.headers.get('x-forwarded-for') || undefined;

    await db.recordConsent(user.userId, purpose, ip);
    return NextResponse.json({ success: true, message: 'Consent logged successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.statusCode || 401 }
    );
  }
}
