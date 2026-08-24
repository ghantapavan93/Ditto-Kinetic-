'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import Link from 'next/link';
import { Volume2, VolumeX } from 'lucide-react';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { INTRO, MASTER } from '@/lib/film';
import type { MatchPair } from '@/lib/types';

/**
 * The opening.
 *
 * The site opens on the brand film — the storyboard cut, played whole, in
 * focus. That cut carries its own baked typography and a music bed, so the
 * curtain treats it as a finished piece: while it speaks, the DOM adds
 * nothing to its frames but a sound control and the standing invitation to
 * skip; when it fades to black, the title card lands on its tail and the
 * black becomes ours. Three beats:
 *
 *   text   — the film's own dark phone-glow open, with the one bubble that
 *            is also how the real product arrives: "found someone."
 *   film   — the cut runs: the brand movement whole, then out of its black
 *            the world-turn — the same two people while a diner becomes a
 *            library becomes a courtyard becomes the Royal Theatre street.
 *            Corner chrome recedes because two of the brand frames are
 *            paper-white and micro type cannot survive them; what stays is
 *            chipped in ink so it reads on any frame.
 *   people — the film ends held on the theatre street, and the names land
 *            over the marquee. Any input begins the stage.
 *
 * The film starts muted because browsers permit nothing else; the toggle
 * (or M) unmutes it mid-flight, and pressed after the end it replays the
 * whole cut with sound — the end card clears while it runs and re-forms on
 * the tail. Any other input at all skips the whole thing.
 */
export function IntroCurtain({ pair, onBegin }: { pair: MatchPair; onBegin: () => void }) {
  const [beat, setBeat] = useState<'text' | 'film' | 'people'>('text');
  const reduced = useReducedMotion();

  /*
   * If the film can't arrive, the words stand alone on ink. A broken video
   * element degrades to its poster at best and a black box at worst; either
   * way the one thing the opening must never show is a partial backdrop.
   */
  const [filmLost, setFilmLost] = useState(false);
  const [sound, setSound] = useState(false);
  const filmRef = useRef<HTMLVideoElement | null>(null);
  /** Mirrors `sound` for event handlers, which must never read stale state. */
  const soundRef = useRef(false);

  const landTitle = useCallback(() => {
    setBeat((b) => (b === 'people' ? b : 'people'));
  }, []);

  /*
   * Reduced motion never mounts the video — a self-playing, self-scoring
   * backdrop is exactly what that preference declined — so the title card
   * is the whole opening, immediately, on ink. Derived, not set in an
   * effect: the preference is a lens over the beat clock, not an event.
   */
  const shownBeat = reduced ? 'people' : beat;

  /*
   * The beat clock. The bubble leaves before the film's first baked line
   * arrives (~1.5s in); after that the cut owns the frame until its fade.
   * The title is cued off the film's own clock (timeupdate), not a timer,
   * so a throttled tab can't land the names on top of the footage.
   */
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setBeat((b) => (b === 'text' ? 'film' : b)), 1400);
    return () => clearTimeout(t);
  }, [reduced]);

  /*
   * Sound first. A film with a score should open scored, so the first
   * attempt is an UNMUTED play — a browser that allows it (a returning
   * visitor, a high engagement score) starts the opening the way it was
   * made. A browser that refuses gets the muted fallback immediately, and
   * from there the first tap anywhere turns the sound on — which is what
   * a first tap on a playing film means everywhere else people watch one.
   *
   * Only a refusal of the MUTED attempt counts as autoplay being declined
   * outright (data saver, low-power mode) — that, and only that, hands the
   * frame to the title at once, because "declined" and "still loading" are
   * different states: an earlier version conflated them and yanked the
   * title around mid-download. The slow-network backstop only fires if the
   * clock has never moved at all.
   */
  useEffect(() => {
    if (reduced) return;
    const film = filmRef.current;
    if (!film) return;
    let gone = false;
    film.muted = false;
    film
      .play()
      .then(() => {
        if (gone) return;
        soundRef.current = true;
        setSound(true);
      })
      .catch(() => {
        if (gone) return;
        film.muted = true;
        soundRef.current = false;
        film.play().catch((err: unknown) => {
          if (!gone && err instanceof DOMException && err.name === 'NotAllowedError') landTitle();
        });
      });
    const t = setTimeout(() => {
      if (!gone && film.currentTime === 0 && film.paused) landTitle();
    }, 8000);
    return () => {
      gone = true;
      clearTimeout(t);
    };
  }, [reduced, landTitle]);

  /*
   * Opened in a background tab, the browser defers the film's autoplay — and
   * not every browser re-runs it when the tab is finally fronted. The first
   * time the page becomes visible, a paused, unfinished film is asked to
   * play again; if the browser still declines, the stall handoff above has
   * already given the frame to the title.
   */
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== 'visible') return;
      const film = filmRef.current;
      if (film && film.paused && !film.ended) film.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', resume);
    return () => document.removeEventListener('visibilitychange', resume);
  }, []);

  /*
   * The media work happens in the handler, not inside the state updater —
   * updaters are re-invoked by StrictMode and batched at React's pleasure,
   * and a mute that sometimes applies twice is a mute that sometimes does
   * nothing.
   */
  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    const film = filmRef.current;
    if (film) {
      film.muted = !next;
      /*
       * Unmuted after the end, the film replays whole — hearing four
       * seconds of tail is not what anyone pressed the button for. The
       * end card steps aside while it runs; the timeupdate cue re-forms
       * it on the fade.
       */
      if (next && film.ended) {
        film.currentTime = 0;
        setBeat('film');
        film.play().catch(() => {});
      }
    }
    setSound(next);
  }, []);

  /*
   * Skipping is deliberate now. The first version dismissed the whole
   * opening on ANY pointer, key or wheel event — which meant the click
   * that focused the window, a trackpad's inertia, or one habitual tap
   * threw the film away before a single shot had landed. The film read as
   * "skipped" because it was.
   *
   * While the film plays, stray input does nothing but light the skip
   * control — the ways out are the skip button, Escape, Enter or Space.
   * Once the title lands, the original contract returns: any input at all
   * begins the stage. The sound control (button or M) is never mistaken
   * for either.
   */
  const beatRef = useRef(beat);
  useEffect(() => {
    beatRef.current = reduced ? 'people' : beat;
  }, [reduced, beat]);
  const [skipHot, setSkipHot] = useState(false);
  const skipHotT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeSkip = useCallback(() => {
    setSkipHot(true);
    if (skipHotT.current) clearTimeout(skipHotT.current);
    skipHotT.current = setTimeout(() => setSkipHot(false), 1100);
  }, []);
  useEffect(() => () => {
    if (skipHotT.current) clearTimeout(skipHotT.current);
  }, []);

  useEffect(() => {
    const within = (t: EventTarget | null, sel: string) =>
      t instanceof Element && !!t.closest(sel);

    const onPointer = (e: PointerEvent) => {
      if (within(e.target, '[data-intro-keep]')) return;
      if (within(e.target, '[data-intro-skip]')) {
        onBegin();
        return;
      }
      if (beatRef.current === 'people') {
        onBegin();
        return;
      }
      // The first tap on a muted, playing film means "sound on" — the
      // gesture every story-shaped surface has taught. Only once the
      // sound question is settled does a stray tap fall through to
      // lighting the skip control.
      if (!soundRef.current) toggleSound();
      else nudgeSkip();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Shift') return;
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleSound();
        return;
      }
      if (within(e.target, '[data-intro-keep]')) return;
      if (beatRef.current === 'people') {
        onBegin();
        return;
      }
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onBegin();
      else nudgeSkip();
    };
    const onWheel = () => {
      if (beatRef.current === 'people') onBegin();
    };

    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [onBegin, toggleSound, nudgeSkip]);

  /* The film's paper-white frames would erase white micro type; the corner
     chrome that must survive every frame wears ink. */
  const chip =
    'pointer-events-auto flex items-center gap-1.5 border border-paper/25 bg-ink/60 px-2.5 py-1.5 font-editorial text-[0.68rem] lowercase tracking-wide text-paper/85 backdrop-blur-sm transition-colors hover:border-paper/60 hover:text-paper';

  const showFullChrome = shownBeat !== 'film';

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 isolate z-overlay flex flex-col justify-between bg-ink px-gutter py-[clamp(1.25rem,4vh,2.5rem)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: DUR.settle, ease: EASE.settle }}
    >
      {/*
        The film, full-bleed and in focus.

        `isolate` matters: the backdrop sits at -z-10, and without a stacking
        context on the curtain it slid *behind* the WebGL stage, letting the
        room plate and the desk objects poke through the opening frame with a
        hard seam where the two met.
      */}
      <div
        aria-hidden
        className="u-stack-grain absolute inset-0 -z-10 overflow-hidden"
        style={{ '--grain-opacity': '0.14' } as React.CSSProperties}
      >
        {filmLost || reduced ? null : (
          <video
            ref={filmRef}
            src={INTRO.src}
            poster={INTRO.first}
            /*
              No autoPlay attribute and no muted prop: playback and mute are
              driven imperatively by the sound-first effect and the toggle,
              and a declarative `muted={!sound}` re-applied on re-render
              would fight those writes mid-flight.
            */
            playsInline
            preload="auto"
            onError={() => {
              setFilmLost(true);
              landTitle();
            }}
            onTimeUpdate={(e) => {
              // The street shot is fully formed for the film's last ~1.5s;
              // the title starts entering as it settles and finishes over
              // the held marquee frame. Below the cue, a film that is
              // genuinely rolling takes its frame back — the stall handoff
              // may have landed the title while autoplay was deferred (a
              // background tab, fronted later), and the names must not sit
              // on the footage. Hung off timeupdate, not the `playing`
              // event: timeupdate is the one signal every browser fires
              // steadily whenever the clock is really moving.
              const film = e.currentTarget;
              if (film.currentTime >= INTRO.duration - 1.3) landTitle();
              else if (!film.paused) setBeat((b) => (b === 'people' ? 'film' : b));
            }}
            onEnded={landTitle}
            className="h-full w-full object-cover"
          />
        )}
        {/*
          A breath of vignette so the corner chrome reads over footage; the
          film's own frames are never worked against — no wash, no blur.
        */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(130% 105% at 50% 50%, transparent 62%, rgba(11,9,7,0.42))',
          }}
        />
        {/*
          The end card's ground. The title lands over the lit theatre
          street, not over black, so the lower third earns a gradient — but
          only once the names are due; while the film speaks the frame
          stays untouched.
        */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: shownBeat === 'people' ? 1 : 0 }}
          transition={{ duration: 0.8, ease: EASE.settle }}
          style={{
            background:
              'linear-gradient(to top, rgba(11,9,7,0.9) 0%, rgba(11,9,7,0.45) 32%, transparent 60%)',
          }}
        />
      </div>

      {/* top bar: the label, and the film's one control */}
      <div className="flex items-start justify-between gap-4">
        <motion.p
          className="font-mono text-label uppercase text-paper/60"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: showFullChrome ? 1 : 0, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: EASE.settle }}
        >
          WED · 7:00 PM
        </motion.p>
        {!reduced && !filmLost && (
          <motion.button
            type="button"
            data-intro-keep
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? 'Mute the film' : 'Play the film with sound'}
            data-cursor={sound ? 'go quiet' : 'hear it'}
            className={`${chip} ${!sound && shownBeat === 'film' ? 'border-paper/45 text-paper' : ''}`}
            initial={{ opacity: 0, y: -8 }}
            /*
              While the film runs muted, the one thing worth saying pulses:
              a tap anywhere brings the score in. Settled (or before the
              film), the control sits quiet.
            */
            animate={{
              opacity: !sound && shownBeat === 'film' ? [0.55, 1, 0.55] : 1,
              y: 0,
            }}
            transition={
              !sound && shownBeat === 'film'
                ? { duration: 2.2, ease: 'easeInOut', repeat: Infinity }
                : { delay: 0.3, duration: 0.5, ease: EASE.settle }
            }
          >
            {sound ? (
              <Volume2 size={12} strokeWidth={2} aria-hidden />
            ) : (
              <VolumeX size={12} strokeWidth={2} aria-hidden />
            )}
            {sound ? 'sound on' : shownBeat === 'film' ? 'tap for sound' : 'sound off'}
          </motion.button>
        )}
      </div>

      {/* Beat one: the text that would actually have arrived. */}
      <AnimatePresence>
        {shownBeat === 'text' && (
          <motion.div
            key="sms"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.97, filter: 'blur(4px)' }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 30 }}
          >
            <p className="mb-2 font-mono text-micro uppercase text-paper/55">Ditto</p>
            <p className="rounded-[1.2rem] rounded-bl-md bg-cobalt px-5 py-3 font-editorial text-lede font-medium text-paper-bright shadow-lift">
              found someone.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat three: the film's black tail is the end card. */}
      <div className="max-w-[min(46rem,92vw)]">
        <AnimatePresence>
          {shownBeat === 'people' && (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="font-display text-hero uppercase leading-[0.86] text-paper">
                {[pair.personA.name, pair.personB.name].map((name, i) => (
                  <motion.span
                    key={name}
                    className="block"
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.14, duration: 0.7, ease: EASE.settle }}
                  >
                    {i === 1 && <span className="text-acid">× </span>}
                    {name}
                  </motion.span>
                ))}
              </h1>

              {/*
                Word by word, not as a block. Four words carry the whole
                thesis, so each one gets its own beat — the acid pair lands
                last, which is the order the idea actually unfolds in.
              */}
              <motion.p
                className="mt-5 font-voice text-[clamp(1.4rem,3.6vw,2.4rem)] italic leading-tight text-paper/85"
                initial="hidden"
                animate="shown"
                transition={{ staggerChildren: 0.11, delayChildren: 0.42 }}
              >
                {[
                  { t: 'right', acid: false },
                  { t: 'person.', acid: false },
                  { t: 'wrong', acid: true },
                  { t: 'first date.', acid: true },
                ].map((w) => (
                  <motion.span
                    key={w.t}
                    className={`mr-[0.32em] inline-block ${w.acid ? 'text-acid not-italic' : ''}`}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE.settle } },
                    }}
                  >
                    {w.t}
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-end justify-between gap-6">
        <motion.span
          className="pointer-events-auto flex items-baseline gap-4"
          animate={{ opacity: showFullChrome ? 1 : 0 }}
          transition={{ duration: 0.45, ease: EASE.settle }}
        >
          <PrototypeDisclosure />
          <Link
            href="/film"
            data-cursor="roll it"
            className="shrink-0 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-tungsten underline-offset-4 hover:underline"
            tabIndex={showFullChrome ? undefined : -1}
          >
            {`film · 00:${MASTER.duration}`}
          </Link>
        </motion.span>
        {/*
          The way past the film is a control, not a hair trigger. While the
          cut runs this is a real skip button — a stray click elsewhere only
          lights it — and once the title lands it turns back into the
          standing invitation, from which any input at all begins the
          stage. It survives the film's white frames the same way the sound
          control does: chipped in ink. It keeps breathing rather than
          auto-advancing — the stage is about choosing; it should not
          choose.
        */}
        <motion.button
          type="button"
          data-intro-skip
          className={`pointer-events-auto shrink-0 border px-2.5 py-1.5 font-mono text-label uppercase backdrop-blur-sm transition-colors ${
            skipHot
              ? 'border-acid bg-ink/80 text-acid'
              : 'border-paper/20 bg-ink/60 text-paper/80 hover:border-paper/55 hover:text-paper'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: shownBeat === 'text' ? 0 : skipHot ? 1 : [0.45, 1, 0.45] }}
          transition={{
            delay: 0.7,
            duration: skipHot ? 0.2 : 2.6,
            ease: 'easeInOut',
            repeat: shownBeat === 'text' || skipHot ? 0 : Infinity,
          }}
        >
          {shownBeat === 'people' ? <>drag it &mdash; or tap anywhere</> : <>skip the film &rarr;</>}
        </motion.button>
      </div>
    </motion.div>
  );
}
