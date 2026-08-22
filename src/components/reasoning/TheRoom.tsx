'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LENSES,
  challengeSet,
  lensesDisagree,
  readAllLenses,
  whyNot,
  type LensKey,
} from '@/lib/lenses';
import { NO_CONDITIONS, rankScenes, type Conditions } from '@/lib/rankScenes';
import type { MatchPair } from '@/lib/types';

/**
 * The room where it gets decided.
 *
 * Three lenses on one decision — should these two meet, is this the right room,
 * can it actually happen. It looks like three parties negotiating, and it is
 * emphatically not: they are a *partition* of the same ten weighted dimensions. Every
 * weighted term belongs to exactly one lens, and the three sum back to the
 * utility exactly. They cannot say anything the scorer does not already say.
 *
 * That distinction is the whole reason this is not three named AI characters
 * arguing in chat bubbles. Personas would be more immediately entertaining and
 * would quietly make the system the protagonist — which is the one thing this
 * project has refused from the beginning. Reasoning perspectives are honest;
 * a cast is a claim.
 *
 * Two things emerge from the arithmetic rather than from copy:
 *
 * PERSON abstains. `pairSignal` is constant across a pair's rooms, so the lens
 * that is about the two humans has no opinion about *where* — which is the
 * product thesis arriving from the maths instead of from a headline.
 *
 * And for Maya × Jonah the other two genuinely disagree: MOMENT wants the
 * post-show walk, REALITY wants the café. For Priya × Theo they agree. The
 * disagreement is therefore a property of a pair, not a decoration.
 */
export function TheRoom({
  pair,
  conditions = NO_CONDITIONS,
  currentSceneId,
  onPick,
}: {
  pair: MatchPair;
  conditions?: Conditions;
  /** Whatever is on the dial right now — always worth being able to challenge. */
  currentSceneId?: string;
  onPick?: (sceneId: string) => void;
}) {
  const readings = useMemo(() => readAllLenses(pair, conditions), [pair, conditions]);
  const ranked = useMemo(() => rankScenes(pair, conditions), [pair, conditions]);
  const disagree = lensesDisagree(readings);
  const resolved = ranked[0]?.scene ?? null;

  // Chosen by argument, not by rank — see challengeSet(). Notably this always
  // offers the café, which ranks fifth and is the only objection that matters.
  const challengeable = useMemo(
    () => challengeSet(pair, conditions, currentSceneId),
    [pair, conditions, currentSceneId],
  );

  const [challenging, setChallenging] = useState<string | null>(null);
  const challenge = useMemo(
    () => (challenging ? whyNot(pair, challenging, conditions) : null),
    [challenging, pair, conditions],
  );

  return (
    <section aria-label="How the decision was reached" className="mb-8">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {(Object.keys(LENSES) as LensKey[]).map((key, i) => {
          const lens = LENSES[key];
          const reading = readings[key];
          const isOutvoted =
            !reading.abstains && resolved && reading.prefers?.id !== resolved.id;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-artifact border px-4 py-3.5 ${
                reading.abstains
                  ? 'border-paper/10 bg-transparent'
                  : isOutvoted
                    ? 'border-acid/30 bg-acid/[0.04]'
                    : 'border-mint/25 bg-mint/[0.04]'
              }`}
            >
              <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
                {lens.label}
              </p>
              <p className="mt-1.5 font-voice text-[0.98rem] italic leading-snug text-paper/62">
                {lens.question}
              </p>

              <p className="mt-3 font-display text-[1.15rem] uppercase leading-none text-paper">
                {reading.abstains ? 'no view' : reading.prefers?.label}
              </p>

              <p className="mt-2 font-editorial text-[0.68rem] lowercase leading-relaxed tracking-wide text-paper/62">
                {reading.abstains
                  ? 'identical in every room — this lens is about them, not about the evening'
                  : isOutvoted
                    ? 'outvoted'
                    : 'carried'}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* the resolution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-paper/12 pt-4"
      >
        <span className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
          {disagree ? 'they disagree · resolved to' : 'agreed on'}
        </span>
        <span className="font-display text-[1.35rem] uppercase leading-none text-tungsten">
          {resolved?.label ?? 'nothing'}
        </span>
        {resolved && (
          <span className="font-mono text-[0.85rem] tabular-nums text-paper/62">
            {resolved.time}
          </span>
        )}
      </motion.div>

      {disagree && (
        <p className="mt-3 max-w-[52ch] font-voice text-[1.05rem] leading-snug text-paper/60">
          reality wanted the easiest thing to organise. moment refused it. the weights side
          with moment, because the failure it names — nobody has anything to react to — is the
          one that actually happens.
        </p>
      )}

      {/* challenge it */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-editorial text-[0.62rem] uppercase tracking-[0.2em] text-paper/55">
          challenge it
        </span>
        {challengeable.map((scene) => (
          <button
            key={scene.id}
            onClick={() => setChallenging(challenging === scene.id ? null : scene.id)}
            data-cursor="argue with it"
            className={`py-1.5 font-editorial text-[0.72rem] lowercase tracking-wide underline-offset-4 transition-colors ${
              challenging === scene.id
                ? 'text-tungsten underline'
                : 'text-paper/62 hover:text-paper hover:underline'
            }`}
          >
            why not {scene.label.toLowerCase()}?
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        {challenge && (
          <motion.div
            key={challenge.scene.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-artifact border border-paper/12 bg-paper/[0.02] px-4 py-4">
              <p className="max-w-[54ch] font-voice text-[1.1rem] leading-snug text-paper/85">
                {challenge.championedBy.length > 0 ? (
                  <>
                    <span className="text-mint">
                      {challenge.championedBy.join(' and ')}
                    </span>{' '}
                    actually wanted it
                    {challenge.refusedBy.length > 0 && (
                      <>
                        {' '}
                        — <span className="text-acid">
                          {challenge.refusedBy.join(' and ')}
                        </span>{' '}
                        put it near the bottom
                      </>
                    )}
                    .
                  </>
                ) : (
                  <>no lens put it first.</>
                )}
              </p>

              <p className="mt-3 max-w-[54ch] font-editorial text-[0.8rem] leading-relaxed text-paper/50">
                {challenge.scene.rationale[1]}
              </p>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span className="font-mono text-[0.78rem] tabular-nums text-paper/60">
                  {challenge.utility.toFixed(3)}
                </span>
                <span className="font-editorial text-[0.68rem] lowercase tracking-wide text-paper/55">
                  {challenge.gap.toFixed(3)} behind {challenge.winner?.label.toLowerCase()}
                </span>
                {challenge.belowBar && (
                  <span className="font-editorial text-[0.68rem] lowercase tracking-wide text-acid">
                    below the send bar — it would not have been sent at all
                  </span>
                )}
                {onPick && (
                  <button
                    onClick={() => onPick(challenge.scene.id)}
                    data-cursor="show me"
                    className="ml-auto border border-paper/20 px-3 py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/70 transition-colors hover:border-paper/60 hover:text-paper"
                  >
                    show me it failing
                  </button>
                )}
              </div>

              <p className="mt-4 font-hand text-[1.15rem] leading-snug text-tungsten">
                the people were never the problem.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
