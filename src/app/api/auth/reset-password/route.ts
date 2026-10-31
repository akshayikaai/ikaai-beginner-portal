import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, localStore } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (email && typeof email === 'string') {
      const user = await db.findUserByEmail(email.trim());
      if (user && !user.isAnonymised) {
        // Generate cryptographic token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        localStore.passwordResetTokens.push({
          tokenHash,
          userId: user.id,
          expiresAt,
          used: false,
        });

        // Console mail provider output for local development
        console.log('----------------------------------------------------');
        console.log(`📧 [TRANSACTIONAL MAIL PROVIDER (Console)]: Password Reset`);
        console.log(`To: ${user.email} (${user.name})`);
        console.log(`Reset Token: ${rawToken}`);
        console.log(`Reset Link: http://localhost:3000/reset-password?token=${rawToken}`);
        console.log('----------------------------------------------------');
      }
    }

    // Always return non-enumerating generic response
    return NextResponse.json({
      success: true,
      message: 'If an account matches that email, a secure reset link has been dispatched.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
