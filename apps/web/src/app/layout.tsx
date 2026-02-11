import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
