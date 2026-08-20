'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  COST_TERMS,
  NO_CONDITIONS,
  SEND_THRESHOLD,
  WEIGHTS,
  rankScenes,
  type Conditions,
  type WeightKey,
} from '@/lib/rankScenes';
import { SPRING } from '@/lib/motion';
import type { MatchPair } from '@/lib/types';

/**
 * The technical layer.
 *
 * Deliberately not a hacker console: no monospace green, no fake telemetry, no
 * streaming logs. It is a ranking table with the arithmetic left in, because
 * the thing worth showing an engineer is not that a model ran — it is that the
 * decision is reproducible and that someone chose these weights on purpose and
 * can defend them.
 *
 * The single most important row is `pair signal`, which is identical down every
 * column. Everything that separates the best opening from the worst one is
 * context. That is the entire product thesis, visible as a flat line in a table.
 */
export function DecisionView({
  pair,
  currentSceneId,
  conditions = NO_CONDITIONS,
  open,
  onClose,
  onPick,
}: {
  pair: MatchPair;
  currentSceneId: string;
  conditions?: Conditions;
  open: boolean;
  onClose: () => void;
  onPick: (sceneId: string) => void;
}) {
  const ranked = useMemo(() => rankScenes(pair, conditions), [pair, conditions]);
  const [expanded, setExpanded] = useState<string | null>(ranked[0]?.scene.id ?? null);

  // Bars are scaled against the send bar rather than against the best row, so
  // the threshold is a fixed position on every chart instead of a moving one.
  const ceiling = Math.max(SEND_THRESHOLD * 1.6, ranked[0]?.utility ?? SEND_THRESHOLD);
  const norm = (u: number) => Math.max(0, u) / ceiling;
  const sendsAtAll = (ranked[0]?.utility ?? 0) >= SEND_THRESHOLD;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="decision"
          className="fixed inset-0 z-sheet flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
        >
          <button
            aria-label="Close decision view"
            onClick={onClose}
            className="absolute inset-0 bg-ink/85 backdrop-blur-md"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="How this scene won"
            initial={{ y: '4%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '4%', opacity: 0 }}
            transition={SPRING.copy}
            className="relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-t-sheet border border-paper/10 bg-ink-soft/95 p-gutter shadow-lift sm:rounded-sheet"
          >
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[clamp(1.5rem,3.6vw,2.4rem)] uppercase leading-none text-paper">
                  how this scene won
                </h2>
                <p className="mt-2 max-w-[46ch] font-editorial text-[0.92rem] leading-snug text-paper/55">
                  The ranking object isn’t a person. It’s a possible real-world introduction —
                  the same two people under six sets of conditions.
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 border border-paper/20 px-3 py-1.5 font-mono text-micro uppercase text-paper/70 transition-colors hover:border-paper/50 hover:text-paper"
              >
                esc
              </button>
            </header>

            {/* The flat line. */}
            <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-paper/10 py-3">
              <span className="font-mono text-micro uppercase text-mint">pair signal</span>
              <span className="font-mono text-[1.05rem] font-bold text-paper">
                {pair.pairSignal.toFixed(2)}
              </span>
              <span className="font-mono text-micro uppercase text-paper/40">
                identical in every row — it is the same two people
              </span>
            </div>

            {/* The send bar, and whether anything cleared it. */}
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-mono text-micro uppercase text-paper/35">send bar</span>
              <span className="font-mono text-[0.9rem] tabular-nums text-paper/80">
                {SEND_THRESHOLD.toFixed(2)}
              </span>
              <span
                className={`font-mono text-micro uppercase ${sendsAtAll ? 'text-mint' : 'text-acid'}`}
              >
                {sendsAtAll
                  ? `${ranked.filter((r) => r.utility >= SEND_THRESHOLD).length} of ${ranked.length} clear it`
                  : 'nothing clears it — the system is declining to send'}
              </span>
              {conditions.week === 'strained' && (
                <span className="font-mono text-micro uppercase text-acid/70">exam week applied</span>
              )}
            </div>

            <ol className="space-y-1.5">
              {ranked.map((entry) => {
                const isOpen = expanded === entry.scene.id;
                const isCurrent = entry.scene.id === currentSceneId;
                const clears = entry.utility >= SEND_THRESHOLD;
                const isSelected = clears && entry.rank === 1;
                return (
                  <li key={entry.scene.id}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : entry.scene.id)}
                      aria-expanded={isOpen}
                      className={`group grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 border px-3 py-2.5 text-left transition-colors
                        ${isSelected ? 'border-acid/50 bg-acid/[0.07]' : 'border-paper/10 hover:border-paper/25'}
                        ${isCurrent && !isSelected ? 'border-cobalt/50' : ''}
                        ${clears ? '' : 'opacity-55'}`}
                    >
                      <span
                        className={`font-mono text-[0.72rem] font-bold ${isSelected ? 'text-acid' : 'text-paper/35'}`}
                      >
                        {String(entry.rank).padStart(2, '0')}
                      </span>

                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-mono text-[0.82rem] uppercase tracking-wider text-paper">
                            {entry.scene.label}
                          </span>
                          <span className="font-mono text-micro uppercase text-paper/35">
                            {entry.scene.time}
                          </span>
                          {isSelected && (
                            <span className="font-mono text-micro uppercase text-acid">selected</span>
                          )}
                          {!clears && (
                            <span className="font-mono text-micro uppercase text-paper/30">
                              under the bar
                            </span>
                          )}
                        </span>

                        {/* The send bar is a fixed tick on every row, so you can
                            see at a glance where the cut falls. */}
                        <span
                          aria-hidden
                          className="relative mt-1.5 block h-[3px] w-full overflow-hidden bg-paper/10"
                        >
                          <span
                            className="block h-full transition-[width] duration-scene ease-settle"
                            style={{
                              width: `${Math.max(2, norm(entry.utility) * 100)}%`,
                              background: isSelected ? '#FF2E88' : clears ? '#2B44FF' : '#3A4470',
                            }}
                          />
                          <span
                            className="absolute top-[-3px] h-[9px] w-px bg-paper/50"
                            style={{ left: `${norm(SEND_THRESHOLD) * 100}%` }}
                          />
                        </span>
                      </span>

                      <span className="font-mono text-[0.9rem] tabular-nums text-paper/80">
                        {entry.utility.toFixed(3)}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="grid gap-x-6 gap-y-1 border-x border-b border-paper/10 px-3 py-3 sm:grid-cols-2">
                            {entry.contributions.map((c) => {
                              const isCost = COST_TERMS.includes(c.key as WeightKey);
                              return (
                                <div
                                  key={c.key}
                                  className="grid grid-cols-[1fr_2.6rem_3.4rem] items-center gap-2 py-0.5"
                                >
                                  <span
                                    className={`truncate font-mono text-micro uppercase ${
                                      c.key === 'pairSignal' ? 'text-mint' : 'text-paper/45'
                                    }`}
                                  >
                                    {c.label}
                                  </span>
                                  <span className="text-right font-mono text-[0.72rem] tabular-nums text-paper/70">
                                    {c.value.toFixed(2)}
                                  </span>
                                  <span
                                    className={`text-right font-mono text-[0.72rem] tabular-nums ${
                                      isCost ? 'text-acid/80' : 'text-paper/85'
                                    }`}
                                  >
                                    {c.signed >= 0 ? '+' : ''}
                                    {c.signed.toFixed(3)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 border-x border-b border-paper/10 px-3 py-2.5">
                            <p className="flex-1 font-editorial text-[0.86rem] text-paper/55">
                              {entry.scene.premise}
                            </p>
                            {entry.scene.id !== currentSceneId && (
                              <button
                                onClick={() => {
                                  onPick(entry.scene.id);
                                  onClose();
                                }}
                                className="border border-paper/25 px-2.5 py-1 font-mono text-micro uppercase text-paper/75 transition-colors hover:border-paper/60 hover:text-paper"
                              >
                                show me
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>

            <footer className="mt-6 border-t border-paper/10 pt-4">
              <p className="font-mono text-micro uppercase text-paper/35">synthetic prototype logic</p>
              <p className="mt-2 max-w-[70ch] font-editorial text-[0.86rem] leading-relaxed text-paper/50">
                Deterministic linear utility. No model call, no randomness — the same six rooms
                score identically on every machine, every reload. Costs enter negatively, and
                uncertainty is one of them, so the system is penalised for what it doesn’t know
                rather than allowed to round it away.
              </p>
              <p className="mt-3 font-mono text-[0.68rem] leading-relaxed text-paper/30">
                {(Object.keys(WEIGHTS) as WeightKey[])
                  .map((k) => `${WEIGHTS[k] > 0 ? '+' : ''}${WEIGHTS[k]}·${k}`)
                  .join('  ')}
              </p>
              <p className="mt-3 font-mono text-micro uppercase text-acid/60">
                these weights are invented for this prototype. they are not Ditto’s model.
              </p>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
