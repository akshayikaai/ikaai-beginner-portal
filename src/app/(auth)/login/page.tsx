'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  // Password reset dialog state
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetLoading, setResetLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in both your email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        showToast(res.error, 'error');
      } else {
        showToast('Login successful. Welcome back!', 'success');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      showToast(data.message || 'Reset link dispatched', 'default');
      setResetOpen(false);
      setResetEmail('');
    } catch {
      showToast('Network error while requesting reset', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const quickLogin = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg-main text-ink transition-colors">
      {/* Top Bar with Logo & Theme Switcher */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-element overflow-hidden border border-line bg-white shadow-sm flex items-center justify-center">
            <Image
              src="/logo.webp"
              alt="Ikaai Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="font-heading font-bold text-xl text-brand-500 tracking-tight block leading-tight">
              ikaai <span className="font-sans font-medium text-xs text-ink-muted">Academy</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-full border border-line text-ink-muted hover:text-brand-500 hover:bg-brand-50/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle color theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* Main Grid: Hero Visual + Login Card */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Institutional Hero Banner */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          <div className="relative overflow-hidden rounded-card border border-line bg-gradient-to-br from-[#00511e] via-[#093e1b] to-[#12261a] p-8 md:p-12 text-white shadow-card">
            {/* Ambient pattern overlay */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
              aria-hidden="true"
            />
            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-[#58c47f]" />
                Institutional Onboarding Portal
              </span>
              <h1 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-white leading-[1.15]">
                Research Begins With Listening.
              </h1>
              <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-xl font-normal">
                Working together for inclusive development. We unite field research, statistical rigor, and institutional policy from ground reality to the boardroom.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs text-white/70">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#58c47f]" />
                  <span>Role-Based Modules</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#58c47f]" />
                  <span>Single-Attempt Quizzes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#58c47f]" />
                  <span>ISO 9001:2015 Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Login Card & Demo Quick Logins */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <Card className="border border-line bg-bg-card shadow-floating p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-heading font-bold text-ink">Sign in to Academy</h2>
              <p className="text-sm text-ink-muted mt-1">
                Enter your credentials to access your enrolled programme.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3 text-xs rounded-element bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 leading-normal"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                  Work Email
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="name@ikaaiindia.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-10"
                  />
                  <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-ink-muted" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetOpen(true)}
                    className="text-xs text-brand-500 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-10"
                  />
                  <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-ink-muted" />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? 'Authenticating...' : 'Sign in to portal'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Quick Demo Login Presets */}
            <div className="pt-4 border-t border-line space-y-3">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block text-center">
                One-Click Demo Logins
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => quickLogin('learner@ikaaiindia.in', 'Learner@1234')}
                  className="p-2 rounded-element border border-line bg-bg-main text-left hover:border-brand-500 transition-colors"
                >
                  <b className="block text-ink">Priya Sharma</b>
                  <span className="text-ink-muted text-[11px]">Research (45%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('analyst.learner@ikaaiindia.in', 'Learner@1234')}
                  className="p-2 rounded-element border border-line bg-bg-main text-left hover:border-brand-500 transition-colors"
                >
                  <b className="block text-ink">Rahul Verma</b>
                  <span className="text-ink-muted text-[11px]">Analyst (15%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('field.learner@ikaaiindia.in', 'Learner@1234')}
                  className="p-2 rounded-element border border-line bg-bg-main text-left hover:border-brand-500 transition-colors"
                >
                  <b className="block text-ink">Ananya Sen</b>
                  <span className="text-ink-muted text-[11px]">Field (90% Exam)</span>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('instructor@ikaaiindia.in', 'Instructor@1234')}
                  className="p-2 rounded-element border border-line bg-bg-main text-left hover:border-brand-500 transition-colors"
                >
                  <b className="block text-ink">Dr. Vikram Mehta</b>
                  <span className="text-ink-muted text-[11px]">Instructor Lead</span>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('admin@ikaaiindia.in', 'Admin@1234')}
                  className="p-2 rounded-element border border-line bg-bg-main text-left hover:border-brand-500 transition-colors col-span-2 text-center"
                >
                  <b className="block text-ink">Deepak Joshi (Admin)</b>
                  <span className="text-ink-muted text-[11px]">People & Academy Director</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-line py-5 px-6 text-center text-xs text-ink-muted space-y-1">
        <p className="font-semibold text-brand-500 tracking-wide uppercase">
          An ISO 9001:2015 Certified Company
        </p>
        <p>© 2026 Ikaai India Research Pvt. Ltd. All rights reserved.</p>
      </footer>

      {/* Password Reset Modal */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your work email address. We will dispatch a secure, one-time link to reset your account password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <Input
              type="email"
              placeholder="name@ikaaiindia.in"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? 'Dispatching...' : 'Dispatch Reset Link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
