import type { Metadata } from 'next';
import { AllStage } from '@/components/all/AllStage';

export const metadata: Metadata = {
  title: 'EVERYTHING — the site, sized by what it costs you',
  description:
    'Every surface as one object. Node size is attention cost; the inner ring could ship, the outer ring exists to argue.',
};

/**
 * The index, built out of the audit rather than beside it.
 *
 * Size is cost, so the map cannot flatter the site — the fattest object on it
 * is the one that talks the most. And it measures itself, because an index that
 * exempted itself would be exactly what the page next door is about.
 */
export default function AllPage() {
  return (
    <main>
      <AllStage />
    </main>
  );
}
