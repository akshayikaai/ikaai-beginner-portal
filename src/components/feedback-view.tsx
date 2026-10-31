'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Star,
  Send,
  MessageCircle,
  EyeOff,
  User,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

interface ProgrammeOption {
  id: string;
  title: string;
  colorTag: string;
  modules: { id: string; title: string }[];
}

interface FeedbackItem {
  id: string;
  programmeId: string;
  programmeTitle: string;
  moduleId?: string | null;
  moduleTitle?: string | null;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  authorName?: string | null;
  authorEmail?: string | null;
  date?: string;
  createdAt?: string | Date;
}

interface FeedbackViewProps {
  userRole: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
  programmes: ProgrammeOption[];
  myFeedback: FeedbackItem[];
  instructorFeedback?: FeedbackItem[];
  initialModuleTitle?: string;
}

export function FeedbackView({
  userRole,
  programmes,
  myFeedback: initialMyFeedback,
  instructorFeedback: initialInstructorFeedback = [],
  initialModuleTitle,
}: FeedbackViewProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<'submit' | 'history' | 'instructor'>(
    userRole === 'INSTRUCTOR' || userRole === 'ADMIN' ? 'instructor' : 'submit'
  );

  // Form State
  const [selectedProgId, setSelectedProgId] = React.useState<string>(
    programmes[0]?.id || 'prog-research'
  );
  const [selectedModuleId, setSelectedModuleId] = React.useState<string>('');
  const [rating, setRating] = React.useState<number>(5);
  const [comment, setComment] = React.useState<string>('');
  const [isAnonymous, setIsAnonymous] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Live feedback list states
  const [myFeedback, setMyFeedback] = React.useState<FeedbackItem[]>(initialMyFeedback);
  const [instructorFeedback, setInstructorFeedback] = React.useState<FeedbackItem[]>(
    initialInstructorFeedback
  );

  const selectedProg = programmes.find((p) => p.id === selectedProgId) || programmes[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please provide your feedback comment', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: selectedProgId,
          moduleId: selectedModuleId || null,
          rating,
          comment: comment.trim(),
          isAnonymous,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        showToast('Feedback submitted successfully! Thank you for helping us improve.', 'success');
        setComment('');
        // Add to local history list
        setMyFeedback((prev) => [
          {
            id: data.feedbackId,
            programmeId: selectedProgId,
            programmeTitle: selectedProg.title,
            moduleId: selectedModuleId || null,
            moduleTitle:
              selectedProg.modules.find((m) => m.id === selectedModuleId)?.title || null,
            rating,
            comment: comment.trim(),
            isAnonymous,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setActiveTab('history');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to submit feedback', 'error');
      }
    } catch {
      showToast('Network error submitting feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instructor metrics
  const avgRating =
    instructorFeedback.length > 0
      ? (
          instructorFeedback.reduce((sum, f) => sum + f.rating, 0) / instructorFeedback.length
        ).toFixed(1)
      : '5.0';

  const anonymousPercentage =
    instructorFeedback.length > 0
      ? Math.round(
          (instructorFeedback.filter((f) => f.isAnonymous).length / instructorFeedback.length) * 100
        )
      : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="default">Psychological Safety & Voice</Badge>
          <span className="text-xs text-ink-muted">Continuous Institutional Improvement</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">
          Feedback & Evaluation
        </h1>
        <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
          Share your candid reflections on curriculum quality, mentor guidance, and field operations.
        </p>
      </div>

      {/* DPDP Privacy Guarantee Banner */}
      <div className="p-4 rounded-card border border-brand-500/30 bg-brand-50/30 dark:bg-brand-50/10 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-brand-500 flex-none mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-500">
            DPDP Privacy & Non-Attribution Guarantee
          </h4>
          <p className="text-xs text-ink-muted leading-relaxed">
            When &ldquo;Submit anonymously&rdquo; is enabled, author fields are omitted by the API, and timestamps are truncated to <b>YYYY-MM-DD</b> without hours or minutes to prevent correlation with log files.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab('submit')}
          className={`px-4 py-2 text-xs font-semibold rounded-element transition-colors ${
            activeTab === 'submit'
              ? 'bg-brand-500 text-white'
              : 'text-ink-muted hover:text-ink hover:bg-brand-50/40'
          }`}
        >
          Submit Feedback
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-semibold rounded-element transition-colors ${
            activeTab === 'history'
              ? 'bg-brand-500 text-white'
              : 'text-ink-muted hover:text-ink hover:bg-brand-50/40'
          }`}
        >
          My Submissions ({myFeedback.length})
        </button>

        {(userRole === 'INSTRUCTOR' || userRole === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('instructor')}
            className={`px-4 py-2 text-xs font-semibold rounded-element transition-colors ${
              activeTab === 'instructor'
                ? 'bg-brand-500 text-white'
                : 'text-ink-muted hover:text-ink hover:bg-brand-50/40'
            }`}
          >
            Instructor Feedback Dashboard ({instructorFeedback.length})
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SUBMIT FEEDBACK FORM */}
      {/* ============================================================== */}
      {activeTab === 'submit' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Share Your Experience</CardTitle>
            <CardDescription>
              Your insights help mentors adjust pacing and clarify research methodologies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Programme & Module Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink block">
                    Programme
                  </label>
                  <select
                    value={selectedProgId}
                    onChange={(e) => {
                      setSelectedProgId(e.target.value);
                      setSelectedModuleId('');
                    }}
                    className="w-full p-2.5 rounded-element border border-line bg-bg-main text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink block">
                    Module (Optional)
                  </label>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    className="w-full p-2.5 rounded-element border border-line bg-bg-main text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">General Programme Feedback</option>
                    {selectedProg?.modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5-Star Rating */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink block">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 rounded hover:scale-110 transition-transform focus:outline-none"
                      title={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= rating
                            ? 'text-warning fill-warning'
                            : 'text-line text-opacity-80'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-ink-muted font-medium ml-2">
                    {rating === 5 && 'Excellent • Exceeds expectations'}
                    {rating === 4 && 'Good • Solid learning experience'}
                    {rating === 3 && 'Average • Met basic expectations'}
                    {rating === 2 && 'Needs Improvement'}
                    {rating === 1 && 'Unsatisfactory'}
                  </span>
                </div>
              </div>

              {/* Comment Textarea with 2000-char counter */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Feedback & Comments
                  </label>
                  <span className="text-[11px] text-ink-muted">
                    {comment.length} / 2000 characters
                  </span>
                </div>
                <Textarea
                  rows={5}
                  maxLength={2000}
                  placeholder="What worked well? What could be clearer or more structured in the field instructions?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="text-xs leading-relaxed"
                />
              </div>

              {/* Anonymous Checkbox Toggle */}
              <div className="p-3.5 rounded-element border border-line bg-bg-main flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="anonymous-toggle"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-brand-500 focus:ring-brand-500 cursor-pointer"
                />
                <label htmlFor="anonymous-toggle" className="text-xs text-ink cursor-pointer space-y-0.5">
                  <span className="font-semibold block flex items-center gap-1.5">
                    <EyeOff className="h-3.5 w-3.5 text-brand-500" />
                    Submit Anonymously (Recommended)
                  </span>
                  <span className="text-ink-muted block text-[11px] leading-relaxed">
                    Your name and email will be stripped before instructors or mentors view this entry.
                  </span>
                </label>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Submitting securely...' : 'Submit feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MY SUBMISSIONS HISTORY */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-heading font-semibold text-ink">
              Your Feedback History
            </h2>
            <span className="text-xs text-ink-muted">
              {myFeedback.length} submission{myFeedback.length === 1 ? '' : 's'}
            </span>
          </div>

          {myFeedback.map((fb) => (
            <Card key={fb.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{fb.programmeTitle}</Badge>
                    {fb.moduleTitle && (
                      <span className="text-xs text-ink-muted truncate max-w-xs">
                        {fb.moduleTitle}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= fb.rating
                            ? 'text-warning fill-warning'
                            : 'text-line'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-ink leading-relaxed pt-1 whitespace-pre-wrap">
                  {fb.comment}
                </p>

                <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    {fb.isAnonymous ? (
                      <>
                        <EyeOff className="h-3 w-3 text-brand-500" /> Submitted anonymously
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" /> Submitted with profile name
                      </>
                    )}
                  </span>
                  <span>{new Date(fb.createdAt || '').toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {myFeedback.length === 0 && (
            <div className="p-8 text-center text-sm text-ink-muted rounded-element border border-dashed border-line">
              You haven&apos;t submitted any feedback yet.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: INSTRUCTOR FEEDBACK DASHBOARD */}
      {/* ============================================================== */}
      {activeTab === 'instructor' && (
        <div className="space-y-6">
          {/* Aggregate Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Rating</CardDescription>
                <CardTitle className="text-3xl text-warning flex items-center gap-2">
                  <Star className="h-7 w-7 fill-warning" />
                  {avgRating} <span className="text-xs text-ink-muted font-normal">/ 5.0</span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Feedback Received</CardDescription>
                <CardTitle className="text-3xl text-brand-500">
                  {instructorFeedback.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Anonymous Submissions</CardDescription>
                <CardTitle className="text-3xl text-ink">
                  {anonymousPercentage}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Feedback Feed */}
          <div className="space-y-3">
            <h2 className="text-base font-heading font-semibold text-ink">
              Cohort Reflections & Student Evaluations
            </h2>

            {instructorFeedback.map((fb) => (
              <Card key={fb.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{fb.programmeTitle}</Badge>
                      {fb.moduleTitle && (
                        <span className="text-xs text-ink-muted">{fb.moduleTitle}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= fb.rating ? 'text-warning fill-warning' : 'text-line'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-ink-muted">({fb.rating}/5)</span>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    &ldquo;{fb.comment}&rdquo;
                  </p>

                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                    <div className="flex items-center gap-1.5">
                      {fb.isAnonymous ? (
                        <span className="flex items-center gap-1 text-brand-500 font-semibold">
                          <EyeOff className="h-3.5 w-3.5" /> Anonymous Intern
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-ink">
                          <User className="h-3.5 w-3.5" /> {fb.authorName} ({fb.authorEmail})
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="h-3 w-3" /> {fb.date}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {instructorFeedback.length === 0 && (
              <div className="p-8 text-center text-sm text-ink-muted rounded-element border border-dashed border-line">
                No feedback submitted yet for your assigned programmes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
