'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CHAPTERS,
  CUES,
  MASTER,
  SCHOOLS,
  SCHOOLS_CLOSE,
  SCHOOLS_MOBILE_COUNT,
  SCHOOLS_OPEN,
  SHOTS,
  STORYBOARD_ALT,
  shotSrc,
  type Cue,
} from '@/lib/film';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { useCoarsePointer, useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

/**
 * /film — the cinema.
 *
 * Two layers. THE FILM: the 54-second master edit, played full-bleed with
 * every line of typography drawn by the DOM from the cue manifest, so the
 * type stays sharp at any size and the whole edit is inspectable data. THE
 * CUT: the nine source shots underneath, presented as an editing table —
 * each strip wakes on hover, opens on click, and says in one line why it
 * exists.
 *
 * The rules the player keeps: audio starts only from an explicit press;
 * chrome hides itself during playback and returns on pointer movement;
 * Space pauses, M mutes, Escape leaves cinema, arrows jump chapters; the
 * timeline is a hairline, not a console. Reduced motion gets a still poster,
 * a written version of the film, and a plain play control — the film is
 * always optional and never a gate.
 */

type Phase = 'poster' | 'cinema' | 'card' | 'after';

const round1 = (n: number) => Math.round(n * 10) / 10;

export function FilmStage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();

  const video = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('poster');
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [chrome, setChrome] = useState(true);
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track('film_viewed');
  }, []);

  /*
   * The clock: one rAF for tenth-of-a-second precision in the foreground,
   * with the element's own timeupdate as co-driver — rAF freezes in a
   * throttled or backgrounded tab while timeupdate keeps firing a few times
   * a second, so the typography can never silently detach from the film.
   */
  useEffect(() => {
    if (phase !== 'cinema') return;
    const v = video.current;
    const write = () => {
      if (!video.current) return;
      const now = round1(video.current.currentTime);
      setT((prev) => (prev === now ? prev : now));
    };
    let raf = 0;
    const tick = () => {
      write();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    v?.addEventListener('timeupdate', write);
    v?.addEventListener('seeked', write);
    return () => {
      cancelAnimationFrame(raf);
      v?.removeEventListener('timeupdate', write);
      v?.removeEventListener('seeked', write);
    };
  }, [phase]);

  const play = useCallback(() => {
    const v = video.current;
    if (!v) return;
    setPhase('cinema');
    setPaused(false);
    v.muted = false;
    void v.play();
    track('film_played');
  }, []);

  const togglePause = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }, []);

  const jumpChapter = useCallback((dir: number) => {
    const v = video.current;
    if (!v) return;
    const now = v.currentTime;
    let idx = 0;
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (CHAPTERS[i].at <= now + 0.2) {
        idx = i;
        break;
      }
    }
    const next = CHAPTERS[Math.min(Math.max(idx + dir, 0), CHAPTERS.length - 1)];
    v.currentTime = next.at + 0.05;
  }, []);

  /* Cinema keyboard. Never traps the browser: only keys it owns. */
  useEffect(() => {
    if (phase !== 'cinema') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      } else if (e.key.toLowerCase() === 'm') {
        const v = video.current;
        if (v) {
          v.muted = !v.muted;
          setMuted(v.muted);
        }
      } else if (e.key === 'Escape') {
        const v = video.current;
        v?.pause();
        setPaused(true);
        setPhase('poster');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        jumpChapter(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        jumpChapter(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, togglePause, jumpChapter]);

  /* Chrome hides while the film runs; a moved pointer brings it back. */
  useEffect(() => {
    if (phase !== 'cinema') return;
    const wake = () => {
      setChrome(true);
      if (chromeTimer.current) clearTimeout(chromeTimer.current);
      chromeTimer.current = setTimeout(() => setChrome(false), 2200);
    };
    wake();
    window.addEventListener('pointermove', wake);
    return () => {
      window.removeEventListener('pointermove', wake);
      if (chromeTimer.current) clearTimeout(chromeTimer.current);
    };
  }, [phase]);

  const onEnded = useCallback(() => {
    setPhase('card');
    track('film_finished');
    setTimeout(() => setPhase('after'), 3400);
  }, []);

  const active = useMemo(() => CUES.filter((c) => t >= c.at && t < c.until), [t]);
  const schoolsOn = phase === 'cinema' && t >= SCHOOLS_OPEN && t < SCHOOLS_CLOSE;
  const marks = coarse ? SCHOOLS.slice(0, SCHOOLS_MOBILE_COUNT) : SCHOOLS;

  return (
    <div className="u-stack-grain bg-ink text-paper">
      {/* ============ THE FILM ============ */}
      <section className="relative h-[100svh] overflow-hidden" aria-label="The film">
        <video
          ref={video}
          src={MASTER.src}
          poster={MASTER.poster}
          preload="metadata"
          playsInline
          onEnded={onEnded}
          className="absolute inset-0 h-full w-full bg-ink object-contain"
        />

        {/* typography layer — every word the film says, drawn sharp */}
        {phase === 'cinema' && (
          <div aria-live="off" className="pointer-events-none absolute inset-0">
            <AnimatePresence>
              {active.map((cue) => (
                <CueView key={`${cue.at}-${cue.text}`} cue={cue} />
              ))}
            </AnimatePresence>

            {/* the campus names: the world getting bigger */}
            <AnimatePresence>
              {schoolsOn &&
                marks.map((m) => (
                  <motion.span
                    key={m.name}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 0.16 + m.depth * 0.22,
                      x: (m.depth - 1) * 46,
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.25 } }}
                    transition={{ delay: m.delay, duration: 1.1, ease: 'easeOut' }}
                    className="absolute font-mono uppercase tracking-[0.3em] text-paper"
                    style={{
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      fontSize: `${0.5 + m.depth * 0.34}rem`,
                    }}
                  >
                    {m.name}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        )}

        {/* pre-play: the whole page in five seconds */}
        <AnimatePresence>
          {phase === 'poster' && (
            <motion.div
              key="poster"
              initial={false}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="absolute inset-0 flex flex-col justify-between bg-ink/55 px-gutter py-[clamp(1.25rem,4vh,2.5rem)]"
            >
              <header className="flex items-baseline justify-between">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-paper/70">
                  first scene / film
                </p>
                <p className="font-mono text-[0.62rem] uppercase tabular-nums tracking-[0.2em] text-paper/70">
                  00:{String(MASTER.duration).padStart(2, '0')}
                </p>
              </header>

              <div className="max-w-[38rem]">
                <h1 className="font-display text-[clamp(2.6rem,7vw,4.8rem)] uppercase leading-[0.9]">
                  first scene
                </h1>
                <p className="mt-3 font-voice text-[clamp(1.1rem,2.6vw,1.5rem)] italic text-paper/80">
                  right person. <span className="text-acid not-italic">wrong first date.</span>
                </p>

                <button
                  onClick={play}
                  data-cursor="roll it"
                  className="u-sheen mt-8 border border-acid bg-acid px-6 py-3 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-ink transition-colors hover:bg-transparent hover:text-acid"
                >
                  watch with sound →
                </button>
                {reduced && (
                  <p className="mt-3 font-editorial text-[0.78rem] lowercase text-paper/55">
                    prefers-reduced-motion respected — the film only plays on your press,
                    and the written version is below.
                  </p>
                )}
              </div>

              <footer className="flex items-end justify-between gap-4">
                <PrototypeDisclosure compact />
                <a
                  href="#the-cut"
                  className="py-1.5 font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 hover:text-paper hover:underline"
                >
                  the cut ↓
                </a>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* cinema chrome: hairline timeline + the few controls */}
        <AnimatePresence>
          {phase === 'cinema' && chrome && (
            <motion.div
              key="chrome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              className="absolute inset-x-0 bottom-0 px-gutter pb-4"
            >
              <div
                className="group relative h-6 cursor-pointer"
                data-cursor="scrub"
                onPointerDown={(e) => {
                  const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const v = video.current;
                  if (v) v.currentTime = ((e.clientX - box.left) / box.width) * MASTER.duration;
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-px bg-paper/25" />
                <div
                  className="absolute left-0 top-1/2 h-[2px] -translate-y-[0.5px] bg-acid"
                  style={{ width: `${(t / MASTER.duration) * 100}%` }}
                />
                {CHAPTERS.map((c) => (
                  <span
                    key={c.id}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${(c.at / MASTER.duration) * 100}%` }}
                  >
                    <span className="block h-[7px] w-px bg-paper/50" />
                    <span className="absolute -top-5 left-0 hidden -translate-x-1/2 whitespace-nowrap font-mono text-[0.52rem] uppercase tracking-[0.2em] text-paper/70 group-hover:block">
                      {c.label}
                    </span>
                  </span>
                ))}
              </div>

              <div className="mt-1.5 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.2em] text-paper/62">
                <span>
                  <button onClick={togglePause} className="py-1 hover:text-paper">
                    {paused ? 'play' : 'pause'}
                  </button>
                  <span className="mx-2">·</span>
                  <button
                    onClick={() => {
                      const v = video.current;
                      if (v) {
                        v.muted = !v.muted;
                        setMuted(v.muted);
                      }
                    }}
                    className="py-1 hover:text-paper"
                  >
                    {muted ? 'unmute' : 'mute'}
                  </button>
                </span>
                <span className="tabular-nums">
                  00:{String(Math.floor(t)).padStart(2, '0')} / 00:{MASTER.duration}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the end: the ditto card, then the handoff into the product */}
        <AnimatePresence>
          {(phase === 'card' || phase === 'after') && (
            <motion.div
              key="end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-ink/85 px-gutter text-center backdrop-blur-[2px]"
            >
              <p className="font-display text-[clamp(2.4rem,6vw,4rem)] lowercase leading-none">
                ditto
              </p>
              <p className="mt-3 font-voice text-[clamp(1rem,2.2vw,1.3rem)] italic text-paper/80">
                get a date every Wednesday
              </p>
              <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.26em] text-paper/62">
                over iMessage
              </p>
              <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-paper/62">
                ditto.ai
              </p>

              <AnimatePresence>
                {phase === 'after' && (
                  <motion.div
                    key="after"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mt-12"
                  >
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-paper/55">
                      the film was the short version
                    </p>
                    <p className="mt-2 font-voice text-[1.15rem] italic text-paper/80">
                      you watched the idea. now move the room.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => router.push('/')}
                        className="u-sheen border border-acid bg-acid px-5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-transparent hover:text-acid"
                      >
                        play the system →
                      </button>
                      <a
                        href="#the-cut"
                        className="border border-paper/25 px-5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-paper/80 hover:border-paper/60 hover:text-paper"
                      >
                        explore the cut
                      </a>
                      <button
                        onClick={() => {
                          const v = video.current;
                          if (v) {
                            v.currentTime = 0;
                            setPhase('cinema');
                            void v.play();
                          }
                        }}
                        className="px-3 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-paper/62 underline-offset-4 hover:text-paper hover:underline"
                      >
                        replay
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="absolute bottom-4 font-mono text-[0.56rem] uppercase tracking-[0.2em] text-paper/55">
                first scene · a concept build for ditto · synthetic cast and scenarios
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ============ THE CUT ============ */}
      <section id="the-cut" ref={cutRef} className="px-gutter py-16" aria-label="The cut">
        <header className="mb-8 flex items-baseline justify-between">
          <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] uppercase leading-none">
            the cut
          </h2>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-paper/55">
            the source shots, on the table
          </p>
        </header>

        <div className="grid gap-4">
          {[...SHOTS, STORYBOARD_ALT].map((shot, i) => (
            <CutStrip key={shot.id} shot={shot} index={i} coarse={coarse} reduced={reduced} />
          ))}
        </div>

        {/* the written film — the transcript reduced motion (and anyone) can read */}
        <details className="mt-12 border-t border-paper/10 pt-6">
          <summary className="cursor-pointer font-mono text-[0.62rem] uppercase tracking-[0.24em] text-paper/62 hover:text-paper">
            the film, written down
          </summary>
          <div className="mt-4 grid max-w-[42rem] gap-1.5">
            {CUES.map((c) => (
              <p key={`${c.at}-${c.text}`} className="font-editorial text-[0.85rem] text-paper/70">
                <span className="mr-3 font-mono text-[0.62rem] tabular-nums text-paper/55">
                  {String(Math.floor(c.at)).padStart(2, '0')}s
                </span>
                {c.text.replace('\n', ' ')}
                {c.sub ? ` — ${c.sub}` : ''}
              </p>
            ))}
          </div>
        </details>

        <footer className="mt-10 flex flex-wrap items-end justify-between gap-4 border-t border-paper/10 pt-5">
          <span className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5">
            <Link
              href="/"
              className="py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-tungsten underline-offset-4 hover:underline"
            >
              play first scene →
            </Link>
            <a
              href={MASTER.teaser}
              className="py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/62 underline-offset-4 hover:text-paper hover:underline"
            >
              the fourteen-second teaser →
            </a>
          </span>
          <PrototypeDisclosure compact className="pr-28 text-right" />
        </footer>
      </section>
    </div>
  );
}

/* ============ one cue, one voice ============ */

function CueView({ cue }: { cue: Cue }) {
  const posClass =
    cue.pos === 'upper'
      ? 'top-[12%]'
      : cue.pos === 'lower'
        ? 'bottom-[16%]'
        : 'top-1/2 -translate-y-1/2';
  const enter =
    cue.enter === 'cut'
      ? { initial: { opacity: 0 }, transition: { duration: 0.06 } }
      : { initial: { opacity: 0, y: 8 }, transition: { duration: 0.55 } };

  return (
    <motion.div
      {...enter}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: cue.enter === 'cut' ? 0.08 : 0.35 } }}
      className={`absolute inset-x-0 ${posClass} px-gutter text-center`}
    >
      {cue.voice === 'campaign' && (
        <p
          className={`mx-auto max-w-[16ch] font-display uppercase leading-[0.9] text-paper ${
            cue.size === 'xl'
              ? 'text-[clamp(2.6rem,8vw,6rem)]'
              : cue.size === 'lg'
                ? 'text-[clamp(2rem,6vw,4.4rem)]'
                : 'text-[clamp(1.5rem,4.4vw,3rem)]'
          }`}
          style={{ textShadow: '0 2px 24px rgba(0,0,0,0.55)' }}
        >
          {cue.text.split('\n').map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      )}
      {cue.voice === 'human' && (
        <p
          className="mx-auto max-w-[26ch] font-voice text-[clamp(1.2rem,3vw,1.9rem)] italic leading-snug text-paper"
          style={{ textShadow: '0 2px 18px rgba(0,0,0,0.6)' }}
        >
          {cue.text}
          {cue.sub && <span className="block">{cue.sub}</span>}
        </p>
      )}
      {cue.voice === 'system' && (
        <p className="mx-auto font-mono text-[0.68rem] uppercase tracking-[0.3em] text-paper/85">
          {cue.text}
          {cue.sub && (
            <span className="mt-1 block text-[0.6rem] tracking-[0.24em] text-paper/62">
              {cue.sub}
            </span>
          )}
        </p>
      )}
      {cue.voice === 'bubble' && (
        <p className="mx-auto w-fit rounded-[1.2rem] rounded-bl-md bg-cobalt px-5 py-3 font-voice text-[1.2rem] text-paper-bright shadow-lift">
          {cue.text}
        </p>
      )}
      {cue.voice === 'plan' && (
        <div className="mx-auto w-fit text-center">
          <p className="font-mono text-[clamp(0.95rem,2.2vw,1.25rem)] tabular-nums text-paper">
            {cue.text}
          </p>
          {cue.sub && (
            <p className="mt-1 font-editorial text-[clamp(0.85rem,1.9vw,1rem)] lowercase text-paper/80">
              {cue.sub}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ============ one strip on the editing table ============ */

function CutStrip({
  shot,
  index,
  coarse,
  reduced,
}: {
  shot: (typeof SHOTS)[number];
  index: number;
  coarse: boolean;
  reduced: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [near, setNear] = useState(false);
  const stripVideo = useRef<HTMLVideoElement>(null);
  const holder = useRef<HTMLDivElement>(null);

  /* Media mounts only when the strip approaches the viewport. */
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const wake = () => {
    if (coarse || reduced) return;
    const v = stripVideo.current;
    if (v) {
      v.muted = true;
      void v.play();
    }
  };
  const rest = () => {
    const v = stripVideo.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <div ref={holder}>
      <button
        onPointerEnter={wake}
        onPointerLeave={rest}
        onClick={() => setOpen(true)}
        data-cursor="open the shot"
        className="group grid w-full grid-cols-[auto_1fr] items-center gap-5 border border-paper/10 bg-ink-soft/40 p-3 text-left transition-colors hover:border-paper/30 sm:grid-cols-[auto_16rem_1fr]"
        aria-label={`Open shot: ${shot.title}`}
      >
        <span className="font-mono text-[0.72rem] tabular-nums text-paper/55">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="relative block aspect-video w-40 overflow-hidden sm:w-64">
          {near && (
            <video
              ref={stripVideo}
              src={shotSrc(shot)}
              poster={shot.poster}
              preload="none"
              muted
              playsInline
              loop
              className="absolute inset-0 h-full w-full object-cover opacity-80 saturate-[0.85] transition-opacity group-hover:opacity-100"
            />
          )}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[clamp(1rem,2.4vw,1.5rem)] uppercase leading-none text-paper">
            {shot.title}
          </span>
          <span className="mt-1.5 block font-voice text-[0.95rem] italic leading-snug text-paper/62">
            {shot.oneLiner}
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="fixed inset-0 z-disclosure grid place-items-center bg-ink/92 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-label={shot.title}
          >
            <div className="w-[min(72rem,96vw)]" onClick={(e) => e.stopPropagation()}>
              <video
                src={shotSrc(shot)}
                poster={shot.poster}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full bg-ink"
              />
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <p className="font-display text-[1.1rem] uppercase text-paper">{shot.title}</p>
                <button
                  onClick={() => setOpen(false)}
                  className="py-1 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/62 hover:text-paper"
                >
                  esc · close
                </button>
              </div>
              <p className="mt-1 font-voice text-[0.95rem] italic text-paper/62">{shot.oneLiner}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
