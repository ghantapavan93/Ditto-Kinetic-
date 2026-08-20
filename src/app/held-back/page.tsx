import type { Metadata } from 'next';
import { RestraintStage } from '@/components/restraint/RestraintStage';

export const metadata: Metadata = {
  title: 'HELD BACK — what did not get sent',
  description:
    'Ditto sends one match a Wednesday. This is the week it declined, and exactly what each pair is waiting for.',
};

/**
 * Restraint, given a screen.
 *
 * An abstention produces nothing by definition, so from the outside a system
 * exercising judgement looks identical to one that has stopped working. This
 * page is the argument that the not-sending is the product, and it only earns
 * that claim by saying what each held-back pair is specifically waiting for.
 */
export default function HeldBackPage() {
  return (
    <main>
      <RestraintStage />
    </main>
  );
}
