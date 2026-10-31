import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { checkRateLimit } from './rate-limiter';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // 12 hours rolling session
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const ip = (req?.headers?.['x-forwarded-for'] as string) || '127.0.0.1';
        const rateLimitKey = `login:${ip}:${credentials.email.toLowerCase()}`;

        // 1. Enforce Progressive Rate Limiting
        const rateResult = await checkRateLimit(rateLimitKey);
        if (!rateResult.allowed) {
          throw new Error(
            `Too many failed attempts. Please try again after ${rateResult.retryAfterSec} seconds.`
          );
        }

        // Apply progressive artificial delay if threshold reached
        if (rateResult.delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, rateResult.delayMs));
        }

        // 2. Fetch User
        const user = await db.findUserByEmail(credentials.email);
        if (!user || user.isAnonymised) {
          throw new Error('Invalid email or password.');
        }

        // 3. Verify Password
        const isValid = bcrypt.compareSync(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tokenVersion = (user as any).tokenVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
        session.user.tokenVersion = token.tokenVersion as number;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-ikaai-academy-2026-auth-session-key-super-secure',
};
