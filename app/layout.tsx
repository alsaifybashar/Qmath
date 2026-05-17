import type { Metadata } from 'next';
import { Atkinson_Hyperlegible } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from './providers';

import { GlobalErrorLogger } from '@/components/GlobalErrorLogger';
import { FlashcardDock } from '@/components/flashcards/FlashcardDock';

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-sans',
  display: 'swap',
});

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
      <body className={atkinsonHyperlegible.variable}>
        <GlobalErrorLogger />
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
              {children}
              <FlashcardDock />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
