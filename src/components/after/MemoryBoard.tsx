'use client';

import { motion } from 'framer-motion';
import { MEMORY_AFTER, MEMORY_BEFORE, type MemoryCard } from '@/data/memory';

/**
 * What changed.
 *
 * Not a dashboard and not a diff view — the same physical cards, reordered, with
 * one struck through. Layout animation does the work: because every card keeps
 * its `layoutId` across the change, React moves them rather than replacing them,
 * so you watch a belief slide down and get crossed out instead of being told
 * that it was.
 *
 * The struck card is never removed. A learning system that quietly deletes what
 * it used to think cannot be audited, and the strike is the only honest record
 * that it was ever wrong. Every card also carries its provenance, because a
 * belief the system cannot source is one it should not be acting on.
 *
 * It is a *space*, not a list: the board has perspective, and `weight` drives
 * depth. A contradicted belief recedes and tips away from you; a new one comes
 * forward. Held in DOM rather than WebGL on purpose — these cards are entirely
 * text, and text in a canvas is unselectable, untranslatable and invisible to a
 * screen reader. Depth here is worth having; depth at the cost of the words is
 * not.
 */
export function MemoryBoard({ learned }: { learned: boolean }) {
  const cards = learned ? MEMORY_AFTER : MEMORY_BEFORE;

  return (
    <ul
      className="grid gap-2.5"
      style={{ perspective: '900px', perspectiveOrigin: '30% 50%' }}
    >
      {cards.map((card, i) => (
        <MemoryRow key={card.id} card={card} index={i} learned={learned} />
      ))}
    </ul>
  );
}

const STANDING_LABEL: Record<MemoryCard['standing'], string> = {
  held: 'still held',
  strengthened: 'stronger tonight',
  struck: 'contradicted',
  new: 'new tonight',
};

function MemoryRow({
  card,
  index,
  learned,
}: {
  card: MemoryCard;
  index: number;
  learned: boolean;
}) {
  const struck = card.standing === 'struck';
  const fresh = card.standing === 'new';

  return (
    <motion.li
      layout
      layoutId={card.id}
      transition={{ type: 'spring', stiffness: 210, damping: 26, delay: index * 0.06 }}
      animate={{
        // Depth carries standing: what the system believes most sits closest.
        z: -70 + card.weight * 90,
        rotateX: struck ? 5 : 0,
        opacity: struck ? 0.48 : 1,
      }}
      className={`relative rounded-artifact border px-4 py-3 ${
        fresh
          ? 'border-tungsten/45 bg-tungsten/[0.07]'
          : struck
            ? 'border-paper/10 bg-transparent'
            : 'border-paper/14 bg-paper/[0.03]'
      }`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p
          className={`font-voice text-[1.08rem] leading-snug ${
            fresh ? 'text-tungsten' : 'text-paper/85'
          }`}
        >
          {struck ? (
            <span className="relative">
              {card.text}
              {/* drawn, not styled — a line-through reads as formatting, a
                  stroke reads as somebody crossing it out */}
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-1/2 block h-[2px] w-full origin-left bg-acid"
              />
            </span>
          ) : (
            card.text
          )}
        </p>

        <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-paper/25">
          {card.since}
        </span>
      </div>

      <p className="mt-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/35">
        {card.source}
      </p>

      {learned && card.standing !== 'held' && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className={`mt-2 inline-block font-mono text-[0.6rem] uppercase tracking-[0.18em] ${
            struck ? 'text-acid/70' : 'text-mint/70'
          }`}
        >
          {STANDING_LABEL[card.standing]}
        </motion.span>
      )}
    </motion.li>
  );
}
