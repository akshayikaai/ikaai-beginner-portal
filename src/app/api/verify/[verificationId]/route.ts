import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { verificationId: string } }
) {
  try {
    const { verificationId } = params;

    if (!verificationId) {
      return NextResponse.json(
        { valid: false, message: 'Verification ID required' },
        { status: 400 }
      );
    }

    const certData = await db.getCertificateByVerificationId(verificationId);

    if (!certData) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Certificate credential could not be verified in the Ikaai Academy registry.',
        },
        { status: 404 }
      );
    }

    // Explicitly guarantee NO email or private identifiers are returned
    return NextResponse.json({
      valid: true,
      credential: {
        certificateNo: certData.certificateNo,
        recipientName: certData.recipientName, // Snapshot persists after user anonymisation
        programmeTitle: certData.programmeTitle,
        finalGrade: certData.finalGrade,
        issuedAt: certData.issuedAt,
        verificationId: certData.verificationId,
        issuer: certData.issuer,
        accreditation: certData.accreditation,
        status: 'VERIFIED CREDENTIAL',
      },
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { valid: false, message: 'Internal server error during verification' },
      { status: 500 }
    );
  }
}
