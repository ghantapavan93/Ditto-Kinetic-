import type { Metadata, Viewport } from 'next';
import { Anton, Archivo, Caveat, JetBrains_Mono } from 'next/font/google';
import './globals.css';

/**
 * Three typographic voices, as the brief specifies.
 *
 * EDITORIAL is split across two faces on purpose: Anton carries the poster
 * moments (WED 7:00 PM, THIS ONE) where the type has to behave like print, and
 * Archivo carries lowercase editorial copy where Anton would be shouting.
 * SYSTEM is JetBrains Mono. HUMAN NOTE is Caveat, and it never carries anything
 * a reader actually needs.
 */
const display = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' });
const editorial = Archivo({ subsets: ['latin'], variable: '--font-editorial', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const hand = Caveat({ subsets: ['latin'], variable: '--font-hand', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'FIRST SCENE — same two people, six ways to meet',
  description:
    'An unofficial Ditto interaction concept. The right person can still get the wrong first date. Drag through six openings and watch the same two people work — or not.',
  openGraph: {
    title: 'FIRST SCENE',
    description: 'Same two people. Different first moments. One finally feels right.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  other: {
    'format-detection': 'telephone=no',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090C',
  width: 'device-width',
  initialScale: 1,
  // The stage is a fixed viewport experience; pinch-zooming it produces a
  // broken composition rather than a bigger one.
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${editorial.variable} ${mono.variable} ${hand.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
