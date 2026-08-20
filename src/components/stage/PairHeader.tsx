'use client';

import { motion } from 'framer-motion';
import type { MatchPair, Person } from '@/lib/types';

/**
 * The two people, as people.
 *
 * The previous header said `MAYA × JONAH · WESTBROOK` in 10px uppercase mono —
 * which told you their names were strings. The system was the protagonist and
 * the humans were parameters.
 *
 * Each of them now gets the three things that actually make someone legible:
 * the surface read, the contradiction that cuts against it, and one specific
 * useless fact. The contradiction is the load-bearing one — it is what the
 * whole engine is reasoning about, and reading it here means the verdict later
 * lands as recognition rather than as output.
 */
function PersonNote({ person, align }: { person: Person; align: 'left' | 'right' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`max-w-[22ch] ${align === 'right' ? 'text-right' : ''}`}
    >
      <p className="font-display text-[1.05rem] uppercase leading-none text-paper">
        {person.name}
        <span className="ml-2 font-mono text-[0.62rem] tabular-nums text-paper/30">
          {person.age}
        </span>
      </p>
      <p className="mt-1 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/35">
        {person.major}
      </p>

      <p className="mt-2.5 font-voice text-[0.98rem] leading-tight text-paper/65">
        {person.surface}
      </p>
      <p
        className={`mt-1 flex items-baseline gap-1.5 font-voice text-[0.98rem] italic leading-tight text-tungsten/85 ${
          align === 'right' ? 'justify-end' : ''
        }`}
      >
        <span className="font-editorial text-[0.62rem] not-italic uppercase tracking-[0.16em] text-tungsten/45">
          but
        </span>
        {person.contradiction}
      </p>

      <p className="mt-2 font-hand text-[0.98rem] leading-tight text-paper/30">
        {person.tinyDetail}
      </p>
    </motion.div>
  );
}

export function PairHeader({ pair }: { pair: MatchPair }) {
  return (
    <div className="pointer-events-none hidden w-full items-start justify-between gap-8 md:flex">
      <PersonNote person={pair.personA} align="left" />
      <div className="mt-6 shrink-0 text-center">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-paper/25">
          wed 7:00 pm
        </p>
        <p className="mt-1 font-voice text-[0.85rem] italic text-paper/25">
          {pair.personA.fictionalCampus}
        </p>
      </div>
      <PersonNote person={pair.personB} align="right" />
    </div>
  );
}
