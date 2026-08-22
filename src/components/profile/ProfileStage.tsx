'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { QUESTIONS, STARTING_TRAITS, WHEN } from '@/data/livingProfile';
import {
  ACTIONABLE,
  CONFIDENCE_CEILING,
  actionable,
  applyAnswer,
  unknowns,
  type Answer,
  type Change,
  type Trait,
} from '@/lib/profile';
import { FrostedSignals } from './FrostedSignals';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';
import { SnapshotRow } from '@/components/shared/SnapshotRow';

const PROVENANCE_LABEL = {
  stated: 'assumed',
  inferred: 'inferred',
  observed: 'observed',
} as const;

/**
 * What we actually know about someone.
 *
 * Built against the thing every onboarding flow does: ask twenty questions,
 * then present a finished person. The finished person is the lie. Twenty
 * answers produce twenty answers, and rendering them as a completed profile
 * makes a claim the data cannot support.
 *
 * So this asks three, shows the belief state moving in real time, and leaves
 * the gaps visible at the end. The bars are the argument — you watch one answer
 * move four beliefs, two of which the question was not about, and you watch the
 * confidence approach a ceiling it can never reach.
 *
 * The third question is the one worth building the page for. It is a favourite
 * colour, it moves nothing, and the system says so and drops it. No product
 * ever admits which of its own questions were worthless, and being able to is
 * the only honest justification for asking so few.
 */
export function ProfileStage() {
  const [traits, setTraits] = useState<Trait[]>(STARTING_TRAITS);
  const [step, setStep] = useState(0);
  const [changes, setChanges] = useState<Change[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [wasUseless, setWasUseless] = useState(false);
  /** Counted from the actual result, never written down. */
  const [tally, setTally] = useState<{ moved: number; usable: number } | null>(null);

  const question = QUESTIONS[step] ?? null;

  const known = useMemo(() => actionable(traits), [traits]);
  const unknown = useMemo(() => unknowns(traits), [traits]);
  const moved = useMemo(() => new Set(changes.map((c) => c.trait.id)), [changes]);

  const answer = (chosen: Answer) => {
    const result = applyAnswer(traits, chosen, WHEN[step] ?? 'just now');
    setTraits(result.traits);
    setChanges(result.changes);
    setNote(QUESTIONS[step].note);
    setWasUseless(!result.informative);
    setTally({
      moved: result.changes.length,
      usable: result.changes.filter((c) => c.to >= ACTIONABLE).length,
    });
    setStep((s) => s + 1);
    track('profile_answered', {
      question: QUESTIONS[step].id,
      moved: result.changes.length,
      informative: result.informative,
    });
  };

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(80% 50% at 20% 4%, rgba(232,145,60,0.08), transparent 60%), radial-gradient(120% 90% at 60% 108%, rgba(18,12,10,0.9), transparent 72%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[68rem] flex-col gap-10 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-paper/62">
            setting up · {Math.min(step, QUESTIONS.length)} of {QUESTIONS.length}
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-start">
          {/* the asking */}
          <section>
            <AnimatePresence mode="popLayout">
              {question ? (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.22 } }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h1 className="font-voice text-[clamp(1.7rem,4vw,2.6rem)] leading-tight text-paper">
                    {question.prompt}
                  </h1>

                  {/*
                    Ditto's own onboarding puts this exact reassurance under
                    its questions — "Private. Only used to match you" — and it
                    is the right sentence: the question above asks something
                    personal, and this is the one line that makes answering it
                    feel safe. Borrowed as a pattern, kept lowercase like the
                    rest of this site's chrome.
                  */}
                  <p className="mt-2.5 flex items-center gap-1.5 font-mono text-micro uppercase text-paper/55">
                    <Lock size={10} strokeWidth={2} aria-hidden />
                    private. only used to match you.
                  </p>

                  <div className="mt-7 grid gap-3">
                    {question.answers.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => answer(a)}
                        data-cursor="answer it"
                        className="rounded-artifact border border-paper/16 bg-paper/[0.03] px-5 py-4 text-left font-voice text-[1.1rem] leading-snug text-paper/85 transition-colors hover:border-tungsten/60 hover:text-paper"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h1 className="font-display text-[clamp(1.8rem,4.4vw,2.8rem)] uppercase leading-[0.95] text-paper">
                    that&rsquo;s all
                    <br />
                    three questions
                    <br />
                    <span className="text-tungsten">buys.</span>
                  </h1>
                  <p className="mt-6 max-w-[36ch] font-voice text-[1.15rem] leading-snug text-paper/65">
                    it is not a finished person, and the version of this that showed you one
                    would be making it up.
                  </p>
                  <p className="mt-4 max-w-[42ch] font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-paper/62">
                    the rest gets filled in by what actually happens on a wednesday, which is
                    slower and worth more. nothing here ever reaches certainty —{' '}
                    {CONFIDENCE_CEILING} is the ceiling, and evidence only ever closes part of
                    the remaining distance.
                  </p>

                  <Link
                    href="/held-back"
                    data-cursor="see what it declined"
                    className="mt-7 inline-block border border-tungsten/50 px-5 py-2.5 font-editorial text-[0.76rem] lowercase tracking-wide text-tungsten transition-colors hover:bg-tungsten hover:text-ink"
                  >
                    what it did not send →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {note && (
                <motion.p
                  key={note}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className={`mt-7 max-w-[38ch] font-editorial text-[0.82rem] lowercase leading-relaxed tracking-wide ${
                    wasUseless ? 'text-acid' : 'text-mint'
                  }`}
                >
                  {tally && tally.moved > 0 && (
                    <>
                      that moved {tally.moved} {tally.moved === 1 ? 'belief' : 'beliefs'};{' '}
                      {tally.usable} now {tally.usable === 1 ? 'sits' : 'sit'} above the line we
                      will act on.{' '}
                    </>
                  )}
                  {note}
                </motion.p>
              )}
            </AnimatePresence>
          </section>

          {/* what it believes */}
          <section aria-label="What Ditto believes so far">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
              what we think we know
            </p>

            {known.length === 0 && (
              <p className="mt-4 font-voice text-[1.1rem] italic leading-snug text-paper/55">
                nothing yet. that is the honest starting state.
              </p>
            )}

            <ul className="mt-4 grid gap-3">
              {known.map((trait) => (
                <TraitRow key={trait.id} trait={trait} justMoved={moved.has(trait.id)} />
              ))}
            </ul>

            {unknown.length > 0 && (
              <div className="mt-8 border-t border-dashed border-paper/15 pt-5">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
                  still no view on
                </p>
                <ul className="mt-3 grid gap-2">
                  {unknown.map((trait) => (
                    <li
                      key={trait.id}
                      className="font-editorial text-[0.82rem] lowercase leading-relaxed tracking-wide text-paper/55"
                    >
                      {trait.label}
                    </li>
                  ))}
                </ul>
                {/*
                  These are rendered rather than omitted on purpose. A profile
                  that only lists what it knows reads as complete, and the gap
                  between what a system knows and what it appears to know is
                  where every overconfident recommendation comes from.
                */}
                <p className="mt-4 max-w-[36ch] font-editorial text-[0.7rem] lowercase leading-relaxed tracking-wide text-paper/55">
                  these stay on the page. a profile that only shows what it knows looks
                  finished, and looking finished is the problem.
                </p>
              </div>
            )}

            {/*
              The third state, and the page is incomplete without it. Above is
              what the system knows about you, which it shows in full. Then what
              it knows about nobody, which it admits to. This is what it knows
              about someone else — held on their behalf, and the only category
              it refuses outright.
            */}
            <FrostedSignals personId="jonah" name="Jonah" />
          </section>
        </div>

        <SnapshotRow
          srcs={['/photos/print-selfie-02.webp']}
          note="it never knows more than this page."
          className="mt-2"
        />

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}

/** One belief, with its confidence as a physical length. */
function TraitRow({ trait, justMoved }: { trait: Trait; justMoved: boolean }) {
  return (
    <motion.li
      layout
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      className={`rounded-artifact border px-4 py-3 ${
        justMoved ? 'border-mint/35 bg-mint/[0.05]' : 'border-paper/12 bg-paper/[0.02]'
      }`}
    >
      <p className="font-voice text-[1.02rem] leading-snug text-paper/85">{trait.label}</p>

      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-[2px] flex-1 bg-paper/12">
          <motion.div
            animate={{ width: `${trait.confidence * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={justMoved ? 'absolute inset-y-0 left-0 bg-mint' : 'absolute inset-y-0 left-0 bg-paper/45'}
          />
          {/* the ceiling, drawn so it is obvious the bar can never fill */}
          <div
            className="absolute -top-1 bottom-[-0.25rem] w-px bg-acid/50"
            style={{ left: `${CONFIDENCE_CEILING * 100}%` }}
          />
        </div>
        <span className="font-mono text-[0.62rem] tabular-nums text-paper/62">
          {trait.confidence.toFixed(2)}
        </span>
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-paper/55">
          {PROVENANCE_LABEL[trait.provenance]}
        </span>
      </div>

      {trait.confidence < ACTIONABLE && (
        <p className="mt-2 font-editorial text-[0.68rem] lowercase tracking-wide text-paper/55">
          too thin to act on
        </p>
      )}
    </motion.li>
  );
}
