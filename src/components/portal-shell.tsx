'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu,
  X,
  Check,
  FileText,
  MessageSquare,
  Megaphone,
  MessageCircle,
  Award,
  Settings,
  Mail,
  GraduationCap,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress';
import { useTheme } from '@/components/theme-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface ProgrammeData {
  id: string;
  slug: string;
  title: string;
  colorTag: string;
  modules: {
    id: string;
    title: string;
    resources: { id: string; title: string }[];
  }[];
}

interface PortalShellProps {
  programmes: ProgrammeData[];
  userEnrollments: { programmeId: string }[];
  initialProgress: Record<string, { completedCount: number; totalCount: number; percentage: number }>;
  userProgressRecords: Record<string, boolean>; // resourceId -> completed
  userQuizScores: Record<string, boolean>; // quizId -> completed
  hasConsented: boolean;
  children: React.ReactNode;
}

export function PortalShell({
  programmes,
  userEnrollments,
  initialProgress,
  userProgressRecords,
  userQuizScores,
  hasConsented,
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [expandedModules, setExpandedModules] = React.useState<Record<string, boolean>>({
    'mod-res-0': true,
    'mod-res-1': true,
  });

  // Current active programme selection
  const enrolledProgrammeIds = userEnrollments.map((e) => e.programmeId);
  const availableProgrammes = programmes.filter((p) =>
    session?.user?.role === 'ADMIN' ? true : enrolledProgrammeIds.includes(p.id)
  );

  const [selectedProgId, setSelectedProgId] = React.useState<string>(
    availableProgrammes[0]?.id || programmes[0]?.id || 'prog-research'
  );

  const currentProgramme = programmes.find((p) => p.id === selectedProgId) || programmes[0];
  const currentProgress = initialProgress[currentProgramme?.id] || { percentage: 0 };

  // DPDP Consent Dialog
  const [consentOpen, setConsentOpen] = React.useState(!hasConsented);
  const [consentLoading, setConsentLoading] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const consentedLocal = localStorage.getItem('ikaai-dpdp-consented');
      if (consentedLocal === 'true') {
        setConsentOpen(false);
      }
    }
  }, []);

  const handleAgreeConsent = async () => {
    setConsentLoading(true);
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'ONBOARDING_TRAINING_2026' }),
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('ikaai-dpdp-consented', 'true');
      }
      setConsentOpen(false);
      showToast('Consent registered. Welcome to Ikaai Academy!', 'success');
    } catch {
      showToast('Error recording consent', 'error');
    } finally {
      setConsentLoading(false);
    }
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'IK';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: GraduationCap },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/feedback', label: 'Feedback', icon: MessageCircle },
    { href: '/grades', label: 'Grade Report', icon: Award },
    {
      href: `/certificate/${currentProgramme?.id || 'prog-research'}`,
      label: 'Certificate',
      icon: Award,
    },
    ...(session?.user?.role === 'ADMIN'
      ? [{ href: '/admin/reports', label: 'Admin Workspace', icon: ShieldCheck }]
      : []),
    { href: '/settings', label: 'Account Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-ink flex flex-col md:grid md:grid-cols-[300px_1fr]">
      {/* Mobile Backdrop / Scrim */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Top Mobile Bar */}
      <div className="sticky top-0 z-30 flex md:hidden items-center justify-between px-4 py-3 bg-bg-card border-b border-line">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-element text-ink-muted hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          <Image src="/logo.webp" alt="Logo" width={26} height={26} className="object-contain" />
          <span className="font-heading font-bold text-lg text-brand-500">
            ikaai <small className="text-xs font-sans text-ink-muted">Academy</small>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-ink-muted hover:text-brand-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-brand-50 text-brand-500 font-bold text-xs border border-line">
            {userInitials}
          </span>
        </div>
      </div>

      {/* Sidebar (Desktop Sticky / Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-10 h-screen w-[290px] md:w-[300px] bg-bg-card border-r border-line p-5 flex flex-col gap-4 overflow-y-auto transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-element bg-brand-500 text-brand-on flex items-center justify-center font-heading font-bold shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl text-brand-500 tracking-tight leading-none block">
                ikaai <small className="font-sans font-medium text-xs text-ink-muted">Academy</small>
              </span>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1 text-ink-muted hover:text-ink md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Programme Selector with Department Tag */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Programme
          </label>
          <div className="relative">
            <select
              value={selectedProgId}
              onChange={(e) => setSelectedProgId(e.target.value)}
              aria-label="Select Enrolled Programme"
              className="w-full h-11 appearance-none rounded-element border border-line bg-bg-main px-3 py-2 text-sm text-ink pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {availableProgrammes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full inline-block"
                style={{ backgroundColor: currentProgramme?.colorTag || '#00511E' }}
                aria-hidden="true"
              />
              <ChevronDown className="h-4 w-4 opacity-60 text-ink" />
            </div>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="space-y-1.5 p-3 rounded-element bg-bg-main border border-line">
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-muted font-medium">Programme Completion</span>
            <span className="font-bold text-brand-500">{currentProgress.percentage}%</span>
          </div>
          <ProgressBar value={currentProgress.percentage} indicatorColor={currentProgramme?.colorTag} />
        </div>

        {/* Module Tree Navigation */}
        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block px-1">
            Learning Path
          </span>

          {currentProgramme?.modules?.map((mod, modIdx) => {
            const isExpanded = expandedModules[mod.id];
            const isModActive = pathname.includes(`/modules/${mod.id}`);

            return (
              <div key={mod.id} className="border border-line rounded-element overflow-hidden bg-bg-main/60">
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={`w-full flex items-center justify-between p-2.5 text-left text-xs font-semibold transition-colors min-h-[44px] ${
                    isModActive ? 'bg-brand-500 text-brand-on' : 'text-ink hover:bg-brand-50/50'
                  }`}
                >
                  <span className="truncate flex-1 pr-2">
                    {modIdx}. {mod.title}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    } ${isModActive ? 'text-white' : 'text-ink-muted'}`}
                  />
                </button>

                {isExpanded && (
                  <div className="p-2 space-y-1 bg-bg-card border-t border-line">
                    <Link
                      href={`/modules/${mod.id}`}
                      onClick={() => setDrawerOpen(false)}
                      className="block px-2 py-1.5 rounded text-xs font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-50/10 truncate"
                    >
                      Overview & Quiz
                    </Link>
                    {mod.resources?.map((res, resIdx) => {
                      const isDone = userProgressRecords[res.id];
                      return (
                        <Link
                          key={res.id}
                          href={`/modules/${mod.id}?res=${res.id}`}
                          onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-ink-muted hover:text-ink hover:bg-bg-main transition-colors truncate"
                        >
                          {isDone ? (
                            <Check className="h-3.5 w-3.5 text-success-fill flex-none" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 flex-none opacity-60" />
                          )}
                          <span className="truncate">
                            {modIdx}.{resIdx + 1} {res.title}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Written Exam Entry */}
          <Link
            href={`/exam/${currentProgramme?.id}`}
            onClick={() => setDrawerOpen(false)}
            className={`w-full flex items-center gap-2 p-2.5 rounded-element border border-line text-xs font-semibold transition-colors min-h-[44px] ${
              pathname.includes('/exam')
                ? 'bg-brand-500 text-brand-on'
                : 'bg-bg-main text-ink hover:bg-brand-50/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Written Exam</span>
          </Link>
        </div>

        {/* Global Navigation Links */}
        <div className="pt-2 border-t border-line space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-element text-xs font-medium transition-colors min-h-[40px] ${
                  active
                    ? 'bg-brand-500 text-brand-on font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-bg-main'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            href="/chat?direct=instructor"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-element text-xs font-medium text-brand-500 bg-brand-50/50 hover:bg-brand-50 min-h-[40px]"
          >
            <Mail className="h-4 w-4" />
            <span>Message Instructor</span>
          </Link>
        </div>

        {/* User Card & Sign Out */}
        <div className="pt-2 border-t border-line flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="h-8 w-8 rounded-full bg-brand-50 text-brand-500 font-bold text-xs border border-line flex items-center justify-center flex-none">
              {userInitials}
            </span>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-ink block truncate leading-tight">
                {session?.user?.name || 'Ikaai Member'}
              </span>
              <span className="text-[10px] text-ink-muted block uppercase tracking-wider truncate">
                {session?.user?.role || 'Learner'}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 text-ink-muted hover:text-red-600 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {children}

        {/* Institutional Accreditation Footer */}
        <footer className="pt-12 pb-6 border-t border-line text-center space-y-1">
          <p className="font-semibold text-xs text-brand-500 tracking-wide uppercase">
            An ISO 9001:2015 Certified Company
          </p>
          <p className="text-xs text-ink-muted">
            © 2026 Ikaai India Research Pvt. Ltd. All rights reserved.
          </p>
        </footer>
      </main>

      {/* DPDP Consent Dialog Modal */}
      <Dialog open={consentOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-brand-500 mb-1">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                DPDP 2023 Consent Notice
              </span>
            </div>
            <DialogTitle>Training & Performance Data Processing</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Ikaai Academy processes your name, email, module progress, quiz scores, and written exam evaluations solely for institutional training, project assignment readiness, and ISO 9001:2015 accreditation verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-xs text-ink-muted border-y border-line/60">
            <p>• Data is retained in accordance with our training governance policy.</p>
            <p>• Anonymous feedback comments are severed from author identity for psychological safety.</p>
            <p>• Contact <b>grievance@ikaaiindia.in</b> for any data rights requests.</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleAgreeConsent} disabled={consentLoading} className="w-full">
              {consentLoading ? 'Logging Consent...' : 'Acknowledge & Continue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
