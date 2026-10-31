import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthorizationError } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Admin privilege required' },
        { status: 403 }
      );
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { message: 'Target userId is required' },
        { status: 400 }
      );
    }

    // Execute DPDP Act 2023 exit anonymisation protocol
    const result = await db.anonymiseUser(userId);

    console.log(`🔒 [DPDP EXIT ANONYMISATION]: User ${userId} successfully anonymised by Admin ${user.name}`);

    return NextResponse.json({
      message: 'User account successfully anonymised under DPDP Act 2023 protocol',
      result,
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error('Error executing user anonymisation:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
