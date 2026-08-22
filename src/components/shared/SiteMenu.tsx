'use client';

import Link from 'next/link';
import { Sheet } from './Sheet';
import { PrototypeDisclosure } from './PrototypeDisclosure';
import { PhoneQR } from './PhoneQR';

/**
 * The index, as a menu.
 *
 * The stage used to end in a pile of twenty-six inline links — every surface
 * the project has, printed in micro type in one wrapping paragraph. It was
 * complete and it was unreadable, and on shorter viewports it was worse than
 * unreadable: the pile pushed itself and the dial below the fold of a stage
 * that cannot scroll, so most of the site was reachable only in theory.
 *
 * This is the same completeness with a shape. One button on the stage opens
 * it; inside, every surface is grouped by what a visitor is actually trying
 * to do — begin, follow the night, read the reasoning, zoom out, read the
 * terms — with room around every row and a photograph naming
 * the mood of each group. Grouping is editorial, not architectural: nothing
 * about the routes changed, only the way in.
 */

type Entry = { href: string; label: string; blurb: string };
type Group = { title: string; photo?: string; entries: Entry[] };

const GROUPS: Group[] = [
  {
    title: 'begin',
    photo: '/photos/twilight-stroll.webp',
    entries: [
      { href: '/start', label: 'start here', blurb: 'five ways in — pick the one that is yours' },
      { href: '/', label: 'the stage', blurb: 'same two people, six ways to meet' },
      // Not "the app". Ditto's own line is that apps want people to stay
      // inside them, and this project agrees — the phone shape exists so the
      // interface can hand the night over, not so anyone lingers in it.
      { href: '/app', label: 'in your pocket', blurb: 'the same engine, phone-shaped — matched, planned, gone' },
      { href: '/all', label: 'everything, as one map', blurb: 'every surface, sized by what it costs you' },
    ],
  },
  {
    title: 'the night itself',
    photo: '/photos/neon-tacos.webp',
    entries: [
      { href: '/wednesday', label: 'the drop, 7pm', blurb: 'one plan arrives, once a week' },
      { href: '/thread', label: 'no app, just a thread', blurb: 'the whole product as nine text messages' },
      { href: '/double', label: 'four people', blurb: 'two pairs, one table, new physics' },
      { href: '/after', label: 'after the date', blurb: 'what the system keeps, and what it deletes' },
      { href: '/next-wednesday', label: 'the week after', blurb: 'what a second week actually changes' },
    ],
  },
  {
    title: 'how it decides',
    photo: '/photos/bookstore-reading.webp',
    entries: [
      { href: '/compiler', label: 'say it in one sentence', blurb: 'one line about your life, compiled into a plan' },
      { href: '/mutual', label: 'both sides, separately', blurb: 'one score for two people is not neutral' },
      { href: '/profile', label: 'what it knows about you', blurb: 'the whole model, small enough to read' },
      { href: '/held-back', label: 'what it did not send', blurb: 'the pairs it kept, and why' },
      { href: '/odds', label: 'your odds', blurb: 'the honest number, before you spend a week on it' },
      { href: '/gravity', label: 'forces, not scores', blurb: 'compatibility as physics you can drag' },
      { href: '/weather', label: 'is tonight worth it', blurb: 'the evening as a forecast' },
      { href: '/possibility', label: 'where openings appear', blurb: 'the space of first scenes, before one is chosen' },
    ],
  },
  {
    title: 'the wider view',
    photo: '/photos/photo-grid.webp',
    entries: [
      { href: '/zoom', label: 'one camera, all of it', blurb: 'from two people to the whole system in one move' },
      { href: '/network', label: 'the whole campus', blurb: 'every pair at once, one missing edge' },
      { href: '/world', label: 'every campus at once', blurb: 'the same idea at planetary scale' },
      { href: '/moments', label: 'the reel', blurb: 'the photographs, as a contact sheet' },
      { href: '/vision', label: 'where this goes', blurb: 'the long version of the argument' },
    ],
  },
  {
    title: 'the terms',
    photo: '/photos/bridgeside.webp',
    entries: [
      { href: '/autonomy', label: 'how much to hand over', blurb: 'the ladder of decisions you can delegate' },
      { href: '/attention', label: 'what this costs you', blurb: 'time spent here, counted as a bill' },
      { href: '/ending', label: 'the exit, as a term', blurb: 'leaving is a feature, priced up front' },
      { href: '/next', label: 'what would have to be true', blurb: 'the bet, stated so it can lose' },
      { href: '/end', label: 'the last surface', blurb: 'where the piece deletes itself' },
    ],
  },
];

/** Derived, never typed — the site's checks fail any written surface count. */
const SURFACE_COUNT = GROUPS.reduce((n, g) => n + g.entries.length, 0);

export function SiteMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="everything"
      description={`${SURFACE_COUNT} surfaces, one argument. Grouped by what you are here to do — none of them requires any other.`}
    >
      <div className="grid gap-9">
        {GROUPS.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <header className="mb-3 flex items-center gap-3">
              {group.photo && (
                /* eslint-disable-next-line @next/next/no-img-element -- tiny
                   decorative thumb from a pre-sized local webp. */
                <img
                  src={group.photo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-14 shrink-0 rounded-[2px] object-cover opacity-80 saturate-[0.8]"
                />
              )}
              <h3 className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-tungsten">
                {group.title}
              </h3>
              <span aria-hidden className="h-px flex-1 bg-paper/10" />
            </header>

            <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {group.entries.map((entry) => (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    data-cursor="go there"
                    onClick={() => onOpenChange(false)}
                    className="group flex min-h-[44px] flex-col justify-center rounded-artifact px-2 py-1.5 transition-colors hover:bg-paper/[0.05]"
                  >
                    <span className="font-editorial text-[0.95rem] lowercase leading-snug text-paper/85 transition-colors group-hover:text-paper">
                      {entry.label}
                    </span>
                    <span className="font-editorial text-[0.78rem] lowercase leading-snug text-paper/55">
                      {entry.blurb}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="flex flex-wrap items-end justify-between gap-6 border-t border-paper/10 pt-5">
          <div>
          <PrototypeDisclosure />
          </div>
          <PhoneQR className="shrink-0" />
        </footer>
      </div>
    </Sheet>
  );
}
