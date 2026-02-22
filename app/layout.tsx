import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Providers } from './providers';
import { GamificationProvider } from '@/components/gamification/GamificationProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Qmath | Adaptiv lärplattform för universitetsmatte',
  description: 'Bemästra universitetsmatte med AI-driven adaptivitet och personlig studieväg.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <GamificationProvider>
              <ThemeToggle />
              {children}
            </GamificationProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
