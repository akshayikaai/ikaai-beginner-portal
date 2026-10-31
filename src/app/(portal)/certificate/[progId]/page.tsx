import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db, localStore } from '@/lib/db';
import { CertificateView } from '@/components/certificate-view';

interface CertificatePageProps {
  params: {
    progId: string;
  };
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const { progId } = params;
  const programme = await db.getProgrammeBySlug(progId);
  if (!programme) {
    notFound();
  }

  const certificate = await db.getCertificate(session.user.id, programme.id);
  const eligibility = await db.checkEligibility(session.user.id, programme.id);

  return (
    <CertificateView
      initialCertificate={
        certificate
          ? {
              id: certificate.id,
              certificateNo: certificate.certificateNo,
              recipientName: certificate.recipientName,
              programmeId: certificate.programmeId,
              issuedAt: certificate.issuedAt.toISOString(),
              finalGrade: certificate.finalGrade,
              verificationId: certificate.verificationId,
            }
          : null
      }
      initialEligibility={eligibility as any}
      programme={{
        id: programme.id,
        title: programme.title,
        description: programme.description,
        colorTag: programme.colorTag,
      }}
      userRole={session.user.role}
    />
  );
}
