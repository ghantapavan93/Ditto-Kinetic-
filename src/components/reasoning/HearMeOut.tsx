'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SPRING } from '@/lib/motion';
import type { MatchPair } from '@/lib/types';

/**
 * Stated preference versus revealed pattern — as a note, not a dialog.
 *
 * This was a centred Radix modal, which was wrong on two counts. It dimmed and
 * blocked the stage, so the one moment where the system asks you to *look again*
 * hid the thing it wanted you to look at. And modality is a claim: it says this
 * blocks everything until you deal with it. Ditto disagreeing with you gently is
 * the opposite of that.
 *
 * It is now a folded note that slides in against the right edge (bottom sheet on
 * narrow screens), leaves the stage lit and interactive behind it, and offers to
 * change the scene so the disagreement can be *demonstrated* rather than argued.
 *
 * Not a Radix Dialog, deliberately. Focus moves to it and Escape closes it, but
 * it never traps focus or hides the page from assistive tech — because it does
 * not block, and pretending otherwise would be a lie told in ARIA.
 *
 * The interesting claim is not "the AI learned your type". It is that the user
 * described the *symptom* accurately and diagnosed it wrongly.
 */
export function HearMeOut({
  pair,
  open,
  onClose,
  onChangeScene,
  canChangeScene,
}: {
  pair: MatchPair;
  open: boolean;
  onClose: () => void;
  onChangeScene: () => void;
  /** False when the scene it would move you to is already the one on stage. */
  canChangeScene: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="hmo"
          ref={panel}
          tabIndex={-1}
          aria-label="Hear me out"
          initial={{ opacity: 0, x: '18%', rotate: 1.4 }}
          animate={{ opacity: 1, x: 0, rotate: 0.6 }}
          exit={{ opacity: 0, x: '14%', rotate: 1.4, transition: { duration: 0.24 } }}
          transition={SPRING.copy}
          className="pointer-events-auto fixed inset-x-gutter bottom-gutter z-overlay origin-bottom-right sm:inset-x-auto sm:right-gutter sm:top-1/2 sm:w-[min(23rem,34vw)] sm:-translate-y-1/2"
        >
          <div className="u-paper relative rounded-artifact px-6 pb-6 pt-5 shadow-lift">
            {/* the fold */}
            <span
              aria-hidden
              className="absolute right-0 top-0 h-9 w-9"
              style={{
                background:
                  'linear-gradient(225deg, rgba(11,9,7,0.55) 0%, rgba(11,9,7,0.15) 45%, transparent 46%)',
              }}
            />

            <div className="flex items-baseline justify-between gap-4">
              <p className="font-display text-[1.5rem] uppercase leading-none text-acid">
                hear me out.
              </p>
              <button
                onClick={onClose}
                data-cursor="fine"
                className="py-1.5 font-editorial text-[0.72rem] lowercase text-ink/62 underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                close
              </button>
            </div>

            <div className="mt-5 space-y-3.5 border-y border-dashed border-ink/20 py-4">
              <div>
                <p className="font-editorial text-[0.62rem] uppercase tracking-[0.2em] text-ink/62">
                  you said
                </p>
                <p className="mt-1 font-voice text-[1.1rem] leading-snug text-ink/75">
                  &ldquo;{pair.hearMeOut.stated}&rdquo;
                </p>
              </div>
              <div>
                <p className="font-editorial text-[0.62rem] uppercase tracking-[0.2em] text-ink/62">
                  your history suggests
                </p>
                <p className="mt-1 font-voice text-[1.1rem] leading-snug text-ink/75">
                  {pair.hearMeOut.reading}
                </p>
              </div>
            </div>

            <p className="mt-4 font-hand text-[1.3rem] leading-tight text-ink">
              {pair.hearMeOut.line}
            </p>

            {canChangeScene && (
              <button
                onClick={onChangeScene}
                data-cursor="show me"
                className="mt-5 w-full border border-ink/25 py-2.5 font-editorial text-[0.74rem] lowercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                change the scene and see
              </button>
            )}

            <p className="mt-4 font-editorial text-[0.6rem] uppercase tracking-[0.16em] text-ink/62">
              working hypothesis · we may be wrong
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
