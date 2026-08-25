'use client';

import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { MM_COPY } from '@/data/matchmaking';
import type { Belief, Firmness, PersonModel } from '@/lib/personModel';

/**
 * WHAT I HEARD — the person model as signal cards.
 *
 * Each card is one belief: its firmness, its source, its confidence drawn
 * as a bar rather than hidden, a frost over anything private, and an
 * expiry stamp on anything temporary. Tapping a card cycles its firmness —
 * hard → soft → open — and the correction outranks the compiler by
 * invariant, so the whole run downstream recomputes from the person's own
 * reading. The frosted cards stay interactive but never legible: private
 * signals gate, they do not explain.
 */

const FIRMNESS_TINT: Record<Firmness, string> = {
  hard: 'border-acid/40 text-acid',
  soft: 'border-tungsten/45 text-tungsten',
  open: 'border-mint/40 text-mint',
  unknown: 'border-paper/25 text-paper/62',
};

const SOURCE_VOICE: Record<Belief['source'], string> = {
  explicit: 'you said',
  observed: 'I noticed',
  inferred: 'I’m inferring',
  corrected: 'you corrected',
  temporary: 'this expires',
};

const NEXT_FIRMNESS: Record<Firmness, Firmness> = { hard: 'soft', soft: 'open', open: 'hard', unknown: 'unknown' };

export function SignalBoard({
  model,
  onCorrect,
}: {
  model: PersonModel;
  onCorrect: (key: string, firmness: Firmness) => void;
}) {
  const live = model.beliefs.filter((b) => b.status !== 'expired');
  const knowns = live.filter((b) => b.firmness !== 'unknown');
  const unknowns = live.filter((b) => b.firmness === 'unknown');

  return (
    <div>
      <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.heard.compiler}</p>

      {/* the two compiler exemplars, verbatim: same grammar, opposite force */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {live
          .filter((b) => b.saidAs && (b.key === 'smoking' || b.key === 'height'))
          .map((b) => (
            <div key={b.key} className="rounded-artifact border border-paper/12 bg-paper/[0.02] px-4 py-3">
              <p className="font-voice text-[0.98rem] italic text-paper/80">“{b.saidAs}”</p>
              <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-paper/55">
                ↓ compiled as <span className={FIRMNESS_TINT[b.firmness].split(' ')[1]}>{b.firmness}</span>
              </p>
            </div>
          ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {knowns.map((b, i) => (
          <motion.button
            key={b.key}
            type="button"
            onClick={() => b.status === 'live' && onCorrect(b.key, NEXT_FIRMNESS[b.firmness])}
            disabled={b.status === 'retired'}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.05, duration: 0.45, ease: EASE.settle }}
            data-cursor="correct it"
            className={`relative rounded-artifact border bg-paper/[0.02] px-3 py-2.5 text-left transition-colors ${
              b.status === 'retired' ? 'border-paper/10 opacity-45' : `${FIRMNESS_TINT[b.firmness].split(' ')[0]} hover:bg-paper/[0.05]`
            }`}
          >
            <p className="font-editorial text-[0.72rem] lowercase text-paper/80">{b.label}</p>
            <p className={`mt-0.5 font-mono text-[0.56rem] uppercase tracking-[0.14em] ${b.status === 'retired' ? 'text-paper/55 line-through' : FIRMNESS_TINT[b.firmness].split(' ')[1]}`}>
              {b.status === 'retired' ? 'retired' : b.firmness}
            </p>
            <p className={`mt-1.5 truncate font-editorial text-[0.68rem] lowercase text-paper/62 ${b.isPrivate ? 'blur-[5px] select-none' : ''}`} aria-hidden={b.isPrivate}>
              {b.value}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] text-paper/55">{SOURCE_VOICE[b.source]}</span>
              <span aria-label={`confidence ${Math.round(b.confidence * 100)}%`} className="relative block h-[3px] w-10 rounded-full bg-paper/10">
                <span className="absolute inset-y-0 left-0 rounded-full bg-paper/55" style={{ width: `${b.confidence * 100}%` }} />
              </span>
            </div>
            {b.isPrivate && (
              <p className="mt-1.5 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-paper/55">🔒 private · used for matching · never shown</p>
            )}
            {b.expiresAfterWeek !== undefined && (
              <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-tungsten">expires · week {b.expiresAfterWeek}</p>
            )}
          </motion.button>
        ))}
      </div>
      <p className="mt-3 font-hand text-[1.05rem] text-tungsten">{MM_COPY.heard.correct}</p>

      <div className="mt-8 border-t border-paper/[0.09] pt-5">
        <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper/55">{MM_COPY.heard.unknownEyebrow}</p>
        <p className="mt-2 max-w-[38ch] font-display text-[clamp(1.1rem,2.6vw,1.5rem)] uppercase leading-[0.98] text-paper">
          {MM_COPY.heard.unknownLine}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {unknowns.map((b) => (
            <div key={b.key} className="rounded-artifact border border-dashed border-paper/25 px-3 py-2">
              <p className="font-editorial text-[0.72rem] lowercase text-paper/70">{b.label}</p>
              <p className="mt-0.5 font-mono text-[0.52rem] uppercase tracking-[0.14em] text-paper/55">I’m not sure — unasked</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
