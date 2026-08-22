'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { WEEK_TWO } from '@/data/weekTwo';
import {
  LEARNED_LABEL,
  NO_CONDITIONS,
  SEND_THRESHOLD,
  rankScenes,
  sendDecision,
  weightsFor,
  type Learned,
} from '@/lib/rankScenes';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { track } from '@/lib/analytics';

const LEARNED: readonly Learned[] = ['pressure-over-extroversion'];

/**
 * Next Wednesday.
 *
 * The point of a learning loop is that it has consequences, and the only way to
 * show a consequence is to show the counterfactual. So this page runs the same
 * six rooms for a new pair twice — once on last week's weights, once on this
 * week's — and puts the two answers next to each other.
 *
 * There is no "profile updated" and no success toast. The system does not
 * announce that it learned something; it just quietly returns a different
 * answer, and the page shows you the one it would have given a week ago so you
 * can check.
 *
 * The result is not a landslide, deliberately. COFFEE led GALLERY DRIFT by
 * 0.0074 on the old weights — a genuine near-tie that a modest re-weighting is
 * enough to tip. A single evening's evidence should be able to do exactly that
 * much and no more.
 */
export function NextWednesday() {
  const [revealed, setRevealed] = useState(false);

  const before = rankScenes(WEEK_TWO, NO_CONDITIONS);
  const after = rankScenes(WEEK_TWO, { ...NO_CONDITIONS, learned: LEARNED });
  const wouldHave = sendDecision(WEEK_TWO, NO_CONDITIONS);
  const nowSends = sendDecision(WEEK_TWO, { ...NO_CONDITIONS, learned: LEARNED });

  const oldWeight = weightsFor().socialPressure;
  const newWeight = weightsFor(LEARNED).socialPressure;

  useEffect(() => {
    track('next_wednesday_viewed');
  }, []);

  const changed = wouldHave.send && nowSends.send && wouldHave.scene.id !== nowSends.scene.id;

  return (
    <div className="u-stack-grain min-h-full bg-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(85% 55% at 50% 6%, rgba(255,184,101,0.09), transparent 60%), radial-gradient(120% 90% at 50% 110%, rgba(43,68,255,0.14), transparent 68%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative mx-auto flex min-h-screen max-w-[62rem] flex-col gap-9 px-gutter py-[clamp(1.5rem,5vh,3rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-tungsten">
            + 7 days
          </p>
          <Link
            href="/after"
            data-cursor="last week"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            ← last week
          </Link>
          <Link
            href="/wednesday"
            data-cursor="the next drop"
            className="py-1.5 font-editorial text-[0.72rem] lowercase tracking-wide text-tungsten underline-offset-4 transition-colors hover:text-tungsten hover:underline"
          >
            next wednesday, 7pm →
          </Link>
        </header>

        <div>
          <h1 className="font-display text-[clamp(2.4rem,8vw,5.5rem)] uppercase leading-[0.86] text-paper">
            wednesday
            <br />
            7:00 pm
          </h1>

          <p className="mt-6 font-display text-[clamp(1.4rem,3.6vw,2.2rem)] uppercase leading-none text-paper">
            {WEEK_TWO.personA.name} <span className="text-acid">×</span> {WEEK_TWO.personB.name}
          </p>
          <p className="mt-3 max-w-[36ch] font-voice text-[1.15rem] leading-snug text-paper/60">
            {WEEK_TWO.personA.contradiction}
          </p>
        </div>

        {/* this week's answer */}
        {nowSends.send && (
          <section className="border-y border-paper/12 py-6">
            <p className="font-editorial text-[0.64rem] uppercase tracking-[0.24em] text-paper/55">
              proposed
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <span className="font-display text-[1.9rem] uppercase leading-none text-paper">
                {nowSends.scene.label}
              </span>
              <span className="font-mono text-[0.95rem] tabular-nums text-tungsten">
                {nowSends.scene.time}
              </span>
              <span className="font-voice text-[1.05rem] italic text-paper/62">
                {nowSends.scene.location}
              </span>
            </div>
            <p className="mt-4 max-w-[38ch] font-voice text-[1.15rem] leading-snug text-paper/75">
              {nowSends.scene.annotation}
            </p>
          </section>
        )}

        {/* the consequence, offered rather than announced */}
        <section>
          {!revealed ? (
            <button
              onClick={() => {
                setRevealed(true);
                track('next_wednesday_counterfactual_opened');
              }}
              data-cursor="check it"
              className="py-1.5 font-editorial text-[0.76rem] lowercase tracking-wide text-paper/62 underline-offset-4 transition-colors hover:text-tungsten hover:underline"
            >
              what would last week&rsquo;s model have said?
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <Column
                    label="on last week's weights"
                    weight={oldWeight}
                    rows={before}
                    highlight={wouldHave.send ? wouldHave.scene.id : null}
                    muted
                  />
                  <Column
                    label="on this week's"
                    weight={newWeight}
                    rows={after}
                    highlight={nowSends.send ? nowSends.scene.id : null}
                  />
                </div>

                <div className="mt-7 max-w-[46ch]">
                  <p className="font-voice text-[1.25rem] leading-snug text-paper">
                    {changed ? (
                      <>
                        last week it would have sent{' '}
                        <span className="text-paper/50">{wouldHave.send && wouldHave.scene.label}</span>.
                        this week it sends{' '}
                        <span className="text-tungsten">{nowSends.send && nowSends.scene.label}</span>.
                      </>
                    ) : (
                      <>the answer did not move this week. that also counts.</>
                    )}
                  </p>

                  <p className="mt-4 font-editorial text-[0.8rem] leading-relaxed text-paper/62">
                    One term changed weight: social pressure, {Math.abs(oldWeight).toFixed(2)} →{' '}
                    {Math.abs(newWeight).toFixed(2)}. Nothing was added, no dimension was invented,
                    and none of the six rooms changed. The café is still the easiest thing to
                    organise — it just costs more than it used to.
                  </p>

                  <p className="mt-4 font-hand text-[1.2rem] leading-snug text-tungsten">
                    still a hypothesis. one evening is one evening.
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        <PrototypeDisclosure className="mt-auto pt-6" />
      </div>
    </div>
  );
}

function Column({
  label,
  weight,
  rows,
  highlight,
  muted = false,
}: {
  label: string;
  weight: number;
  rows: ReturnType<typeof rankScenes>;
  highlight: string | null;
  muted?: boolean;
}) {
  return (
    <div className={muted ? 'opacity-55' : ''}>
      <p className="font-editorial text-[0.64rem] uppercase tracking-[0.22em] text-paper/55">
        {label}
      </p>
      <p className="mt-1 font-mono text-[0.62rem] text-paper/55">
        social pressure {weight.toFixed(2)}
      </p>

      <ol className="mt-3 space-y-1">
        {rows.map((r) => {
          const clears = r.utility >= SEND_THRESHOLD;
          const isTop = r.scene.id === highlight;
          return (
            <li
              key={r.scene.id}
              className={`flex items-baseline justify-between gap-3 border-l-2 py-1.5 pl-2.5 ${
                isTop ? 'border-tungsten' : clears ? 'border-paper/20' : 'border-transparent'
              }`}
            >
              <span
                className={`font-editorial text-[0.78rem] lowercase tracking-wide ${
                  isTop ? 'text-tungsten' : clears ? 'text-paper/75' : 'text-paper/55'
                }`}
              >
                {r.scene.label.toLowerCase()}
              </span>
              <span className="flex items-baseline gap-2">
                {!clears && (
                  <span className="font-editorial text-[0.62rem] lowercase text-paper/55">
                    under bar
                  </span>
                )}
                <span
                  className={`font-mono text-[0.76rem] tabular-nums ${
                    isTop ? 'text-tungsten' : 'text-paper/62'
                  }`}
                >
                  {r.utility.toFixed(3)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export { LEARNED_LABEL };
