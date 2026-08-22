'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MINUTES, beatAt } from '@/data/firstFifteen';
import { play } from '@/components/shared/sound';
import { usePrototype } from '@/store/prototypeStore';

import { TUNGSTEN } from '@/lib/palette';
/**
 * The first fifteen minutes.
 *
 * `firstFifteenMinutesForecast` has been the second-heaviest term in the scorer
 * from the beginning, and until now it was a number nobody could see. This is
 * that field, opened up.
 *
 * It deliberately does not generate a conversation. Putting invented dialogue in
 * two invented mouths would be a worse product than saying nothing, and it would
 * also be the wrong claim — the system does not know what they will say. What it
 * can reason about is what the *room* is doing for them at each minute, which is
 * exactly what the forecast is a forecast of.
 *
 * Scrubbing also nudges the stage: the pair settles a little further as the
 * evening gets going. That is applied as a separate `intimacy` term rather than
 * by touching magnetism, so the ranking maths stays untouched.
 */
export function FirstFifteen({ pairId, sceneId }: { pairId: string; sceneId: string }) {
  const minute = usePrototype((s) => s.minute);
  const setMinute = usePrototype((s) => s.setMinute);
  const soundOn = usePrototype((s) => s.soundOn);

  const beat = beatAt(pairId, sceneId, minute);
  if (!beat) return null;

  return (
    <section
      aria-label="The first fifteen minutes"
      className="pointer-events-auto mt-7 max-w-[30rem]"
    >
      <p className="font-editorial text-[0.66rem] uppercase tracking-[0.22em] text-paper/55">
        the first fifteen
      </p>

      {/* the track */}
      <div className="relative mt-3 flex items-center">
        <span aria-hidden className="absolute left-0 right-0 h-px bg-paper/12" />
        <div
          role="radiogroup"
          aria-label="Minutes into the evening"
          className="relative flex w-full justify-between"
        >
          {MINUTES.map((m) => {
            const active = m === minute;
            const passed = m < minute;
            return (
              <button
                key={m}
                role="radio"
                aria-checked={active}
                aria-label={`${m} minutes in`}
                data-cursor={m === 0 ? 'the first minute' : `${m} minutes in`}
                onClick={() => {
                  setMinute(m);
                  play('tick', soundOn);
                }}
                className="group flex min-h-[44px] flex-col items-center gap-2 px-1"
              >
                <motion.span
                  aria-hidden
                  className="block rounded-full"
                  animate={{
                    width: active ? 9 : 6,
                    height: active ? 9 : 6,
                    backgroundColor: active
                      ? TUNGSTEN
                      : passed
                        ? 'rgba(245,239,227,0.55)'
                        : 'rgba(11,9,7,1)',
                    borderColor: active || passed ? 'transparent' : 'rgba(245,239,227,0.3)',
                  }}
                  transition={{ duration: 0.28 }}
                  style={{ borderWidth: 1, borderStyle: 'solid' }}
                />
                <span
                  className={`py-1.5 font-mono text-[0.66rem] tabular-nums transition-colors ${
                    active ? 'text-tungsten' : 'text-paper/55 group-hover:text-paper/60'
                  }`}
                >
                  {m}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-4 min-h-[3.4rem]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={`${sceneId}-${minute}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.14 } }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="font-voice text-[1.22rem] leading-snug text-paper/85"
          >
            {beat.note}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}
