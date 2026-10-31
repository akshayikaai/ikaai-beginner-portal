import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Ikaai Academy — Role-Based Learning & Onboarding Portal',
  description:
    'Institutional onboarding and training portal for interns and researchers at Ikaai India Research Pvt. Ltd. Transforming insight from ground to boardroom.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
