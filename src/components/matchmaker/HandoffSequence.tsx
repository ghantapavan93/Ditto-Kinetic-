'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Coffee, Image as GalleryFrame, NotebookPen, Ticket, Users } from 'lucide-react';
import { EASE } from '@/lib/motion';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { MM_COPY } from '@/data/matchmaking';
import type { CandidateEval } from '@/lib/matchmaker';

/**
 * WHO → HOW, as one continuous piece of software.
 *
 * The matching intelligence does not "link to" the stage; it hands the
 * surviving pair over, physically. Everything else falls away, the two
 * photographs travel toward each other, a thread appears between them,
 * WHO closes with a check — and the six rooms assemble around the pair
 * as objects (cup, notebook, frame, ticket, table, book: the stage's own
 * artifact vocabulary) before HOW? takes the frame and the route changes.
 * In thinking/proof view the aggregate itself is shown as the contract
 * one system emits and the other consumes.
 */
export function HandoffSequence({
  seeker,
  selected,
  showContract,
  onComplete,
}: {
  seeker: string;
  selected: CandidateEval;
  showContract: boolean;
  onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState<'converge' | 'rooms' | 'how'>('converge');

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(onComplete, 350);
      return () => clearTimeout(t);
    }
    const a = setTimeout(() => setBeat('rooms'), 1500);
    const b = setTimeout(() => setBeat('how'), 3100);
    const c = setTimeout(onComplete, 4300);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [reduced, onComplete]);

  const ARTIFACTS = [Coffee, NotebookPen, GalleryFrame, Ticket, Users, BookOpen];

  return (
    <motion.div
      className="fixed inset-0 z-disclosure flex items-center justify-center bg-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      role="status"
      aria-label={`${seeker} and ${selected.candidate.name}, entering first scene`}
    >
      <div className="relative flex h-[min(80vh,560px)] w-[min(92vw,560px)] items-center justify-center">
        {/* the pair converges */}
        <motion.div
          initial={{ x: -150, rotate: -7, opacity: 0 }}
          animate={{ x: -34, rotate: -4, opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE.settle }}
          className="u-paper absolute rounded-artifact p-1.5 pb-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative pre-sized webp */}
          <img src="/photos/print-selfie-01.webp" alt="" className="h-24 w-20 object-cover" />
        </motion.div>
        <motion.div
          initial={{ x: 150, rotate: 7, opacity: 0 }}
          animate={{ x: 34, rotate: 4, opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE.settle }}
          className="u-paper absolute rounded-artifact p-1.5 pb-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative pre-sized webp */}
          <img src={selected.candidate.photo} alt="" className="h-24 w-20 object-cover" />
        </motion.div>

        {/* the thread */}
        <motion.span
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: reduced ? 0 : 0.9, duration: 0.5, ease: EASE.settle }}
          className="absolute h-px w-16 origin-center bg-acid/80"
        />

        {/* the six rooms assemble */}
        {beat !== 'converge' &&
          ARTIFACTS.map((Icon, i) => {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            return (
              <motion.span
                key={i}
                aria-hidden
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  x: Math.cos(angle) * 170,
                  y: Math.sin(angle) * 170,
                  scale: 1,
                }}
                transition={{ delay: i * 0.09, duration: 0.65, ease: EASE.snap }}
                className="absolute flex h-11 w-11 items-center justify-center rounded-artifact border border-paper/25 bg-ink-soft text-tungsten shadow-artifact"
              >
                <Icon size={18} strokeWidth={1.75} />
              </motion.span>
            );
          })}

        {/* who ✓ → HOW? */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: beat === 'converge' ? 0 : 1 }}
          transition={{ duration: 0.4 }}
          className="absolute top-6 font-mono text-[0.66rem] uppercase tracking-[0.3em] text-mint"
        >
          {MM_COPY.handoff.whoDone}
        </motion.p>
        {beat === 'how' && (
          <motion.p
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE.snap }}
            className="absolute bottom-4 font-display text-[clamp(3rem,10vw,5.5rem)] uppercase leading-none text-paper"
          >
            {MM_COPY.handoff.how}
          </motion.p>
        )}

        {/* the contract — the aggregate one system emits, the next consumes */}
        {showContract && beat !== 'converge' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE.settle }}
            className="absolute -right-2 top-1/2 hidden w-[190px] -translate-y-1/2 border-l-2 border-mint/50 pl-3 lg:block"
          >
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-mint">{MM_COPY.handoff.contractTitle}</p>
            {MM_COPY.handoff.rows.map(([k, v]) => (
              <p key={k} className="mt-1.5 font-mono text-[0.52rem] uppercase leading-relaxed tracking-[0.12em] text-paper/70">
                {k}
                <br />
                <span className="text-paper/85">{k === 'PAIR' ? `${seeker.toLowerCase()} × ${selected.candidate.name.toLowerCase()}` : v}</span>
              </p>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
