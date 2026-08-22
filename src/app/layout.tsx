import type { Metadata, Viewport } from 'next';
import { Anton, Archivo, Caveat, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
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
const voice = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-voice',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'FIRST SCENE — same two people, six ways to meet',
  description:
    'A concept build for Ditto: the right person can still get the wrong first date. Drag through six openings and watch the same two people work — or not.',
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

/**
 * Where this site thinks it lives, for absolute og:image URLs.
 *
 * The old fallback was a bare localhost, so any deploy without
 * NEXT_PUBLIC_SITE_URL set unfurled its share card as
 * http://localhost:3000/opengraph-image -- a dead image in every Slack, DM and
 * tweet the link ever landed in. The README promises no environment variables
 * are required, so the platform's own host is read before giving up.
 */
function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.startsWith('http') ? explicit : `https://${explicit}`;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

export const viewport: Viewport = {
  themeColor: '#0B0907',
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
      className={`${display.variable} ${editorial.variable} ${voice.variable} ${mono.variable} ${hand.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
