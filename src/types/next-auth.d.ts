import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
    tokenVersion: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
      tokenVersion: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
    tokenVersion: number;
  }
}
