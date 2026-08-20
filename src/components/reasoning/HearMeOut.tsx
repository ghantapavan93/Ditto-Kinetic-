'use client';

import { Sheet } from '@/components/shared/Sheet';
import type { MatchPair } from '@/lib/types';

/**
 * Stated preference versus revealed pattern.
 *
 * The interesting claim is not "the AI learned your type". It is that the user
 * described the *symptom* accurately and diagnosed it wrongly — they weren't
 * wrong about being uncomfortable, they were wrong about what caused it.
 *
 * Framed as a working hypothesis throughout, and it never asserts that the
 * history is more true than the person. It just disagrees, politely, and shows
 * its reasoning.
 */
export function HearMeOut({
  pair,
  open,
  onClose,
}: {
  pair: MatchPair;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="hear me out."
      className="w-[min(32rem,92vw)]"
    >
      <div className="grid grid-cols-2 gap-4 border-y border-paper/10 py-4">
        <div>
          <p className="font-mono text-micro uppercase text-paper/30">you said</p>
          <p className="mt-1.5 font-editorial text-[0.98rem] leading-snug text-paper/80">
            &ldquo;{pair.hearMeOut.stated}&rdquo;
          </p>
        </div>
        <div>
          <p className="font-mono text-micro uppercase text-mint/70">history suggests</p>
          <p className="mt-1.5 font-editorial text-[0.98rem] leading-snug text-paper/80">
            {pair.hearMeOut.reading}
          </p>
        </div>
      </div>

      <p className="mt-5 font-editorial text-[1.05rem] leading-snug text-paper">
        {pair.hearMeOut.line}
      </p>

      <p className="mt-5 font-mono text-micro uppercase text-paper/30">
        working hypothesis · we may be wrong · change the scene and see
      </p>
    </Sheet>
  );
}
