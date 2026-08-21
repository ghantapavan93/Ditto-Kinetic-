'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SEND_THRESHOLD } from '@/lib/rankScenes';
import type { Restraint } from '@/lib/restraint';

/** The track runs to here, so the bar sits at roughly two-thirds across. */
const TRACK_MAX = 0.7;
const pct = (v: number) => `${(Math.max(0, v) / TRACK_MAX) * 100}%`;

const TERM_LABEL: Record<string, string> = {
  contextFit: 'context fit',
  firstFifteenMinutesForecast: 'first fifteen',
  attendanceLikelihood: 'attendance',
  scheduleFit: 'schedule fit',
  noveltyValue: 'novelty',
  explorationValue: 'exploration',
  pairSignal: 'pair signal',
  travelFriction: 'travel friction',
  socialPressure: 'social pressure',
  uncertainty: 'uncertainty',
};

/**
 * One pair that did not get sent.
 *
 * The bar is the whole argument, which is why it is a physical track rather
 * than a number in a table. Every one of these sits *below* the send line, and
 * the dashed run from where it landed to where the line is shows exactly what
 * the cheapest available change would buy — it always terminates precisely on
 * the threshold, because that is what "the smallest thing that would work"
 * means arithmetically.
 *
 * When nothing single can do it, there is no dashed run to draw and the card
 * says so. That absence is the honest state and it should look different from
 * a near miss, not like a near miss with sadder copy.
 */
export function HeldBackCard({ restraint, index }: { restraint: Restraint; index: number }) {
  const [open, setOpen] = useState(false);
  const { pair, best, utility, shortfall, waitingFor, needsMoreThanOneThing } = restraint;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-paper/12 py-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.2rem)] uppercase leading-none text-paper">
          {pair.personA.name} <span className="text-paper/55">×</span> {pair.personB.name}
        </h2>
        <p className="font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55">
          {pair.personA.fictionalCampus} · best room was {best?.label.toLowerCase()}
        </p>
      </div>

      {/*
        The two labels live on opposite sides of the track. Both sat underneath
        it at first, and since a held-back score is by definition close to the
        bar, "0.435" and "would send" printed straight through each other. The
        near miss is the case this display exists for, so it is the case it has
        to survive.
      */}
      <div className="mt-6">
        <div className="relative mb-2 h-4">
          <span
            className="absolute font-mono text-[0.58rem] uppercase tracking-[0.16em] text-acid"
            style={{ left: pct(SEND_THRESHOLD), transform: 'translateX(-50%)' }}
          >
            would send
          </span>
        </div>
        <div className="relative h-[3px] w-full bg-paper/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: pct(utility) }}
            transition={{ delay: 0.3 + index * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 left-0 bg-paper/55"
          />

          {/*
            What the cheapest reachable change would buy. It stops on the line
            by construction — the required movement is defined as exactly enough
            to clear the bar and not a step more.
          */}
          {waitingFor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 + index * 0.12, duration: 0.6 }}
              className="absolute inset-y-0 border-t-2 border-dashed border-tungsten/70"
              style={{ left: pct(utility), width: pct(shortfall) }}
            />
          )}

          {/* the send line */}
          <div
            className="absolute -top-2 bottom-[-0.5rem] w-px bg-acid"
            style={{ left: pct(SEND_THRESHOLD) }}
          />
        </div>

        <div className="relative mt-3 h-4">
          <span
            className="absolute font-mono text-[0.62rem] tabular-nums text-paper/62"
            style={{ left: pct(utility), transform: 'translateX(-50%)' }}
          >
            {utility.toFixed(3)}
          </span>
        </div>
      </div>

      {/* the verdict */}
      <div className="mt-6 max-w-[46ch]">
        {needsMoreThanOneThing ? (
          <>
            <p className="font-voice text-[1.25rem] leading-snug text-paper">
              no single change clears this.
            </p>
            <p className="mt-2 font-editorial text-[0.82rem] lowercase leading-relaxed tracking-wide text-paper/62">
              every dimension was checked on its own. not one of them has enough room left
              to cover {shortfall.toFixed(3)} by itself, which means the week is wrong in more
              than one way at once.
            </p>
          </>
        ) : (
          <>
            <p className="font-editorial text-[0.62rem] uppercase tracking-[0.24em] text-paper/55">
              waiting for
            </p>
            <p className="mt-2 font-voice text-[1.25rem] leading-snug text-tungsten">
              {waitingFor?.says}.
            </p>
            <p className="mt-2 font-editorial text-[0.82rem] lowercase leading-relaxed tracking-wide text-paper/62">
              {TERM_LABEL[waitingFor!.key]} reads {waitingFor!.from.toFixed(2)} and would have to
              reach {waitingFor!.to.toFixed(2)}. that is {Math.round(waitingFor!.effort * 100)}% of
              the room it has left.
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        data-cursor="check the others"
        className="mt-5 font-editorial text-[0.72rem] lowercase tracking-wide text-paper/62 underline-offset-4 transition-colors hover:text-paper hover:underline"
      >
        {open ? 'hide the rest' : 'what about everything else?'}
      </button>

      <AnimatePresence mode="popLayout">
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <table className="mt-4 w-full max-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-paper/55">
                  <th className="py-1 font-normal">dimension</th>
                  <th className="py-1 font-normal tabular-nums">now</th>
                  <th className="py-1 font-normal tabular-nums">would need</th>
                  <th className="py-1 font-normal">verdict</th>
                </tr>
              </thead>
              <tbody>
                {restraint.lifts.map((lift) => (
                  <tr
                    key={lift.key}
                    className="border-t border-paper/[0.07] font-editorial text-[0.76rem] lowercase text-paper/60"
                  >
                    <td className="py-1.5">{TERM_LABEL[lift.key]}</td>
                    <td className="py-1.5 font-mono tabular-nums text-paper/62">
                      {lift.from.toFixed(2)}
                    </td>
                    <td className="py-1.5 font-mono tabular-nums text-paper/62">
                      {lift.to.toFixed(2)}
                    </td>
                    <td
                      className={`py-1.5 ${
                        lift.key === 'pairSignal'
                          ? 'text-paper/55'
                          : lift.impossible
                            ? 'text-paper/55'
                            : 'text-mint'
                      }`}
                    >
                      {lift.key === 'pairSignal'
                        ? 'not a variable'
                        : lift.impossible
                          ? 'no room left'
                          : `possible — ${Math.round(lift.effort * 100)}% of its headroom`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/*
              pairSignal appears in that table and can never be the answer. It is
              constant within a pair, so the only "fix" it describes is two
              different people — which is the one lever this product does not
              reach for. Hiding the row would have been tidier and would have
              concealed the fact that the people were never the variable.
            */}
            <p className="mt-3 max-w-[44ch] font-editorial text-[0.7rem] lowercase leading-relaxed tracking-wide text-paper/55">
              pair signal is listed and struck out on purpose. it does not change between
              rooms, so the only thing it could ever ask for is two different people.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
