'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { PAIRS } from '@/data/pairs';
import { rankScenes, sendDecision, SEND_THRESHOLD } from '@/lib/rankScenes';
import { readAllLenses, lensesDisagree } from '@/lib/lenses';
import { CLOUD_COUNT, possibilityCloud } from '@/lib/possibility';
import { STARTING_TRAITS, QUESTIONS } from '@/data/livingProfile';
import { actionable, applyAnswer, unknowns } from '@/lib/profile';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { WhenPicker } from './WhenPicker';
import { FrostedSignals } from '@/components/profile/FrostedSignals';
import { track } from '@/lib/analytics';

type Tab = 'ditto' | 'where' | 'you';

/**
 * The whole thing as an application.
 *
 * Eight cinematic pages are an argument. They are not a product, and the gap
 * between the two is most of what separates a concept from something a founder
 * can picture shipping. So this is the same engine in the shape the real thing
 * actually has: a phone, a waiting state, and three tabs.
 *
 * The tab names are deliberately theirs — Ditto, Where, You — because the point
 * is not to propose a different information architecture. It is to show what
 * those three tabs could hold. The middle one is the entire thesis and it is
 * already in their navigation.
 *
 * Everything here reads from the same functions the full surfaces use. Nothing
 * is re-stated for the small screen, so this cannot drift out of agreement with
 * the pages it summarises — if the ranking changes, this changes.
 */
export function AppShell() {
  const [tab, setTab] = useState<Tab>('ditto');
  const pair = PAIRS[0];

  useEffect(() => {
    track('app_shell_viewed', { tab });
  }, [tab]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-6">
      {/* the device */}
      <div
        className="relative flex h-[min(88vh,820px)] w-full max-w-[24rem] flex-col overflow-hidden rounded-[2.6rem] border-[9px] border-ink bg-ink-soft"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(244,237,228,0.12), inset 0 0 50px rgba(0,0,0,0.5), 0 30px 70px rgba(0,0,0,0.55)',
        }}
      >
        {/* status bar */}
        <div aria-hidden className="relative h-[30px] shrink-0">
          <div className="absolute left-1/2 top-[5px] h-[20px] w-[96px] -translate-x-1/2 rounded-full bg-ink" />
          <div className="flex items-center justify-between px-5 pt-[9px]">
            <span className="font-mono text-[0.55rem] tabular-nums text-paper/62">7:00</span>
            <span className="flex items-center gap-1">
              <span className="block h-[6px] w-[2px] rounded-[1px] bg-paper/40" />
              <span className="block h-[8px] w-[2px] rounded-[1px] bg-paper/40" />
              <span className="block h-[10px] w-[2px] rounded-[1px] bg-paper/25" />
              <span className="ml-1 block h-[8px] w-[14px] rounded-[2px] border border-paper/35" />
            </span>
          </div>
        </div>

        {/* screen */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {tab === 'ditto' && <TabDitto pair={pair} />}
              {tab === 'where' && <TabWhere pair={pair} />}
              {tab === 'you' && <TabYou />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* nav */}
        <nav
          aria-label="Sections"
          className="flex shrink-0 items-stretch border-t border-paper/10 bg-ink/70 backdrop-blur-md"
        >
          {(
            [
              ['ditto', 'Ditto'],
              ['where', 'Where'],
              ['you', 'You'],
            ] as const
          ).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key ? 'page' : undefined}
              className={`relative flex-1 py-3.5 font-editorial text-[0.72rem] lowercase tracking-wide transition-colors ${
                tab === key ? 'text-paper' : 'text-paper/55 hover:text-paper/70'
              }`}
            >
              {name}
              {tab === key && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-6 bottom-1.5 block h-px bg-tungsten"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div
          aria-hidden
          className="absolute bottom-[7px] left-1/2 h-[3px] w-[100px] -translate-x-1/2 rounded-full bg-paper/20"
        />
      </div>

      <div className="mt-5 max-w-[24rem] text-center">
        <PrototypeDisclosure className="text-center" />
        {/*
          Tracking their movement, not freezing them in it: the join flow this
          shell was modelled on is real, but Ditto's public product has since
          pushed even harder into living entirely inside iMessage.
        */}
        <p className="mt-2 font-mono text-micro uppercase leading-relaxed text-paper/55">
          a shell modelled on the web join flow &mdash; the live product has since moved
          further into iMessage, which /thread takes seriously.
        </p>
      </div>
    </div>
  );
}

/** The drop, and the part everybody gets wrong afterwards. */
function TabDitto({ pair }: { pair: (typeof PAIRS)[number] }) {
  const decision = useMemo(() => sendDecision(pair), [pair]);
  const scene = decision.send ? decision.scene : pair.scenes[0];

  return (
    <div className="pt-2">
      <p className="font-mono text-[0.55rem] uppercase tracking-[0.26em] text-paper/55">
        wednesday · 7:00 pm
      </p>

      <div className="mt-4 w-fit rounded-[1.1rem] rounded-bl-md bg-cobalt px-4 py-2.5 font-voice text-[1.05rem] text-paper-bright">
        found someone.
      </div>

      <h1 className="mt-5 font-display text-[1.9rem] uppercase leading-[0.95] text-paper">
        {pair.personA.name} <span className="text-acid">×</span> {pair.personB.name}
      </h1>
      <p className="mt-2 font-voice text-[1rem] leading-snug text-paper/65">
        {pair.personB.contradiction}
      </p>

      <div className="mt-5 border-t border-paper/12 pt-4">
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.24em] text-paper/55">
          proposed
        </p>
        {/*
          The venue, shown. A real product card leads with the place — it is
          the one visual fact that makes "post show walk" a plan rather than a
          label. Same plate the stage's RoomPlate uses, cropped to card height.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized webp plate */}
        <img
          src={`/rooms/${scene.id}.webp`}
          alt={`${scene.label.toLowerCase()} — ${scene.location}`}
          loading="lazy"
          decoding="async"
          className="mt-2.5 h-28 w-full rounded-artifact object-cover"
          style={{ filter: 'saturate(0.72) contrast(0.92) brightness(0.9)' }}
        />
        <p className="mt-2.5 font-display text-[1.25rem] uppercase leading-none text-paper">
          {scene.label}
        </p>
        <p className="mt-1.5 font-voice text-[0.95rem] italic text-paper/62">
          {scene.location}
        </p>
      </div>

      {/*
        The scheduler is on this tab rather than its own, because it is not a
        separate feature — it is the step where four out of five of these stop
        happening, and it belongs directly under the thing being scheduled.
      */}
      <WhenPicker a={pair.personA} b={pair.personB} />

      <Link
        href="/wednesday"
        data-cursor="the full drop"
        className="py-1.5 mt-6 inline-block font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 hover:text-paper hover:underline"
      >
        see this arrive properly →
      </Link>
    </div>
  );
}

/** Their nav already has this tab. This is what it could hold. */
function TabWhere({ pair }: { pair: (typeof PAIRS)[number] }) {
  const ranked = useMemo(() => rankScenes(pair), [pair]);
  const lenses = useMemo(() => readAllLenses(pair), [pair]);
  const disagree = lensesDisagree(lenses);
  const top = ranked[0];
  const cloud = useMemo(() => possibilityCloud(pair, top.scene), [pair, top.scene]);

  // Counted, not written. The first version said "three of these six" next to a
  // list showing two below the bar — the exact failure this project keeps
  // asserting against everywhere else, committed in a hardcoded sentence.
  const belowBar = ranked.filter((r) => r.utility < SEND_THRESHOLD).length;

  return (
    <div className="pt-2">
      <p className="font-mono text-[0.55rem] uppercase tracking-[0.26em] text-paper/55">
        where · six rooms
      </p>

      <h1 className="mt-3 font-voice text-[1.05rem] leading-snug text-paper/75">
        same two people. the room is the variable nobody moves.
      </h1>

      <ul className="mt-4 grid gap-1.5">
        {ranked.map((r, i) => {
          const chosen = i === 0;
          const sendable = r.utility >= SEND_THRESHOLD;
          return (
            <li
              key={r.scene.id}
              className={`flex items-center gap-3 rounded-artifact border px-3 py-2 ${
                chosen ? 'border-mint/35 bg-mint/[0.05]' : 'border-paper/10 bg-paper/[0.02]'
              }`}
            >
              <span className="font-mono text-[0.55rem] tabular-nums text-paper/55">
                {i + 1}
              </span>
              {/*
                The room at a glance. Ranked rows of six labels asked the
                reader to already know what "gallery drift" looks like; a
                thumb answers it in the row. Below-bar rooms dim, because the
                list's one visual argument is what would and wouldn't be sent.
              */}
              {/* eslint-disable-next-line @next/next/no-img-element -- 56px thumb from a pre-sized webp */}
              <img
                src={`/rooms/${r.scene.id}.webp`}
                alt=""
                loading="lazy"
                decoding="async"
                className={`h-8 w-12 shrink-0 rounded-[2px] object-cover ${
                  sendable ? 'opacity-90 saturate-[0.8]' : 'opacity-40 saturate-[0.4]'
                }`}
              />
              <span
                className={`flex-1 font-display text-[0.95rem] uppercase leading-none ${
                  sendable ? 'text-paper' : 'text-paper/62'
                }`}
              >
                {r.scene.label}
              </span>
              <span className="font-mono text-[0.62rem] tabular-nums text-paper/62">
                {r.utility.toFixed(3)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 font-editorial text-[0.68rem] lowercase leading-relaxed tracking-wide text-paper/55">
        the bar is {SEND_THRESHOLD}. {belowBar} of these {ranked.length} would not be sent
        at all.
      </p>

      <div className="mt-5 border-t border-paper/12 pt-4">
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.24em] text-paper/55">
          how it got decided
        </p>
        <p className="mt-2 font-voice text-[1rem] leading-snug text-paper/75">
          {lenses.person.abstains
            ? 'the lens about the two of them has no view on where — it reads the same in every room.'
            : 'the lens about the two of them prefers a room.'}{' '}
          {disagree ? 'the other two disagree, and the weights side with the moment.' : ''}
        </p>
        <p className="mt-3 font-editorial text-[0.7rem] lowercase leading-relaxed tracking-wide text-paper/62">
          {cloud.agreeing} of {CLOUD_COUNT}{' '}
          versions of this night land in the same place. when it doesn&rsquo;t:{' '}
          {cloud.likeliestDrift}.
        </p>
      </div>

      <Link
        href="/"
        data-cursor="open the stage"
        className="py-1.5 mt-6 inline-block font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 hover:text-paper hover:underline"
      >
        open the room properly →
      </Link>
    </div>
  );
}

/** What it knows, what it doesn't, and what it will not show you. */
function TabYou() {
  // The state after the real three-question flow, so the tab shows what
  // onboarding actually buys rather than a flattering finished profile.
  const traits = useMemo(() => {
    let t = STARTING_TRAITS;
    for (const q of QUESTIONS) t = applyAnswer(t, q.answers[0], 'earlier').traits;
    return t;
  }, []);

  const known = actionable(traits);
  const gaps = unknowns(traits);

  return (
    <div className="pt-2">
      <p className="font-mono text-[0.55rem] uppercase tracking-[0.26em] text-paper/55">
        you · three questions in
      </p>

      <h1 className="mt-3 font-voice text-[1.05rem] leading-snug text-paper/75">
        not a finished person. the version that showed you one would be making it up.
      </h1>

      <ul className="mt-4 grid gap-2">
        {known.map((t) => (
          <li key={t.id} className="rounded-artifact border border-paper/12 bg-paper/[0.02] px-3 py-2.5">
            <p className="font-voice text-[0.95rem] leading-snug text-paper/85">{t.label}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative h-[2px] flex-1 bg-paper/12">
                <span
                  className="absolute inset-y-0 left-0 block bg-paper/45"
                  style={{ width: `${t.confidence * 100}%` }}
                />
              </div>
              <span className="font-mono text-[0.55rem] tabular-nums text-paper/55">
                {t.confidence.toFixed(2)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {gaps.length > 0 && (
        <div className="mt-5 border-t border-dashed border-paper/15 pt-3">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.24em] text-paper/55">
            still no view on
          </p>
          <ul className="mt-2 grid gap-1">
            {gaps.map((t) => (
              <li
                key={t.id}
                className="font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/55"
              >
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <FrostedSignals personId="jonah" name="Jonah" />

      <Link
        href="/profile"
        data-cursor="answer them yourself"
        className="py-1.5 mt-6 inline-block font-editorial text-[0.72rem] lowercase tracking-wide text-paper/55 underline-offset-4 hover:text-paper hover:underline"
      >
        answer them yourself →
      </Link>
    </div>
  );
}
