'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { VENUES, buildWeek, readWeather } from '@/lib/weather';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

const WeatherField = dynamic(() => import('./WeatherField').then((m) => m.WeatherField), {
  ssr: false,
});

/** Ditto drops on Wednesday. */
const DROP_DAY = 3;

/**
 * The week as an environment.
 *
 * Matching treats the world as a database that happens to get queried on a
 * Wednesday. It is a world, and on some Wednesdays there is nothing in it.
 *
 * Every figure on this page is aggregated from the ninety-six people rather
 * than written per night — that is the difference between a reading and set
 * dressing, and it is why the result was allowed to come out somewhere other
 * than where I expected. I built this looking for "the fullest night is not the
 * best night". What the population actually says is worse and more useful: the
 * fullest-looking night can be almost entirely unusable, and the headcount does
 * not blink.
 *
 * On an ordinary week Wednesday has eighty percent of Friday's crowd and two
 * percent of its openings. On a midterm week it has none at all — and Wednesday
 * is the night the product ships on.
 */
export function WeatherStage() {
  const [strained, setStrained] = useState(false);
  const [day, setDay] = useState(DROP_DAY);
  const reduced = useReducedMotion();

  const week = useMemo(() => buildWeek(strained), [strained]);
  const weather = useMemo(() => readWeather(week), [week]);
  const today = weather.days[day];

  useEffect(() => {
    track('weather_viewed', { day: today.name, openings: today.openings });
  }, [today.name, today.openings]);

  return (
    <div className="relative h-screen overflow-hidden bg-ink">
      <div className="fixed inset-0">
        <WeatherField week={week} day={day} warmth={today.warmth} reducedMotion={reduced} />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(115% 65% at 12% 100%, rgba(11,9,7,0.92), transparent 58%), radial-gradient(90% 45% at 88% 0%, rgba(11,9,7,0.8), transparent 55%)',
        }}
      />

      <NarrativeCursor />

      <div className="relative flex h-full flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.25rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/40">
            96 people · {today.free} out · {today.venuesOpen} of {VENUES} rooms open
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/35 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[32rem]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${today.name}-${strained}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.16 } }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-paper/30">
                {today.name}
                {day === DROP_DAY ? ' · drop day' : ''}
              </p>

              <h1 className="mt-2.5 font-display text-[clamp(1.5rem,4.2vw,2.5rem)] uppercase leading-[0.95] text-paper">
                {today.worthForcing ? `${today.openings} openings` : 'nothing worth forcing'}
              </h1>

              <p className="mt-3 max-w-[36ch] font-voice text-[1.05rem] leading-snug text-paper/70">
                {today.alive === 0
                  ? `${today.free} people came out and not one of them has anything left. this is not an empty campus. it is a full one with nothing in it.`
                  : today.density < 0.35
                    ? `${today.free} people are out and ${today.alive} of them are up for anything. a headcount would call this a good night.`
                    : `${today.alive} of the ${today.free} people out have something left. that is what makes it a night.`}
              </p>

              <p className="mt-3 max-w-[36ch] font-editorial text-[0.78rem] lowercase leading-relaxed tracking-wide text-paper/40">
                {Math.round(today.density * 100)}% of the people here are usable
                {today.venuesOpen < VENUES
                  ? `, and ${VENUES - today.venuesOpen} of the six rooms ${
                      VENUES - today.venuesOpen === 1 ? 'is' : 'are'
                    } shut.`
                  : ', and every room is open.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="grid gap-4">
          {/* the week */}
          <div>
            <div className="flex items-end gap-1.5">
              {weather.days.map((d) => {
                // Bar height is openings on a log-ish scale, because the range
                // is 0 to nearly two thousand and a linear bar would render
                // five of the seven nights as nothing.
                const h = d.openings > 0 ? 12 + Math.log10(d.openings + 1) * 26 : 4;
                return (
                  <button
                    key={d.day}
                    onClick={() => setDay(d.day)}
                    data-cursor="this night"
                    className="group flex flex-1 flex-col items-stretch gap-1.5"
                    aria-label={`${d.name}, ${d.openings} openings`}
                  >
                    <motion.span
                      animate={{ height: h }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      className={`block w-full rounded-[1px] ${
                        !d.worthForcing
                          ? 'bg-acid/35'
                          : d.day === day
                            ? 'bg-tungsten'
                            : 'bg-paper/25 group-hover:bg-paper/50'
                      }`}
                    />
                    <span
                      className={`font-editorial text-[0.68rem] lowercase tracking-wide transition-colors ${
                        d.day === day ? 'text-tungsten' : 'text-paper/30 group-hover:text-paper/60'
                      }`}
                    >
                      {d.name.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* the reading */}
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-paper/12 pt-3">
            <p className="font-editorial text-[0.74rem] lowercase tracking-wide text-paper/45">
              <span className="text-paper/25">best night — </span>
              {weather.best.name}, {weather.best.openings}
            </p>
            <p className="font-editorial text-[0.74rem] lowercase tracking-wide text-paper/45">
              <span className="text-paper/25">looks busy, is not — </span>
              {weather.emptiestFullNight.name}, {Math.round(weather.emptiestFullNight.density * 100)}% usable
            </p>
            <p className="font-editorial text-[0.74rem] lowercase tracking-wide text-acid/70">
              <span className="text-paper/25">drop day — </span>
              {weather.dropDay.worthForcing
                ? `${weather.dropDay.openings} openings`
                : 'closed'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              onClick={() => setStrained((s) => !s)}
              data-cursor="make it midterms"
              className={`font-editorial text-[0.76rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                strained ? 'text-acid underline' : 'text-paper/35 hover:text-paper hover:underline'
              }`}
            >
              {strained ? 'midterm week: on' : 'make it midterm week'}
            </button>
            <span className="max-w-[46ch] font-editorial text-[0.7rem] lowercase leading-relaxed tracking-wide text-paper/25">
              nothing here is written per night. every figure is counted across all ninety-six
              people, including the pairs — 4,560 of them, every night.
            </span>
          </div>

          <PrototypeDisclosure className="pt-1" />
        </footer>
      </div>
    </div>
  );
}
