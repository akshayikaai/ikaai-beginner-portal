'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  Clock,
  Award,
  AlertCircle,
  Send,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ExamQuestionItem {
  id: string;
  question: string;
  maxMarks: number;
  sortOrder: number;
}

interface SubmissionRecord {
  id: string;
  userId: string;
  studentName?: string;
  studentEmail?: string;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';
  answersJson: Record<string, string>;
  marks?: number | null;
  totalMaxMarks?: number;
  feedback?: string | null;
  submittedAt: string | Date;
  gradedAt?: string | Date | null;
}

interface ExamViewProps {
  userRole: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
  currentUserId: string;
  programme: {
    id: string;
    slug: string;
    title: string;
    colorTag: string;
  };
  writtenExam: {
    id: string;
    title: string;
    instructions: string;
    passingMarks: number;
    questions: ExamQuestionItem[];
  };
  userSubmission: SubmissionRecord | null;
  cohortSubmissions?: SubmissionRecord[];
}

export function ExamView({
  userRole,
  currentUserId,
  programme,
  writtenExam,
  userSubmission,
  cohortSubmissions = [],
}: ExamViewProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const totalMaxMarks = writtenExam.questions.reduce((sum, q) => sum + (q.maxMarks || 25), 0);

  // Learner form state
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [confirmSubmitOpen, setConfirmSubmitOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Instructor grading state
  const [selectedSubForGrading, setSelectedSubForGrading] = React.useState<SubmissionRecord | null>(null);
  const [gradeMarks, setGradeMarks] = React.useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = React.useState<string>('');
  const [isGrading, setIsGrading] = React.useState(false);

  // Handle Learner Submission
  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: writtenExam.id,
          answers,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setConfirmSubmitOpen(false);
        showToast('Exam submitted successfully for evaluation!', 'success');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to submit exam', 'error');
      }
    } catch {
      showToast('Network error submitting exam', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Instructor Grade Save
  const handleSaveGrade = async () => {
    if (!selectedSubForGrading) return;
    setIsGrading(true);

    try {
      const resp = await fetch('/api/exam/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubForGrading.id,
          marks: Number(gradeMarks),
          feedback: gradeFeedback,
        }),
      });

      const data = await resp.json();
      if (resp.ok) {
        setSelectedSubForGrading(null);
        showToast(`Grade recorded: ${data.marks} / ${data.totalMaxMarks} (${data.percentage}%)`, 'success');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to record grade', 'error');
      }
    } catch {
      showToast('Network error grading exam', 'error');
    } finally {
      setIsGrading(false);
    }
  };

  const isGraded = userSubmission?.status === 'GRADED';
  const isSubmitted = userSubmission && (userSubmission.status === 'SUBMITTED' || isGraded);
  const percentage =
    isGraded && typeof userSubmission?.marks === 'number'
      ? Math.round((userSubmission.marks / totalMaxMarks) * 100)
      : null;
  const passed = percentage !== null && percentage >= writtenExam.passingMarks;

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation Breadcrumb */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-brand-500 font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header Banner */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge dotColor={programme.colorTag}>{programme.title}</Badge>
          <Badge variant={isSubmitted ? 'success' : 'default'}>
            {userRole === 'LEARNER'
              ? isGraded
                ? `Graded: ${userSubmission?.marks}/${totalMaxMarks}`
                : isSubmitted
                ? 'Submitted (Under Review)'
                : 'Written Examination'
              : 'Instructor Evaluation Portal'}
          </Badge>
          <span className="text-xs text-ink-muted font-medium">
            Passing benchmark: {writtenExam.passingMarks}% ({Math.ceil((writtenExam.passingMarks / 100) * totalMaxMarks)}/{totalMaxMarks} marks)
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">
          {writtenExam.title}
        </h1>
        <p className="text-sm text-ink-muted max-w-3xl leading-relaxed">
          {writtenExam.instructions}
        </p>
      </div>

      {/* ============================================================== */}
      {/* LEARNER VIEW */}
      {/* ============================================================== */}
      {userRole === 'LEARNER' && (
        <>
          {/* Submission / Grade Status Banner */}
          {isSubmitted ? (
            <Card className="border-brand-500/30 bg-brand-50/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {isGraded ? (
                      <CheckCircle className="h-6 w-6 text-success-fill flex-none mt-0.5" />
                    ) : (
                      <Clock className="h-6 w-6 text-warning flex-none mt-0.5" />
                    )}
                    <div>
                      <h3 className="font-heading font-bold text-lg text-ink">
                        {isGraded
                          ? passed
                            ? 'Examination Passed!'
                            : 'Examination Review Complete'
                          : 'Answers Submitted for Review'}
                      </h3>
                      <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                        {isGraded
                          ? `Evaluated by your departmental instructor. Final score: ${userSubmission?.marks} of ${totalMaxMarks} marks (${percentage}%).`
                          : `Submitted on ${new Date(userSubmission.submittedAt).toLocaleDateString()} at ${new Date(userSubmission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Instructors evaluate methodology, citation quality, and practical field framing.`}
                      </p>
                    </div>
                  </div>

                  {isGraded && (
                    <div className="text-right flex-none p-3 rounded-element bg-white dark:bg-bg-card border border-line">
                      <span className="text-xs text-ink-muted block uppercase tracking-wider">Final Score</span>
                      <b className={`text-2xl font-heading ${passed ? 'text-success-fill' : 'text-danger'}`}>
                        {userSubmission?.marks} / {totalMaxMarks} ({percentage}%)
                      </b>
                      <Badge variant={passed ? 'success' : 'warning'} className="mt-1">
                        {passed ? 'Passed' : 'Needs Revision'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Qualitative Feedback Section */}
                {isGraded && userSubmission?.feedback && (
                  <div className="mt-4 pt-4 border-t border-line/60">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-500 block mb-1">
                      Instructor Qualitative Feedback
                    </span>
                    <p className="text-sm text-ink italic leading-relaxed bg-white/70 dark:bg-bg-card/70 p-3 rounded-element border border-line">
                      &ldquo;{userSubmission.feedback}&rdquo;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Exam Questions & Inputs */}
          <div className="space-y-6">
            {writtenExam.questions.map((q, idx) => {
              const currentAns = isSubmitted
                ? userSubmission?.answersJson?.[q.id] || ''
                : answers[q.id] || '';

              const wordCount = currentAns.trim() ? currentAns.trim().split(/\s+/).length : 0;

              return (
                <Card key={q.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                        Question {idx + 1}
                      </span>
                      <Badge variant="outline">{q.maxMarks} Marks</Badge>
                    </div>
                    <CardTitle className="text-base md:text-lg font-heading leading-relaxed pt-1">
                      {q.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Textarea
                      disabled={Boolean(isSubmitted)}
                      placeholder="Draft your detailed answer here. Structure your response with clear rationale and field research methodologies..."
                      rows={7}
                      value={currentAns}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="text-sm font-sans leading-relaxed"
                    />

                    <div className="flex justify-between items-center text-xs text-ink-muted pt-1">
                      <span>{wordCount} words</span>
                      {!isSubmitted && (
                        <span>Form auto-saves locally before final submission</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Submission Bar */}
          {!isSubmitted && (
            <div className="p-4 rounded-element bg-bg-card border border-line flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2 text-ink-muted text-xs">
                <AlertCircle className="h-4 w-4 text-brand-500 flex-none" />
                <span>Single submission policy. Verify answers thoroughly before submitting.</span>
              </div>

              <Button
                onClick={() => setConfirmSubmitOpen(true)}
                className="gap-2 w-full sm:w-auto"
                disabled={Object.keys(answers).length < writtenExam.questions.length}
              >
                <Send className="h-4 w-4" />
                Submit final exam
              </Button>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* INSTRUCTOR / ADMIN VIEW */}
      {/* ============================================================== */}
      {(userRole === 'INSTRUCTOR' || userRole === 'ADMIN') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-ink">
              Learner Submissions Queue ({cohortSubmissions.length})
            </h2>
            <span className="text-xs text-ink-muted">
              Select any learner to review answers, assign marks, and write qualitative feedback.
            </span>
          </div>

          <div className="space-y-3">
            {cohortSubmissions.map((sub) => {
              const subPassed =
                typeof sub.marks === 'number' &&
                (sub.marks / totalMaxMarks) * 100 >= writtenExam.passingMarks;

              return (
                <Card key={sub.id} className="hover:border-brand-500/50 transition-colors">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-base text-ink">
                          {sub.studentName}
                        </span>
                        <Badge variant={sub.status === 'GRADED' ? 'success' : 'warning'}>
                          {sub.status === 'GRADED' ? 'Graded' : 'Awaiting Review'}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-muted">
                        {sub.studentEmail} • Submitted on{' '}
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                      {sub.status === 'GRADED' && (
                        <p className="text-xs text-brand-500 font-medium">
                          Score: <b>{sub.marks} / {totalMaxMarks}</b> ({Math.round(((sub.marks || 0) / totalMaxMarks) * 100)}%) • {subPassed ? 'Passed' : 'Failed'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={sub.status === 'GRADED' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => {
                          setSelectedSubForGrading(sub);
                          setGradeMarks(sub.marks || 0);
                          setGradeFeedback(sub.feedback || '');
                        }}
                        className="gap-1.5"
                      >
                        <UserCheck className="h-4 w-4" />
                        {sub.status === 'GRADED' ? 'Update Grade' : 'Grade Submission'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {cohortSubmissions.length === 0 && (
              <div className="p-8 text-center text-sm text-ink-muted rounded-element border border-dashed border-line">
                No exam submissions received yet for this programme.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Learner Final Submit */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Exam Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your final written examination? Once submitted, your answers cannot be edited.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-element bg-warning/10 border border-warning/30 text-xs text-warning leading-relaxed">
            Please ensure you have answered all {writtenExam.questions.length} questions thoroughly.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitExam} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructor Grading Modal */}
      {selectedSubForGrading && (
        <Dialog open={Boolean(selectedSubForGrading)} onOpenChange={(open) => !open && setSelectedSubForGrading(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Evaluate Submission: {selectedSubForGrading.studentName}</DialogTitle>
              <DialogDescription>
                Review written responses and assign marks out of {totalMaxMarks}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {writtenExam.questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-element bg-bg-main border border-line space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
                      Question {idx + 1} ({q.maxMarks} Marks)
                    </span>
                  </div>
                  <p className="text-xs font-medium text-ink">{q.question}</p>
                  <div className="p-3 rounded bg-white dark:bg-bg-card border border-line text-xs font-sans text-ink leading-relaxed whitespace-pre-wrap">
                    {selectedSubForGrading.answersJson?.[q.id] || '(No response provided)'}
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-line space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink block mb-1">
                    Total Marks Assigned (0 to {totalMaxMarks})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalMaxMarks}
                    value={gradeMarks}
                    onChange={(e) => setGradeMarks(Number(e.target.value))}
                    className="w-full p-2.5 rounded-element border border-line bg-bg-main text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-[11px] text-ink-muted">
                    Passing benchmark is {writtenExam.passingMarks}% ({Math.ceil((writtenExam.passingMarks / 100) * totalMaxMarks)} marks).
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink block mb-1">
                    Qualitative Feedback & Methodological Review
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Provide constructive feedback on sampling, analytical rigor, and clarity..."
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button variant="outline" onClick={() => setSelectedSubForGrading(null)} disabled={isGrading}>
                Cancel
              </Button>
              <Button onClick={handleSaveGrade} disabled={isGrading}>
                {isGrading ? 'Saving Grade...' : 'Save Grade & Feedback'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
