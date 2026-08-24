'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { GROUPS } from './SiteMenu';
import { usePrototype } from '@/store/prototypeStore';
import { play } from './sound';

/**
 * ⌘K, everywhere.
 *
 * Every surface deserves the door engineers already have a hand on.
 * The palette reuses the menu's own GROUPS — one list, two doors, so the two
 * can never disagree about what exists — and adds the stage's verbs when you
 * are actually on the stage. It is the shadcn/cmdk pattern worn in this
 * site's clothes: mono labels, editorial blurbs, an acid rail on the active
 * row, no icons anywhere.
 *
 * The verbs go through `usePrototype.getState()` rather than hook
 * subscriptions: the palette re-renders for its own input, never because the
 * stage moved underneath it.
 */
export function CommandK() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const onStage = pathname === '/';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const act = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  const s = () => usePrototype.getState();

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Jump anywhere"
      className="fixed left-1/2 top-[18vh] z-disclosure w-[min(34rem,92vw)] -translate-x-1/2 overflow-hidden rounded-artifact border border-paper/15 bg-ink-soft/95 shadow-lift backdrop-blur-md"
    >
      {/*
        Not a command menu — a cut. The film freezes (the overlay drains the
        page's colour, styled globally on [cmdk-overlay]), the slate comes up,
        and choosing a line cuts straight to that scene.
      */}
      <div className="flex items-center gap-3 border-b border-paper/10 px-5">
        <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.3em] text-acid">
          cut to:
        </span>
        <Command.Input
          placeholder="“odds”, “pocket”, “break”…"
          className="w-full bg-transparent py-4 font-editorial text-[0.95rem] lowercase tracking-wide text-paper outline-none placeholder:text-paper/55"
        />
      </div>
      <Command.List className="max-h-[46vh] overflow-y-auto p-2">
        <Command.Empty className="px-4 py-6 font-voice text-[1rem] italic text-paper/62">
          nothing here by that name. the right person can still get the wrong first date.
        </Command.Empty>

        {onStage && (
          <Command.Group
            heading="the stage"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[0.58rem] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.26em] [&_[cmdk-group-heading]]:text-paper/55"
          >
            <Row label="choose this one" hint="commit the scene" onSelect={() => act(() => { s().selectScene(); play('snap', s().soundOn); })} />
            <Row label="make it real" hint="send the plan" onSelect={() => act(() => s().makeItReal())} />
            <Row label="see the decision" hint="the ranking, with the arithmetic left in" onSelect={() => act(() => s().openDecision())} />
            <Row label="break: venue falls through" hint="lose the room, keep the pair" onSelect={() => act(() => s().applyDisruption('venue'))} />
            <Row label="try another pair" hint="same six rooms, different people" onSelect={() => act(() => s().swapPair())} />
            <Row label={usePrototype.getState().soundOn ? 'sound off' : 'sound on'} hint="the clicks and the snap" onSelect={() => act(() => s().toggleSound())} />
          </Command.Group>
        )}

        {GROUPS.map((group) => (
          <Command.Group
            key={group.title}
            heading={group.title}
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[0.58rem] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.26em] [&_[cmdk-group-heading]]:text-paper/55"
          >
            {group.entries.map((e) => (
              <Row key={e.href} label={e.label} hint={e.blurb} onSelect={() => go(e.href)} />
            ))}
          </Command.Group>
        ))}
      </Command.List>

      <div className="flex items-center justify-between border-t border-paper/10 px-4 py-2.5">
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-paper/55">
          ↑↓ move · ↵ go · esc close
        </span>
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-paper/55">⌘K · cut</span>
      </div>
    </Command.Dialog>
  );
}

function Row({ label, hint, onSelect }: { label: string; hint: string; onSelect: () => void }) {
  return (
    <Command.Item
      /*
        Labels only. Scoring against blurbs made everything match everything —
        "odds" ranked the sound toggle first because its blurb letters happened
        to contain the subsequence. Twenty-seven labels are a small, precise
        vocabulary; the blurb stays visible but silent.
      */
      value={label}
      onSelect={onSelect}
      className="group relative flex cursor-pointer items-baseline gap-3 rounded-[3px] px-3 py-2.5 data-[selected=true]:bg-paper/[0.06]"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-acid opacity-0 group-data-[selected=true]:opacity-100"
      />
      <span className="font-mono text-[0.74rem] uppercase tracking-wider text-paper">{label}</span>
      <span className="min-w-0 flex-1 truncate font-editorial text-[0.74rem] lowercase tracking-wide text-paper/55">
        {hint}
      </span>
    </Command.Item>
  );
}
