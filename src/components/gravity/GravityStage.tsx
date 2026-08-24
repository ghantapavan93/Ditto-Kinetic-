'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { PAIRS } from '@/data/pairs';
import { coherence, fieldsFor } from '@/lib/gravity';
import {
  DISRUPTION_LABELS,
  NO_CONDITIONS,
  type Conditions,
  type Disruption,
} from '@/lib/rankScenes';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { ColdOpen } from '@/components/shared/ColdOpen';
import { NarrativeCursor } from '@/components/shared/NarrativeCursor';
import { useReducedMotion } from '@/components/shared/useReducedMotion';
import { track } from '@/lib/analytics';

const GravityField = dynamic(() => import('./GravityField').then((m) => m.GravityField), {
  ssr: false,
});

/**
 * The field, with the week in your hands.
 *
 * The stage already lets you break a week and watch a number move. Here the
 * same controls move two bodies, which is the whole argument for building it: a
 * score falling from 0.58 to 0.41 is a fact you have to be told, and two people
 * drifting apart is one you watch happen.
 *
 * The room selector and the disruptions are the existing `Conditions`
 * machinery, unchanged. Nothing new is modelled — the ten forces are the ten
 * weighted terms and the resting gap is the utility rescaled. What is new is
 * that the composition is visible, and that two evenings with the same score
 * stop looking the same.
 */
export function GravityStage() {
  const [which, setWhich] = useState(0);
  const pair = PAIRS[which];

  const [conditions, setConditions] = useState<Conditions>(NO_CONDITIONS);
  const [sceneId, setSceneId] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const fields = useMemo(() => fieldsFor(pair, conditions), [pair, conditions]);
  const field = useMemo(
    () => fields.find((f) => f.scene.id === sceneId) ?? fields[0],
    [fields, sceneId],
  );

  const coh = coherence(field);
  const pulls = field.forces.filter((f) => f.pulls);
  const pushes = field.forces.filter((f) => !f.pulls);

  useEffect(() => {
    track('gravity_viewed', { pair: pair.id, room: field.scene.id });
  }, [pair.id, field.scene.id]);

  const toggle = (d: Disruption) =>
    setConditions((c) => ({
      ...c,
      disruptions: c.disruptions.includes(d)
        ? c.disruptions.filter((x) => x !== d)
        : [...c.disruptions, d],
    }));

  return (
    <div className="relative h-screen overflow-hidden bg-ink">
      <div className="fixed inset-0">
        <GravityField
          field={field}
          personA={pair.personA}
          personB={pair.personB}
          reducedMotion={reduced}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(110% 60% at 12% 100%, rgba(11,9,7,0.9), transparent 56%), radial-gradient(90% 45% at 88% 0%, rgba(11,9,7,0.8), transparent 55%)',
        }}
      />

      <ColdOpen k="gravity" lines={['stop scoring', 'the people.']} voice="move the conditions." />
      <NarrativeCursor />

      <div className="relative flex h-full flex-col justify-between px-gutter py-[clamp(1.25rem,4vh,2.25rem)]">
        <header className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/62">
            no numbers · {field.locked ? 'holding' : 'apart'}
          </p>
          <Link
            href="/"
            data-cursor="back to the stage"
            className="py-1.5 font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            first scene →
          </Link>
        </header>

        <section className="max-w-[30rem]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${field.scene.id}-${field.locked}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.16 } }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-paper/55">
                {field.scene.label}
              </p>
              <h1 className="mt-2.5 font-display text-[clamp(1.5rem,4vw,2.4rem)] uppercase leading-[0.95] text-paper">
                {field.locked ? 'they hold together' : 'they drift'}
              </h1>

              {/*
                The one thing a score cannot say. Coherence is how much of the
                total force resolves rather than cancels, so it separates a calm
                agreement from a stalemate that happens to add up the same.
              */}
              <p className="mt-3 max-w-[34ch] font-voice text-[1.05rem] leading-snug text-paper/70">
                {coh > 0.75
                  ? 'every force here points the same way. this is not a close call, it is an agreement.'
                  : coh > 0.6
                    ? 'mostly pulling together, with something real pushing back.'
                    : 'the forces are fighting each other. whatever the number says, this is a truce and not a verdict — and you can see it in how they will not settle.'}
              </p>

              <div className="mt-4 grid gap-1">
                <p className="font-editorial text-[0.76rem] lowercase tracking-wide text-mint">
                  pulling — {pulls[0]?.label}
                </p>
                <p className="font-editorial text-[0.76rem] lowercase tracking-wide text-acid">
                  pushing — {pushes[0]?.label}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="grid gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-mono text-micro uppercase text-paper/55">who:</span>
            {PAIRS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setWhich(i);
                  setSceneId(null);
                }}
                data-cursor="these two"
                className={`py-1.5 font-editorial text-[0.74rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                  which === i ? 'text-tungsten underline' : 'text-paper/55 hover:text-paper'
                }`}
              >
                {p.personA.name} &amp; {p.personB.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-mono text-micro uppercase text-paper/55">room:</span>
            {fields.map((f) => (
              <button
                key={f.scene.id}
                onClick={() => setSceneId(f.scene.id)}
                data-cursor="put them here"
                className={`py-1.5 font-editorial text-[0.74rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                  f.scene.id === field.scene.id
                    ? 'text-tungsten underline'
                    : 'text-paper/55 hover:text-paper'
                }`}
              >
                {f.scene.label.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-mono text-micro uppercase text-paper/55">break it:</span>
            {(Object.keys(DISRUPTION_LABELS) as Disruption[]).map((d) => (
              <button
                key={d}
                onClick={() => toggle(d)}
                data-cursor="push them apart"
                className={`py-1.5 font-editorial text-[0.74rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                  conditions.disruptions.includes(d)
                    ? 'text-acid underline'
                    : 'text-paper/55 hover:text-paper'
                }`}
              >
                {DISRUPTION_LABELS[d].label}
              </button>
            ))}
            <button
              onClick={() =>
                setConditions((c) => ({
                  ...c,
                  week: c.week === 'strained' ? 'normal' : 'strained',
                }))
              }
              data-cursor="make it worse"
              className={`py-1.5 font-editorial text-[0.74rem] lowercase tracking-wide underline-offset-4 transition-colors ${
                conditions.week === 'strained'
                  ? 'text-acid underline'
                  : 'text-paper/55 hover:text-paper'
              }`}
            >
              exam week
            </button>
            {(conditions.disruptions.length > 0 || conditions.week !== 'normal') && (
              <button
                onClick={() => setConditions(NO_CONDITIONS)}
                className="py-1.5 font-editorial text-[0.74rem] lowercase tracking-wide text-paper/55 underline-offset-4 hover:underline"
              >
                reset
              </button>
            )}
          </div>

          <PrototypeDisclosure className="pt-1" />
        </footer>
      </div>
    </div>
  );
}
