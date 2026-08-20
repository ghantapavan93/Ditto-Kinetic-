import type { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: 'THE APP — the same engine, in the shape it ships in',
  description:
    'Ditto, Where, You. The whole prototype as a phone application, including the scheduling step where four out of five matches stop.',
};

/**
 * The argument, as a product.
 *
 * Every other route here is a cinematic surface making one point at full size.
 * This is the same engine in the shape the real thing has — a phone, a waiting
 * state, three tabs — because the distance between a concept and something a
 * team can picture shipping is mostly this.
 */
export default function AppPage() {
  return (
    <main>
      <AppShell />
    </main>
  );
}
