'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { SURFACES } from '@/data/attentionInventory';
import { audit, saidAs } from '@/lib/attention';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

const SurfaceField = dynamic(() => import('./SurfaceField').then((m) => m.SurfaceField), {
  ssr: false,
});

const noopSubscribe = () => () => {};

/** What each surface is for, in one line. */
const SAYS: Record<string, string> = {
  '/': 'same two people, six rooms, and the room is the variable nobody moves',
  '/compiler': 'one messy sentence in, one evening out',
  '/app': 'the whole engine in the shape it would ship in',
  '/wednesday': 'the match arriving, and the frame it arrives in breaking',
  '/after': 'the only surface allowed to change its mind',
  '/next-wednesday': 'the week after, and whether the system learned anything',
  '/profile': 'three questions, and the gaps left visible',
  '/held-back': 'what did not get sent, and what each pair is waiting for',
  '/double': 'four people is not two pairs',
  '/ending': 'a twelfth dimension that did not earn its place',
  '/odds': 'a number you can argue with, and a lever that refuses',
  '/start': 'five ways in, and what each one does not prove',
  '/thread': 'the whole product as a text thread, and then silence',
  '/mutual': 'an introduction is only as good as the person who wants it less',
  '/world': 'eight campuses, and what scale actually buys',
  '/network': 'the introduction nobody can make',
  '/zoom': 'ninety-six people to one of them, without a page',
  '/gravity': 'ten forces, and no numbers on screen',
  '/weather': 'a full campus with nothing in it',
  '/next': 'the bet, the order, and how it loses',
  '/attention': 'what all of this costs you to look at',
  '/all': 'this. measured like everything else.',
  '/autonomy': 'six rungs, and the one that takes nothing and still costs you',
  '/end': 'the same question, asked once more, with none of it shown',
  '/possibility': 'an opening appears in your life before a person does',
  '/moments': 'the world the argument is for, cut like a film',
  '/vision': 'tonight to 2030, one camera, their own direction taken seriously',
  '/reel': 'every surface, about a second each',
};

/**
 * The index.
 *
 * Every surface and, until now, no way to see the shape of them — the only
 * route between them was a row of small text at the bottom of the stage.
 *
 * It is built out of the audit rather than beside it, which is the only version
 * worth having. Node size is what a surface costs to read, and the two rings
 * are the audit's own distinction: what could ship sits close to the centre,
 * what exists to argue orbits further out. So the map cannot flatter the site.
 * The fattest object on it is the one that talks the most.
 *
 * And it measures itself, because an index that quietly exempted itself from
 * the page next door would be exactly the kind of thing that page is about.
 */
export function AllStage() {
  const a = useMemo(() => audit(SURFACES), []);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const router = useRouter();

  /*
   * The visitor's own trail, from the same sessionStorage set the
   * everything-chip counts. Objects already seen glow warmer on the desk —
   * spatial memory, not a scoreboard. Read behind a hydration-safe isClient
   * gate (server snapshot false), because this page IS server-rendered and a
   * lazy sessionStorage read produced markup the server could not have made.
   */
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const visited = useMemo<ReadonlySet<string>>(() => {
    if (!isClient) return new Set<string>();
    try {
      const raw = window.sessionStorage.getItem('fs-seen');
      return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  }, [isClient]);

  const current = a.costs[active];

  useEffect(() => {
    track('index_viewed', { surfaces: SURFACES.length });
  }, []);

  return (
    <div className="relative h-screen overflow-hidden bg-ink">
      <div className="fixed inset-0">
        <SurfaceField
          costs={a.costs}
          active={active}
          visited={visited}
          onPick={setActive}
          onOpen={(path) => router.push(path)}
          reducedMotion={reduced}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(115% 62% at 10% 100%, rgba(11,9,7,0.93), transparent 56%), radial-gradient(90% 45% at 90% 0%, rgba(11,9,7,0.82), transparent 55%)',
        }}
      />

      <NarrativeCursor />

      <div className="pointer-events-none relative flex h-full flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.25rem)]">
        <header className="pointer-events-auto flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/62">
            {SURFACES.length} surfaces · {saidAs(a.total)} of attention
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="pointer-events-auto max-w-[30rem]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={current.surface.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.14 } }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-paper/55">
                {current.surface.kind === 'product' ? 'could ship' : 'an argument'} ·{' '}
                {saidAs(current.seconds)}
                {visited.has(current.surface.path) && (
                  <span className="text-mint"> · seen</span>
                )}
              </p>

              {/* The page had no heading at all, so a screen reader got no
                  structure for it. The surface under the cursor is the subject
                  of the page and is the right thing to carry it. */}
              <h1 className="mt-2">
                <Link
                  href={current.surface.path}
                  data-cursor="go there"
                  className="block font-display text-[clamp(1.7rem,4.6vw,2.8rem)] uppercase leading-[0.95] text-paper transition-colors hover:text-tungsten"
                >
                  {current.surface.path}
                </Link>
              </h1>

              <p className="mt-3 max-w-[34ch] font-voice text-[1.05rem] leading-snug text-paper/70">
                {SAYS[current.surface.path] ?? 'a surface.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="pointer-events-auto grid gap-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {a.costs.map((c, i) => (
              <button
                key={c.surface.path}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                data-cursor="look at it"
                className={`py-1.5 font-mono text-[0.7rem] transition-colors ${
                  i === active
                    ? 'text-tungsten'
                    : c.surface.kind === 'product'
                      ? 'text-mint hover:text-paper'
                      : 'text-paper/55 hover:text-paper'
                }`}
              >
                {c.surface.path}
              </button>
            ))}
          </div>

          <p className="max-w-[54ch] font-editorial text-[0.72rem] lowercase leading-relaxed tracking-wide text-paper/55">
            every surface is the object its own page is about — a dial, an envelope, a door —
            and its size is still what it costs to read. mint is close in and could ship; amber
            orbits and argues. what you&rsquo;ve already seen glows warmer. click an object once
            to look, again to walk in. this page is on the map too, measured the same way — see{' '}
            <Link href="/attention" className="inline-block py-1 underline underline-offset-4 hover:text-paper/60">
              the bill
            </Link>
            .
          </p>

          <PrototypeDisclosure />
        </footer>
      </div>
    </div>
  );
}
