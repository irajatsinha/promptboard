import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PromptBoard - Simple, public, no-login prompt sharing',
  description: 'Share and discover the best prompts. No login required.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}