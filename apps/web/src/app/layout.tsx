import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'EXPP - Exam Practice Platform',
  description: 'Adaptive exam practice and task management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
