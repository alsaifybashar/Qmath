import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from './providers';

import { GlobalErrorLogger } from '@/components/GlobalErrorLogger';
import { FlashcardDock } from '@/components/flashcards/FlashcardDock';
import { MotionPressFeedback } from '@/components/MotionPressFeedback';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Qmath | Adaptiv lärplattform för universitetsmatte',
  description: 'Bemästra universitetsmatte med AI-driven adaptivitet och personlig studieväg.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body>
        <GlobalErrorLogger />
        <MotionPressFeedback />
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
