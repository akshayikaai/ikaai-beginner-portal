import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthorizationError } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { progId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { progId } = params;
    const userId = user.userId;

    // Check enrollment
    const enrollment = await db.getUserEnrollment(userId, progId);
    if (!enrollment && user.role === 'LEARNER') {
      return NextResponse.json(
        { message: 'Forbidden: You are not enrolled in this programme' },
        { status: 403 }
      );
    }

    const certificate = await db.getCertificate(userId, progId);
    const eligibility = await db.checkEligibility(userId, progId);

    return NextResponse.json({
      certificate,
      eligibility,
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error('Error fetching certificate status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { progId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { progId } = params;
    const userId = user.userId;

    // Enrolled learner or admin
    const enrollment = await db.getUserEnrollment(userId, progId);
    if (!enrollment && user.role === 'LEARNER') {
      return NextResponse.json(
        { message: 'Forbidden: You are not enrolled in this programme' },
        { status: 403 }
      );
    }

    try {
      const certificate = await db.issueCertificate(userId, progId);
      return NextResponse.json({
        message: 'Certificate successfully generated and issued',
        certificate,
      });
    } catch (err: any) {
      return NextResponse.json(
        { message: err.message || 'Learner does not meet certification criteria' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
