'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  CheckCircle2,
  Clock,
  Printer,
  ExternalLink,
  Copy,
  AlertCircle,
  ShieldCheck,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CertificateData {
  id: string;
  certificateNo: string;
  recipientName: string;
  programmeId: string;
  issuedAt: string;
  finalGrade: string;
  verificationId: string;
}

interface EligibilityData {
  eligible: boolean;
  progress: {
    completedResources: number;
    totalResources: number;
    percentage: number;
    resourcesComplete: boolean;
  };
  quizzes: {
    passedQuizzes: number;
    totalQuizzes: number;
    quizzesComplete: boolean;
  };
  exam: {
    submitted: boolean;
    graded: boolean;
    marks: number | null;
    totalMarks: number;
    passingThreshold: number;
    passed: boolean;
  } | null;
}

interface CertificateViewProps {
  initialCertificate: CertificateData | null;
  initialEligibility: EligibilityData;
  programme: {
    id: string;
    title: string;
    description: string;
    colorTag: string;
  };
  userRole?: string;
}

export function CertificateView({
  initialCertificate,
  initialEligibility,
  programme,
  userRole,
}: CertificateViewProps) {
  const [certificate, setCertificate] = useState<CertificateData | null>(initialCertificate);
  const [eligibility, setEligibility] = useState<EligibilityData>(initialEligibility);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerateCertificate = async () => {
    setGenerating(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/certificate/${programme.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to issue certificate');
      }
      setCertificate(data.certificate);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error issuing certificate');
    } finally {
      setGenerating(false);
    }
  };

  const copyVerificationLink = () => {
    if (!certificate) return;
    const url = `${window.location.origin}/verify/${certificate.verificationId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${programme.colorTag}15`,
                color: programme.colorTag,
              }}
            >
              {programme.title}
            </span>
            <span className="text-xs text-ink-muted">Academic Credential & Verification</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-ink tracking-tight">
            Verified Certificate of Completion
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Officially accredited competency certification under ISO 9001:2015 institutional standards.
          </p>
        </div>

        {certificate && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-element bg-bg-card border border-line hover:border-brand-500 text-ink text-sm font-semibold transition-colors min-h-[44px]"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
            <Link
              href={`/verify/${certificate.verificationId}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-element bg-brand-500 hover:bg-brand-600 text-brand-on text-sm font-semibold transition-colors min-h-[44px]"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Verify Online</span>
            </Link>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-element bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-none" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Certificate Display or Eligibility Roadmap */}
      {certificate ? (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="p-4 rounded-element bg-surface-brand border border-brand-200 dark:border-brand-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-500 text-white flex items-center justify-center flex-none">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-900 dark:text-brand-100">
                  Verified Credential Issued
                </p>
                <p className="text-xs text-brand-700 dark:text-brand-300">
                  Verification Token:{' '}
                  <code className="font-mono font-semibold">{certificate.verificationId}</code>
                </p>
              </div>
            </div>

            <button
              onClick={copyVerificationLink}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-element bg-white dark:bg-bg-card border border-line text-xs font-semibold text-ink hover:text-brand-500 transition-colors min-h-[40px]"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? 'Link Copied!' : 'Copy Verification Link'}</span>
            </button>
          </div>

          {/* Printable Official Certificate Canvas */}
          <div className="print-certificate bg-white text-gray-900 p-8 md:p-14 rounded-2xl border-4 border-double border-brand-500 shadow-xl relative overflow-hidden">
            {/* Watermark / Seal Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Award className="h-[450px] w-[450px] text-brand-900" />
            </div>

            {/* Top Certificate Header */}
            <div className="text-center space-y-3 relative z-10">
              <div className="flex items-center justify-center gap-3">
                <Image src="/logo.webp" alt="Ikaai Logo" width={48} height={48} className="object-contain" />
                <div className="text-left">
                  <span className="font-heading font-black text-2xl tracking-tight text-brand-500 block leading-tight">
                    IKAAI INDIA
                  </span>
                  <span className="text-[10px] tracking-widest uppercase font-semibold text-gray-600 block">
                    Research & Consultancy Services
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold tracking-[0.25em] text-brand-600 uppercase">
                  Academy of Development Research & Analytics
                </span>
                <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-gray-900 tracking-tight mt-1">
                  CERTIFICATE OF COMPLETION
                </h2>
                <div className="w-24 h-1 bg-brand-500 mx-auto mt-2 rounded-full" />
              </div>
            </div>

            {/* Recipient Body */}
            <div className="text-center my-10 space-y-4 relative z-10">
              <p className="text-sm italic font-serif text-gray-600">This is to officially certify that</p>
              <p className="text-3xl md:text-4xl font-heading font-black text-brand-500 tracking-tight underline decoration-brand-200 underline-offset-8">
                {certificate.recipientName}
              </p>
              <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-700 leading-relaxed pt-2">
                has successfully fulfilled all curriculum requirements, continuous module assessments,
                and passed the final written evaluation with distinction in the specialised programme:
              </p>
              <div className="inline-block px-5 py-2 rounded-xl bg-brand-50 border border-brand-200">
                <p className="text-lg md:text-xl font-heading font-bold text-brand-800">
                  {programme.title} Programme
                </p>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pt-1">
                Final Assessment: <span className="text-brand-600 font-extrabold">{certificate.finalGrade}</span>
              </p>
            </div>

            {/* Signatures & Certification Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-gray-200 items-end text-center relative z-10">
              {/* Academic Director Signature */}
              <div className="space-y-1">
                <p className="font-serif italic text-lg text-gray-800 font-semibold">Dr. Vikram Mehta</p>
                <div className="w-40 h-[1.5px] bg-gray-400 mx-auto" />
                <p className="text-xs font-bold text-gray-800">Academic Director</p>
                <p className="text-[10px] text-gray-500">Ikaai Academy Division</p>
              </div>

              {/* Institutional Gold Seal */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="h-16 w-16 rounded-full bg-amber-50 border-2 border-amber-500 text-amber-700 flex items-center justify-center shadow-inner">
                  <Award className="h-9 w-9 text-amber-600" />
                </div>
                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Official Seal
                </span>
                <span className="text-[9px] text-gray-500 font-medium">ISO 9001:2015</span>
              </div>

              {/* Managing Director Signature */}
              <div className="space-y-1">
                <p className="font-serif italic text-lg text-gray-800 font-semibold">Deepak Joshi</p>
                <div className="w-40 h-[1.5px] bg-gray-400 mx-auto" />
                <p className="text-xs font-bold text-gray-800">Director, Operations</p>
                <p className="text-[10px] text-gray-500">Ikaai India Research Pvt. Ltd.</p>
              </div>
            </div>

            {/* Bottom Metadata & Legal Footnote */}
            <div className="mt-10 pt-4 border-t border-dashed border-gray-300 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-500 relative z-10 gap-2">
              <div>
                <p>
                  <strong className="text-gray-700">Certificate No:</strong> {certificate.certificateNo}
                </p>
                <p>
                  <strong className="text-gray-700">Issued On:</strong>{' '}
                  {new Date(certificate.issuedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="text-center md:text-right">
                <p className="font-semibold text-gray-700">
                  Verify credential: ikaaiindia.in/verify/{certificate.verificationId}
                </p>
                <p className="text-[10px] text-gray-400">
                  An ISO 9001:2015 Certified Company • Reg No. U74999DL2018PTC333454
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Qualification Progress & Eligibility Roadmap */
        <div className="space-y-6">
          <div className="p-6 rounded-element bg-bg-card border border-line space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold font-heading text-ink">
                  Certificate Eligibility Roadmap
                </h2>
                <p className="text-sm text-ink-muted">
                  To earn your verified institutional certificate, all three completion benchmarks must
                  be satisfied.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-500 font-bold text-xs">
                {eligibility.eligible ? 'Ready to Issue' : 'Requirements Pending'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Criterion 1: 100% Resource Completion */}
              <div
                className={`p-4 rounded-element border transition-colors ${
                  eligibility.progress.resourcesComplete
                    ? 'bg-surface-brand/50 border-brand-300 dark:border-brand-800'
                    : 'bg-bg-main border-line'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink-muted">1. Modules & Resources</span>
                  {eligibility.progress.resourcesComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xl font-bold font-heading text-ink">
                  {eligibility.progress.percentage}%
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {eligibility.progress.completedResources} of {eligibility.progress.totalResources}{' '}
                  resources completed
                </p>
              </div>

              {/* Criterion 2: Single-Attempt Quizzes */}
              <div
                className={`p-4 rounded-element border transition-colors ${
                  eligibility.quizzes.quizzesComplete
                    ? 'bg-surface-brand/50 border-brand-300 dark:border-brand-800'
                    : 'bg-bg-main border-line'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink-muted">2. Module Quizzes</span>
                  {eligibility.quizzes.quizzesComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xl font-bold font-heading text-ink">
                  {eligibility.quizzes.passedQuizzes} / {eligibility.quizzes.totalQuizzes} Passed
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {eligibility.quizzes.quizzesComplete
                    ? 'All quizzes passed (>= 70%)'
                    : 'Passing score >= 70% required'}
                </p>
              </div>

              {/* Criterion 3: Written Exam */}
              <div
                className={`p-4 rounded-element border transition-colors ${
                  eligibility.exam?.passed
                    ? 'bg-surface-brand/50 border-brand-300 dark:border-brand-800'
                    : 'bg-bg-main border-line'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink-muted">3. Written Evaluation</span>
                  {eligibility.exam?.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xl font-bold font-heading text-ink">
                  {eligibility.exam?.passed
                    ? `${eligibility.exam.marks} / ${eligibility.exam.totalMarks} Marks`
                    : eligibility.exam?.submitted
                    ? 'Under Review'
                    : 'Not Submitted'}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {eligibility.exam?.passed
                    ? 'Passed with distinction'
                    : `Requires >= ${eligibility.exam?.passingThreshold || 18} marks (60%)`}
                </p>
              </div>
            </div>

            {/* Issue Button */}
            <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-ink-muted">
                {eligibility.eligible
                  ? 'Congratulations! All qualification criteria have been verified. Click below to issue your credential.'
                  : 'Please complete all pending resources, quizzes, and written evaluations to unlock certification.'}
              </p>

              {eligibility.eligible ? (
                <button
                  onClick={handleGenerateCertificate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-element bg-brand-500 hover:bg-brand-600 text-brand-on font-semibold text-sm transition-colors min-h-[44px] disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{generating ? 'Issuing Certificate...' : 'Generate & Issue Certificate'}</span>
                </button>
              ) : (
                <Link
                  href={`/modules/${programme.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-element bg-bg-main hover:bg-line border border-line text-ink font-semibold text-xs transition-colors min-h-[44px]"
                >
                  <span>Continue Learning Path</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
