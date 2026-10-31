'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  Check,
  Maximize2,
  Minimize2,
  HelpCircle,
  MessageCircle,
  X,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ResourceItem {
  id: string;
  title: string;
  type: 'PDF' | 'DOCUMENT' | 'IMAGE' | 'VIDEO';
  url: string;
  readingTime: number;
  summary?: string;
  contentHtml?: string;
}

interface QuestionItem {
  id: string;
  question: string;
  options: string[];
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ModuleViewProps {
  programme: {
    id: string;
    slug: string;
    title: string;
    description: string;
    colorTag: string;
    modules: { id: string; title: string }[];
  };
  moduleIndex: number;
  currentModule: {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    resources: ResourceItem[];
    quiz?: {
      id: string;
      title: string;
      instructions: string;
      passingScore: number;
      questions: QuestionItem[];
    };
    faqs: FAQItem[];
  };
  initialProgress: {
    completedResources: Record<string, boolean>;
    quizSubmission?: {
      score: number;
      total: number;
      percentage: number;
    } | null;
    readFaqs: Record<string, boolean>;
  };
}

export function ModuleView({
  programme,
  moduleIndex,
  currentModule,
  initialProgress,
}: ModuleViewProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [showMoreDesc, setShowMoreDesc] = React.useState(false);
  const [completedResources, setCompletedResources] = React.useState<Record<string, boolean>>(
    initialProgress.completedResources || {}
  );
  const [quizScore, setQuizScore] = React.useState(initialProgress.quizSubmission || null);
  const [readFaqs, setReadFaqs] = React.useState<Record<string, boolean>>(
    initialProgress.readFaqs || {}
  );

  // Active open resource preview state
  const [openResourceId, setOpenResourceId] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [timerSeconds, setTimerSeconds] = React.useState<number>(30);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Quiz Modal State
  const [quizOpen, setQuizOpen] = React.useState(false);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, number>>({});
  const [quizSubmitting, setQuizSubmitting] = React.useState(false);

  // FAQs Accordion State
  const [openFaqId, setOpenFaqId] = React.useState<string | null>(null);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Calculate module completion stats
  const totalItems =
    currentModule.resources.length + (currentModule.quiz ? 1 : 0) + currentModule.faqs.length;

  const completedCount =
    currentModule.resources.filter((r) => completedResources[r.id]).length +
    (quizScore ? 1 : 0) +
    currentModule.faqs.filter((f) => readFaqs[f.id]).length;

  const modulePercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Grade calculator
  const getLetterGrade = (p: number) => {
    if (p >= 90) return 'A';
    if (p >= 80) return 'B';
    if (p >= 70) return 'C';
    return 'D';
  };

  // Open resource preview & start server timer
  const handleOpenResource = async (res: ResourceItem) => {
    if (openResourceId === res.id) {
      setOpenResourceId(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setOpenResourceId(res.id);
    setIsFullscreen(false);
    const readingDuration = res.readingTime || 30;
    setTimerSeconds(readingDuration);

    if (timerRef.current) clearInterval(timerRef.current);

    // Call server to record start time idempotently
    try {
      await fetch('/api/progress/resource/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: res.id }),
      });
    } catch {
      // Offline start
    }

    // Only start countdown if not already completed
    if (!completedResources[res.id]) {
      let remaining = readingDuration;
      timerRef.current = setInterval(async () => {
        remaining -= 1;
        setTimerSeconds(remaining);

        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);

          // Call server completion endpoint (server validates elapsed time)
          try {
            const resp = await fetch('/api/progress/resource/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resourceId: res.id }),
            });
            const data = await resp.json();

            if (resp.ok && data.completed) {
              setCompletedResources((prev) => ({ ...prev, [res.id]: true }));
              showToast(`Resource completed: ${res.title}`, 'success');
              router.refresh();
            } else {
              showToast(data.error || 'Timer verification incomplete', 'warning');
            }
          } catch {
            // Offline fallback
            setCompletedResources((prev) => ({ ...prev, [res.id]: true }));
            showToast(`Resource completed: ${res.title}`, 'success');
          }
        }
      }, 1000);
    }
  };

  const handleDownload = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    showToast(`Downloading: ${title}`, 'default');
  };

  const handleToggleFaq = async (faqId: string) => {
    setOpenFaqId((prev) => (prev === faqId ? null : faqId));

    if (!readFaqs[faqId]) {
      setReadFaqs((prev) => ({ ...prev, [faqId]: true }));
      try {
        await fetch('/api/progress/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faqId }),
        });
      } catch {
        // Offline
      }
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentModule.quiz) return;
    setQuizSubmitting(true);

    try {
      const resp = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: currentModule.quiz.id,
          answers: selectedAnswers,
        }),
      });

      const data = await resp.json();

      if (resp.ok) {
        setQuizScore({
          score: data.score,
          total: data.total,
          percentage: data.percentage,
        });
        setQuizOpen(false);
        showToast(data.message, 'success');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to submit quiz', 'error');
      }
    } catch {
      showToast('Network error submitting quiz', 'error');
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Previous and Next module links
  const prevModule = moduleIndex > 0 ? programme.modules[moduleIndex - 1] : null;
  const nextModule =
    moduleIndex < programme.modules.length - 1 ? programme.modules[moduleIndex + 1] : null;

  return (
    <div className="space-y-6 pb-24">
      {/* Programme Title & Show more / less */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge dotColor={programme.colorTag}>{programme.title}</Badge>
          <span className="text-xs text-ink-muted">Module {moduleIndex} of {programme.modules.length - 1}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">
          {programme.title}
        </h1>
        <p className="text-xs md:text-sm text-ink-muted max-w-3xl leading-relaxed">
          {showMoreDesc
            ? programme.description
            : `${programme.description.slice(0, 140)}... `}
          <button
            onClick={() => setShowMoreDesc(!showMoreDesc)}
            className="text-brand-500 font-semibold hover:underline ml-1"
          >
            {showMoreDesc ? 'Show less' : 'Show more'}
          </button>
        </p>
      </div>

      {/* Module Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                Module {moduleIndex}
              </span>
              <CardTitle className="text-xl md:text-2xl pt-1">
                {currentModule.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 sm:self-start">
              <span className="text-xs text-ink-muted font-medium">
                {quizScore ? (
                  <b className="text-success-fill">
                    Grade {getLetterGrade(quizScore.percentage)} ({quizScore.percentage}%)
                  </b>
                ) : (
                  'No grade yet'
                )}
              </span>
              <Link href={`/feedback?module=${encodeURIComponent(currentModule.title)}`}>
                <Button variant="outline" size="sm" className="gap-1.5 min-h-[36px] py-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Feedback
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-sm text-ink-muted mt-2 leading-relaxed">
            {currentModule.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-2">
              Learning Objectives
            </span>
            <ul className="space-y-1.5 text-sm text-ink-muted pl-4">
              {currentModule.objectives?.map((obj, idx) => (
                <li key={idx} className="list-disc leading-relaxed">
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-line space-y-1.5">
            <div className="flex justify-between items-center text-xs text-ink-muted font-medium">
              <span>
                {completedCount} of {totalItems} completed
              </span>
              <span className="font-bold text-brand-500">{modulePercent}%</span>
            </div>
            <ProgressBar value={modulePercent} indicatorColor={programme.colorTag} />
          </div>
        </CardContent>
      </Card>

      {/* Resources Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-500">
            <BookOpen className="h-5 w-5" />
            <CardTitle className="text-lg">Resources</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {currentModule.resources?.map((res, resIdx) => {
            const isCompleted = completedResources[res.id];
            const isOpen = openResourceId === res.id;

            return (
              <div key={res.id} className="space-y-2">
                {/* Resource Row */}
                <div
                  onClick={() => handleOpenResource(res)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenResource(res);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-element border transition-all cursor-pointer min-h-[52px] ${
                    isOpen
                      ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-50/10 shadow-sm'
                      : 'border-line bg-bg-main hover:bg-brand-50/20'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-brand-500 flex-none">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="text-left overflow-hidden">
                      <span className="text-sm font-semibold text-ink block truncate">
                        {moduleIndex}.{resIdx + 1} {res.title}
                      </span>
                      <span className="text-xs text-ink-muted block uppercase tracking-wider">
                        {res.type} • 30s Reading Duration
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-none pl-2">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, res.title)}
                      className="p-2 text-ink-muted hover:text-brand-500 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title="Download resource"
                      aria-label={`Download ${res.title}`}
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <div
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'border-success-fill bg-success-fill text-white'
                          : 'border-line text-transparent'
                      }`}
                      aria-label={isCompleted ? 'Completed' : 'Not completed'}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>

                {/* Inline Preview with Timer & Fullscreen */}
                {isOpen && (
                  <div className="rounded-element border border-line bg-bg-card overflow-hidden shadow-sm animate-in fade-in-50 duration-200">
                    <div
                      className={`p-6 bg-white dark:bg-[#12261A] text-ink overflow-y-auto font-sans leading-relaxed transition-all ${
                        isFullscreen ? 'h-[75vh]' : 'h-64'
                      }`}
                    >
                      <div className="border-b border-line pb-3 mb-4">
                        <b className="font-heading text-lg font-bold text-brand-500 block">
                          {res.title}
                        </b>
                        <span className="text-xs text-ink-muted">
                          Official Institutional Resource • Ikaai India Research Pvt. Ltd.
                        </span>
                      </div>

                      {res.contentHtml ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-ink leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: res.contentHtml }}
                        />
                      ) : (
                        <div className="space-y-3">
                          <p>{res.summary || 'Detailed document content preview.'}</p>
                          <div className="h-2.5 rounded bg-brand-50 w-full" />
                          <div className="h-2.5 rounded bg-brand-50 w-5/6" />
                          <div className="h-2.5 rounded bg-brand-50 w-4/6" />
                          <div className="h-2.5 rounded bg-brand-50 w-11/12" />
                        </div>
                      )}
                    </div>

                    {/* Preview Control Bar with Timer */}
                    <div className="px-4 py-3 bg-bg-main border-t border-line flex items-center justify-between text-xs text-ink-muted">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-brand-500" />
                        <span>
                          {isCompleted ? (
                            <b className="text-success-fill flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" /> Completed
                            </b>
                          ) : (
                            <span>
                              Keep reading • completes in <b>{timerSeconds}s</b>
                            </span>
                          )}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="gap-1.5 min-h-[36px]"
                      >
                        {isFullscreen ? (
                          <>
                            <Minimize2 className="h-3.5 w-3.5" />
                            Exit Fullscreen
                          </>
                        ) : (
                          <>
                            <Maximize2 className="h-3.5 w-3.5" />
                            Fullscreen
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Module Quiz Card */}
      {currentModule.quiz && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-brand-500">
              <Award className="h-5 w-5" />
              <CardTitle className="text-lg">Module Quiz</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-element border border-line bg-bg-main gap-4">
              <div className="space-y-1">
                <Badge variant={quizScore ? 'success' : 'default'}>
                  {quizScore ? 'Completed' : 'Single Attempt Quiz'}
                </Badge>
                <h3 className="font-heading font-bold text-base text-ink">
                  {currentModule.quiz.title}
                </h3>
                <p className="text-xs text-ink-muted">
                  Passing benchmark: {currentModule.quiz.passingScore}% • {currentModule.quiz.questions.length} questions
                </p>
              </div>

              <div>
                {quizScore ? (
                  <div className="text-right">
                    <span className="text-xs text-ink-muted block uppercase tracking-wider">
                      Your Score
                    </span>
                    <b className="text-2xl font-heading text-success-fill block leading-tight">
                      {quizScore.score} / {quizScore.total} ({quizScore.percentage}%)
                    </b>
                    <span className="text-[11px] text-ink-muted block">One attempt only</span>
                  </div>
                ) : (
                  <Button onClick={() => setQuizOpen(true)} className="w-full sm:w-auto">
                    Start quiz
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQs Section */}
      {currentModule.faqs?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-500">
                <HelpCircle className="h-5 w-5" />
                <CardTitle className="text-lg">Module FAQs</CardTitle>
              </div>
              <span className="text-xs text-ink-muted font-medium">
                {currentModule.faqs.filter((f) => readFaqs[f.id]).length} / {currentModule.faqs.length} read
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {currentModule.faqs.map((faq, idx) => {
              const isRead = readFaqs[faq.id];
              const isOpen = openFaqId === faq.id;

              return (
                <div
                  key={faq.id}
                  className="rounded-element border border-line bg-bg-main overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-3.5 text-left text-sm font-medium hover:bg-brand-50/30 transition-colors min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-brand-50 text-brand-500 text-xs font-bold flex items-center justify-center flex-none">
                        {idx + 1}
                      </span>
                      <span className="text-ink">{faq.question}</span>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center flex-none transition-colors ${
                        isRead
                          ? 'border-success-fill bg-success-fill text-white'
                          : 'border-line text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-1 text-xs text-ink-muted border-t border-line/60 bg-bg-card leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Floating Bottom Navigation Bar (Previous / Next module) */}
      <div className="fixed bottom-0 left-0 md:left-[300px] right-0 p-4 bg-gradient-to-t from-bg-main via-bg-main/90 to-transparent pointer-events-none z-20 flex justify-between items-center max-w-5xl mx-auto">
        {prevModule ? (
          <Link href={`/modules/${prevModule.id}`} className="pointer-events-auto">
            <Button variant="outline" className="gap-2 shadow-floating bg-bg-card">
              <ChevronLeft className="h-4 w-4" />
              Previous module
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {nextModule ? (
          <Link href={`/modules/${nextModule.id}`} className="pointer-events-auto">
            <Button className="gap-2 shadow-floating">
              Next module
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href={`/exam/${programme.id}`} className="pointer-events-auto">
            <Button className="gap-2 shadow-floating">
              Proceed to Written Exam
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Quiz Modal */}
      {currentModule.quiz && (
        <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>{currentModule.quiz.title}</DialogTitle>
              </div>
              <DialogDescription>
                One attempt only. Please read each question carefully before submitting your final answers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto pr-1">
              {currentModule.quiz.questions.map((q, qIdx) => (
                <div key={q.id} className="space-y-2 border-b border-line pb-4 last:border-b-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-500 block">
                    Question {qIdx + 1}
                  </span>
                  <p className="text-sm font-medium text-ink leading-relaxed">{q.question}</p>

                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-element border text-xs cursor-pointer transition-colors ${
                          selectedAnswers[q.id] === optIdx
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-50/20 text-ink font-semibold'
                            : 'border-line bg-bg-main text-ink hover:bg-brand-50/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={selectedAnswers[q.id] === optIdx}
                          onChange={() =>
                            setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                          }
                          className="text-brand-500 focus:ring-brand-500 h-4 w-4"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button variant="outline" onClick={() => setQuizOpen(false)} disabled={quizSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmitQuiz} disabled={quizSubmitting}>
                {quizSubmitting ? 'Evaluating on server...' : 'Submit quiz'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
