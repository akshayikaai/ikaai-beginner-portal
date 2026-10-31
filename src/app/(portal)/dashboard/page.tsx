import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, localStore } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle, Clock, FileText, Award } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || '';

  const enrolledProgrammes = await db.getUserEnrolledProgrammes(userId);
  const primaryProgramme = enrolledProgrammes[0] || (await db.getProgrammeBySlug('research'));

  // Calculate real metrics
  const progressSummary = await db.getProgressSummary(userId, primaryProgramme.id);
  const userQuizzes = localStore.quizSubmissions.filter((qs) => qs.userId === userId);
  const quizAvg =
    userQuizzes.length > 0
      ? Math.round(userQuizzes.reduce((acc, q) => acc + q.percentage, 0) / userQuizzes.length)
      : null;

  const examSub = localStore.examSubmissions.find((es) => es.userId === userId);

  // Find next action: first module with an incomplete resource
  let nextAction: {
    moduleId: string;
    moduleTitle: string;
    resourceTitle: string;
    resourceId: string;
  } | null = null;

  for (const mod of primaryProgramme.modules || []) {
    for (const res of mod.resources || []) {
      const isDone = localStore.resourceProgress.some(
        (rp) => rp.userId === userId && rp.resourceId === res.id && rp.completed
      );
      if (!isDone) {
        nextAction = {
          moduleId: mod.id,
          moduleTitle: mod.title,
          resourceTitle: res.title,
          resourceId: res.id,
        };
        break;
      }
    }
    if (nextAction) break;
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Hero Banner */}
      <div
        className="rounded-card border border-line p-6 md:p-8 text-white relative overflow-hidden shadow-card"
        style={{
          background: `linear-gradient(135deg, ${primaryProgramme.colorTag || '#00511E'} 0%, #12261A 100%)`,
        }}
      >
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md">
              {primaryProgramme.title} Programme
            </span>
            <span className="text-xs text-white/80">
              Department of {session?.user?.role === 'ADMIN' ? 'Administration' : primaryProgramme.title}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-heading font-bold text-white tracking-tight">
            Welcome, {session?.user?.name || 'Intern'}!
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-2xl font-normal leading-relaxed">
            {primaryProgramme.description}
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white" />
              <span>Overall Completion: <b>{progressSummary.percentage}%</b></span>
            </div>
            <span>•</span>
            <span>
              {progressSummary.completedCount} of {progressSummary.totalCount} milestones completed
            </span>
          </div>
        </div>
      </div>

      {/* Primary Next Action Card */}
      {nextAction ? (
        <Card className="border-2 border-brand-500/30 bg-brand-50/20 dark:bg-brand-50/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-brand-500">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Recommended Next Action
              </span>
            </div>
            <CardTitle className="text-lg">
              Continue: {nextAction.moduleTitle}
            </CardTitle>
            <CardDescription>
              Upcoming resource: <b>{nextAction.resourceTitle}</b> (includes reading countdown & verification).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link href={`/modules/${nextAction.moduleId}?res=${nextAction.resourceId}`}>
              <Button className="gap-2">
                Resume learning path
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-brand-500/40 bg-brand-50/20">
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-success-fill flex-none" />
            <div>
              <h3 className="font-heading font-bold text-base text-ink">
                All modules in {primaryProgramme.title} are completed!
              </h3>
              <p className="text-sm text-ink-muted">
                Proceed to the Written Exam or review your grade report.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-ink-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Milestones</span>
              <BookOpen className="h-4 w-4 text-brand-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {progressSummary.completedCount} / {progressSummary.totalCount}
            </CardTitle>
            <CardDescription>Resources & Quizzes</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ProgressBar value={progressSummary.percentage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-ink-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Quiz Average</span>
              <Award className="h-4 w-4 text-brand-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-success-fill">
              {quizAvg !== null ? `${quizAvg}%` : 'Pending'}
            </CardTitle>
            <CardDescription>
              {userQuizzes.length} quiz attempt{userQuizzes.length === 1 ? '' : 's'} recorded
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-ink-muted">Single-attempt strict scoring</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-ink-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Written Exam</span>
              <FileText className="h-4 w-4 text-brand-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {examSub ? (
                <span className="text-warning">Submitted</span>
              ) : (
                <span className="text-ink-muted">Not submitted</span>
              )}
            </CardTitle>
            <CardDescription>
              {examSub?.marks !== undefined && examSub?.marks !== null
                ? `Marks: ${examSub.marks} (Graded)`
                : 'Awaiting instructor review'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href={`/exam/${primaryProgramme.id}`}
              className="text-xs text-brand-500 hover:underline font-semibold"
            >
              View exam portal →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Programmes List */}
      <div className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-ink">
          Your Enrolled Programmes ({enrolledProgrammes.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrolledProgrammes.map((prog) => {
            return (
              <Card key={prog.id} className="hover:border-brand-500/50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{prog.title}</CardTitle>
                    <Badge dotColor={prog.colorTag}>Active</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{prog.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center pt-2 border-t border-line/60">
                  <span className="text-xs text-ink-muted">
                    {prog.modules?.length || 0} Modules
                  </span>
                  <Link
                    href={`/modules/${prog.modules?.[0]?.id || ''}`}
                    className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1"
                  >
                    Open Programme <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
