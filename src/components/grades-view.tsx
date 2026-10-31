'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Download,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';

interface ModuleGradeItem {
  moduleId: string;
  moduleTitle: string;
  sortOrder: number;
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
  } | null;
  submission?: {
    score: number;
    total: number;
    percentage: number;
    attemptNo: number;
    resetCount: number;
    submittedAt: string | Date;
  } | null;
}

interface ExamGradeItem {
  id: string;
  title: string;
  passingMarks: number;
  totalMaxMarks: number;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';
  marks?: number | null;
  feedback?: string | null;
  submittedAt?: string | Date | null;
  gradedAt?: string | Date | null;
}

interface CohortStudentGrade {
  userId: string;
  name: string;
  email: string;
  programmeTitle: string;
  progressPercent: number;
  quizAverage: number | null;
  examStatus: string;
  examMarks?: number | null;
}

interface GradesViewProps {
  userRole: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
  programme: {
    id: string;
    title: string;
    colorTag: string;
  };
  overallProgress: number;
  modules: ModuleGradeItem[];
  exam: ExamGradeItem | null;
  cohortGrades?: CohortStudentGrade[];
}

export function GradesView({
  userRole,
  programme,
  overallProgress,
  modules,
  exam,
  cohortGrades = [],
}: GradesViewProps) {
  const [activeTab, setActiveTab] = React.useState<'my-grades' | 'cohort'>(
    userRole === 'INSTRUCTOR' || userRole === 'ADMIN' ? 'cohort' : 'my-grades'
  );

  // Compute stats
  const gradedQuizzes = modules.filter((m) => m.submission);
  const quizAvg =
    gradedQuizzes.length > 0
      ? Math.round(
          gradedQuizzes.reduce((acc, m) => acc + (m.submission?.percentage || 0), 0) /
            gradedQuizzes.length
        )
      : null;

  const totalQuizzesCount = modules.filter((m) => m.quiz).length;
  const passedQuizzesCount = modules.filter(
    (m) =>
      m.submission &&
      m.quiz &&
      m.submission.percentage >= (m.quiz.passingScore || 70)
  ).length;

  const examPassed =
    exam?.status === 'GRADED' &&
    typeof exam.marks === 'number' &&
    Math.round((exam.marks / exam.totalMaxMarks) * 100) >= exam.passingMarks;

  // Certificate eligibility rule: 100% progress, all quizzes passed, exam passed
  const isEligibleForCertificate =
    overallProgress >= 100 &&
    passedQuizzesCount === totalQuizzesCount &&
    totalQuizzesCount > 0 &&
    examPassed;

  const getLetterGrade = (p: number) => {
    if (p >= 90) return 'A';
    if (p >= 80) return 'B';
    if (p >= 70) return 'C';
    return 'D';
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge dotColor={programme.colorTag}>{programme.title}</Badge>
            <span className="text-xs text-ink-muted">Academic Transcript & Evaluation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-ink tracking-tight">
            Gradebook & Competency Report
          </h1>
          <p className="text-sm text-ink-muted">
            Formal evaluation record across module quizzes, written evaluations, and field readiness.
          </p>
        </div>

        {(userRole === 'INSTRUCTOR' || userRole === 'ADMIN') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cohort')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-element transition-colors ${
                activeTab === 'cohort'
                  ? 'bg-brand-500 text-white'
                  : 'text-ink-muted hover:text-ink hover:bg-brand-50/40 border border-line'
              }`}
            >
              Cohort Performance ({cohortGrades.length})
            </button>
            <button
              onClick={() => setActiveTab('my-grades')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-element transition-colors ${
                activeTab === 'my-grades'
                  ? 'bg-brand-500 text-white'
                  : 'text-ink-muted hover:text-ink hover:bg-brand-50/40 border border-line'
              }`}
            >
              Learner Transcript
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LEARNER TRANSCRIPT */}
      {/* ============================================================== */}
      {activeTab === 'my-grades' && (
        <div className="space-y-6">
          {/* Certificate Readiness Banner */}
          <div
            className={`p-5 rounded-card border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              isEligibleForCertificate
                ? 'border-success-fill bg-success-fill/10 text-ink'
                : 'border-line bg-bg-card'
            }`}
          >
            <div className="flex items-start gap-3">
              <Award
                className={`h-7 w-7 flex-none mt-0.5 ${
                  isEligibleForCertificate ? 'text-success-fill' : 'text-brand-500'
                }`}
              />
              <div>
                <h3 className="font-heading font-bold text-base text-ink">
                  {isEligibleForCertificate
                    ? '🎉 Certificate of Completion Ready!'
                    : 'Certificate Eligibility Status'}
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {isEligibleForCertificate
                    ? 'Congratulations! You have satisfied all 100% programme milestones, passed all module quizzes, and cleared the final examination.'
                    : 'To qualify for the verified institutional certificate: complete 100% of module resources, pass all quizzes, and achieve passing marks on the written exam.'}
                </p>
              </div>
            </div>

            <div className="flex-none">
              {isEligibleForCertificate ? (
                <Link href={`/verify/cert-${programme.id}`}>
                  <Button className="gap-2 bg-success-fill hover:bg-success-fill/90">
                    <ShieldCheck className="h-4 w-4" />
                    View & Verify Certificate
                  </Button>
                </Link>
              ) : (
                <Badge variant="outline" className="text-xs font-medium py-1">
                  In Progress ({overallProgress}%)
                </Badge>
              )}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Programme Completion</CardDescription>
                <CardTitle className="text-3xl text-brand-500">
                  {overallProgress}%
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ProgressBar value={overallProgress} indicatorColor={programme.colorTag} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Quiz Average (Single-Attempt)</CardDescription>
                <CardTitle className="text-3xl text-success-fill">
                  {quizAvg !== null ? `${quizAvg}%` : 'Pending'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-xs text-ink-muted">
                  {passedQuizzesCount} of {totalQuizzesCount} quizzes passed
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Written Examination</CardDescription>
                <CardTitle className="text-2xl text-ink">
                  {exam?.status === 'GRADED' ? (
                    <span className={examPassed ? 'text-success-fill' : 'text-danger'}>
                      {exam.marks} / {exam.totalMaxMarks} ({Math.round(((exam.marks || 0) / exam.totalMaxMarks) * 100)}%)
                    </span>
                  ) : exam?.status === 'SUBMITTED' ? (
                    <span className="text-warning">Under Review</span>
                  ) : (
                    <span className="text-ink-muted">Not Submitted</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={`/exam/${programme.id}`}
                  className="text-xs text-brand-500 hover:underline font-semibold flex items-center gap-1"
                >
                  {exam?.status === 'NOT_SUBMITTED' ? 'Start Exam' : 'Review Exam Portal'}{' '}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Module Quiz Breakdown Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-brand-500">
                <Award className="h-5 w-5" />
                <CardTitle className="text-lg">Module Quizzes Breakdown</CardTitle>
              </div>
              <CardDescription>
                Individual scores, attempt history, and letter grade classifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-y border-line bg-bg-main text-ink-muted">
                      <th className="p-3.5 pl-6 font-semibold uppercase tracking-wider">Module</th>
                      <th className="p-3.5 font-semibold uppercase tracking-wider">Passing Target</th>
                      <th className="p-3.5 font-semibold uppercase tracking-wider">Score</th>
                      <th className="p-3.5 font-semibold uppercase tracking-wider">Grade</th>
                      <th className="p-3.5 font-semibold uppercase tracking-wider">Attempts</th>
                      <th className="p-3.5 pr-6 font-semibold uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {modules.map((m, idx) => {
                      const sub = m.submission;
                      const hasPassed =
                        sub && m.quiz && sub.percentage >= (m.quiz.passingScore || 70);

                      return (
                        <tr key={m.moduleId} className="hover:bg-brand-50/20 transition-colors">
                          <td className="p-3.5 pl-6 font-medium text-ink">
                            <span className="text-ink-muted block text-[11px]">
                              Module {idx}
                            </span>
                            {m.moduleTitle}
                          </td>

                          <td className="p-3.5 text-ink-muted">
                            {m.quiz ? `${m.quiz.passingScore}%` : 'N/A'}
                          </td>

                          <td className="p-3.5">
                            {sub ? (
                              <b className={hasPassed ? 'text-success-fill' : 'text-danger'}>
                                {sub.score} / {sub.total} ({sub.percentage}%)
                              </b>
                            ) : (
                              <span className="text-ink-muted">Not taken</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {sub ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  hasPassed
                                    ? 'bg-success-fill/15 text-success-fill'
                                    : 'bg-danger/15 text-danger'
                                }`}
                              >
                                Grade {getLetterGrade(sub.percentage)}
                              </span>
                            ) : (
                              <span className="text-ink-muted">—</span>
                            )}
                          </td>

                          <td className="p-3.5 text-ink-muted">
                            {sub ? (
                              <span>
                                Attempt {sub.attemptNo}{' '}
                                {sub.resetCount > 0 && (
                                  <span className="text-brand-500 font-semibold">
                                    (Reset: {sub.resetCount})
                                  </span>
                                )}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>

                          <td className="p-3.5 pr-6 text-right">
                            <Link
                              href={`/modules/${m.moduleId}`}
                              className="text-xs text-brand-500 hover:underline font-semibold"
                            >
                              Open module →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: INSTRUCTOR COHORT OVERVIEW */}
      {/* ============================================================== */}
      {activeTab === 'cohort' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-brand-500">
              <Users className="h-5 w-5" />
              <CardTitle className="text-lg">Cohort Evaluation Roster</CardTitle>
            </div>
            <CardDescription>
              Comprehensive performance monitoring across enrolled interns.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-y border-line bg-bg-main text-ink-muted">
                    <th className="p-3.5 pl-6 font-semibold uppercase tracking-wider">Learner</th>
                    <th className="p-3.5 font-semibold uppercase tracking-wider">Programme</th>
                    <th className="p-3.5 font-semibold uppercase tracking-wider">Milestone Progress</th>
                    <th className="p-3.5 font-semibold uppercase tracking-wider">Quiz Average</th>
                    <th className="p-3.5 font-semibold uppercase tracking-wider">Written Exam</th>
                    <th className="p-3.5 pr-6 font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {cohortGrades.map((student) => (
                    <tr key={student.userId} className="hover:bg-brand-50/20 transition-colors">
                      <td className="p-3.5 pl-6 font-medium text-ink">
                        <b>{student.name}</b>
                        <span className="text-[11px] text-ink-muted block">{student.email}</span>
                      </td>

                      <td className="p-3.5 text-ink-muted font-medium">
                        {student.programmeTitle}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[11px] text-ink-muted font-semibold">
                            <span>{student.progressPercent}%</span>
                          </div>
                          <ProgressBar value={student.progressPercent} />
                        </div>
                      </td>

                      <td className="p-3.5">
                        {student.quizAverage !== null ? (
                          <b className="text-success-fill">{student.quizAverage}%</b>
                        ) : (
                          <span className="text-ink-muted">Pending</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <Badge
                          variant={
                            student.examStatus === 'GRADED'
                              ? 'success'
                              : student.examStatus === 'SUBMITTED'
                              ? 'warning'
                              : 'outline'
                          }
                        >
                          {student.examStatus === 'GRADED'
                            ? `Marks: ${student.examMarks}`
                            : student.examStatus === 'SUBMITTED'
                            ? 'Needs Grading'
                            : 'Not Submitted'}
                        </Badge>
                      </td>

                      <td className="p-3.5 pr-6 text-right">
                        <Link
                          href={`/exam/${programme.id}`}
                          className="text-xs text-brand-500 hover:underline font-semibold"
                        >
                          Evaluate →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
