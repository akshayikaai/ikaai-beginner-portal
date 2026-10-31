import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import {
  ShieldCheck,
  Award,
  CheckCircle,
  AlertTriangle,
  Building,
  Calendar,
  FileCheck,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface VerifyPageProps {
  params: {
    verificationId: string;
  };
}

export const metadata = {
  title: 'Public Credential Verification | Ikaai Academy',
  description:
    'Official public credential authenticity registry for Ikaai India Research Pvt. Ltd. certificates.',
};

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { verificationId } = params;
  const certData = await db.getCertificateByVerificationId(verificationId);

  return (
    <div className="min-h-screen bg-bg-main text-ink flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-line bg-bg-card py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.webp" alt="Ikaai Logo" width={32} height={32} className="object-contain" />
          <div>
            <span className="font-heading font-black text-xl tracking-tight text-brand-500 block leading-tight">
              ikaai <small className="font-sans font-medium text-xs text-ink-muted">Academy</small>
            </span>
            <span className="text-[10px] text-ink-muted block uppercase tracking-wider font-semibold">
              Public Credential Registry
            </span>
          </div>
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-element bg-bg-main hover:bg-line border border-line text-xs font-semibold text-ink transition-colors min-h-[40px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Portal Login</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 my-auto space-y-6">
        {certData ? (
          <div className="space-y-6 animate-fade-in">
            {/* Verified Header Banner */}
            <div className="p-6 rounded-element bg-surface-brand border-2 border-brand-500 shadow-sm flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="h-14 w-14 rounded-full bg-brand-500 text-white flex items-center justify-center flex-none shadow-md">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500 text-brand-on text-[11px] font-bold tracking-wide uppercase">
                  <CheckCircle className="h-3 w-3" />
                  <span>Officially Verified Credential</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold font-heading text-brand-900 dark:text-brand-100">
                  Valid Certificate of Competency
                </h1>
                <p className="text-xs text-brand-700 dark:text-brand-300">
                  This credential was authenticated against the official registry of Ikaai India Research Pvt. Ltd.
                </p>
              </div>
            </div>

            {/* Credential Data Card */}
            <div className="bg-bg-card border border-line rounded-element overflow-hidden shadow-sm divide-y divide-line">
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                    Recipient Name
                  </span>
                  <p className="text-2xl font-bold font-heading text-ink tracking-tight mt-0.5">
                    {certData.recipientName}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Historical credential snapshot recorded at time of graduation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                      Programme Title
                    </span>
                    <p className="text-sm font-bold text-ink mt-0.5 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-brand-500" />
                      <span>{certData.programmeTitle}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                      Academic Standing
                    </span>
                    <p className="text-sm font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                      {certData.finalGrade}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                      Certificate Serial Number
                    </span>
                    <p className="text-sm font-mono font-semibold text-ink mt-0.5 flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-brand-500" />
                      <span>{certData.certificateNo}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                      Date of Issuance
                    </span>
                    <p className="text-sm font-semibold text-ink mt-0.5 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-brand-500" />
                      <span>
                        {new Date(certData.issuedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Issuing Authority & Accreditation */}
              <div className="p-6 bg-bg-main/50 space-y-3">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                  Issuing Organisation & Accreditation
                </span>
                <div className="space-y-1.5 text-xs text-ink">
                  <p className="font-bold flex items-center gap-2">
                    <Building className="h-4 w-4 text-brand-500" />
                    <span>{certData.issuer}</span>
                  </p>
                  <p className="text-ink-muted pl-6">{certData.accreditation}</p>
                  <p className="text-[11px] text-ink-muted pl-6">
                    Corporate Identity: U74999DL2018PTC333454 • New Delhi, India
                  </p>
                </div>
              </div>

              {/* Privacy Notice under DPDP Act 2023 */}
              <div className="p-4 bg-brand-50/40 dark:bg-brand-950/20 text-xs text-ink-muted flex items-center gap-3">
                <Lock className="h-4 w-4 text-brand-500 flex-none" />
                <p>
                  <strong>DPDP Act 2023 Compliance:</strong> Personal email addresses and contact information
                  are cryptographically omitted from public registry records to protect privacy.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Invalid / Not Found State */
          <div className="p-8 rounded-element bg-bg-card border border-line text-center space-y-4 animate-fade-in shadow-sm">
            <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h1 className="text-xl font-bold font-heading text-ink">
                Credential Not Found
              </h1>
              <p className="text-sm text-ink-muted">
                No active certificate matching token <code className="font-mono text-brand-500 font-bold">{verificationId}</code> was found in the official registry.
              </p>
            </div>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Please verify that the link or verification identifier was copied accurately from the original document.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-6 text-center text-xs text-ink-muted space-y-1">
        <p className="font-semibold text-brand-500 tracking-wide uppercase">
          An ISO 9001:2015 Certified Company
        </p>
        <p>© 2026 Ikaai India Research Pvt. Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
