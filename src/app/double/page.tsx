import type { Metadata } from 'next';
import { DoubleStage } from '@/components/double/DoubleStage';

export const metadata: Metadata = {
  title: 'FOUR PEOPLE — the right two can still be the wrong four',
  description:
    'A double date is not two dates. Cover, eclipse and dilution, scored across every room, and why none of them get sent.',
};

/**
 * The thesis, taken one turn further.
 *
 * If context decides the evening for two people, it decides it twice over for
 * four — and the terms that appear only when there are four are the ones no
 * matching system models. This page exists because the answer it produces is
 * one nobody would have written on purpose.
 */
export default function DoublePage() {
  return (
    <main>
      <DoubleStage />
    </main>
  );
}
