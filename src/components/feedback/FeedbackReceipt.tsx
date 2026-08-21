'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { highlightRanges } from '@/lib/feedbackSchema';
import { SPRING } from '@/lib/motion';
import { PrototypeDisclosure } from '@/components/shared/PrototypeDisclosure';
import { usePrototype } from '@/store/prototypeStore';
import type { MatchPair } from '@/lib/types';

const PLACEHOLDER =
  'honestly she was way more outgoing than I expected but walking after the show made it really easy';

/**
 * Post-date feedback.
 *
 * Not a star rating. A rating compresses the only genuinely high-information
 * thing a person produces after a date — a messy sentence — into a number that
 * cannot be reasoned about. So the input is a sentence, the system marks the
 * fragments it thinks are load-bearing, and it commits to a *hypothesis* rather
 * than an update.
 *
 * The old hypothesis is struck through rather than deleted. A learning system
 * that quietly overwrites what it used to believe is impossible to audit.
 */
export function FeedbackReceipt({ pair }: { pair: MatchPair }) {
  const text = usePrototype((s) => s.feedbackText);
  const setText = usePrototype((s) => s.setFeedbackText);
  const submit = usePrototype((s) => s.submitFeedback);
  const pending = usePrototype((s) => s.feedbackPending);
  const result = usePrototype((s) => s.feedback);
  const phase = usePrototype((s) => s.phase);
  const [torn, setTorn] = useState(false);

  const marks = useMemo(() => highlightRanges(text), [text]);

  const marked = useMemo(() => {
    if (!marks.length) return [{ text, kind: null as 'up' | 'down' | null }];
    const out: { text: string; kind: 'up' | 'down' | null }[] = [];
    let cursor = 0;
    for (const m of marks) {
      if (m.start > cursor) out.push({ text: text.slice(cursor, m.start), kind: null });
      out.push({ text: text.slice(m.start, m.end), kind: m.kind });
      cursor = m.end;
    }
    if (cursor < text.length) out.push({ text: text.slice(cursor), kind: null });
    return out;
  }, [marks, text]);

  const showReceipt = phase === 'memory' && result;

  return (
    <div className="absolute inset-0 z-overlay flex items-center justify-center overflow-y-auto px-gutter py-12">
      {/* Same reasoning as the handoff: the receipt must not be gated behind
          the prompt's exit animation. Both stages share one grid cell. */}
      <div className="grid w-full max-w-md">
        <AnimatePresence>
          {!showReceipt && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, transition: { duration: 0.28 } }}
              transition={SPRING.copy}
              className="col-start-1 row-start-1"
            >
              <p className="font-mono text-micro uppercase text-paper/55">the date happened</p>
              <h2 className="mt-2 font-display text-[clamp(1.7rem,5vw,2.8rem)] uppercase leading-none text-paper">
                how did the opening feel?
              </h2>
              <p className="mt-3 font-editorial text-[0.95rem] leading-snug text-paper/50">
                not a rating. a sentence. the messier the better.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                aria-label="How the opening felt"
                placeholder={PLACEHOLDER}
                className="mt-5 w-full resize-none border border-paper/15 bg-paper/[0.04] p-3.5 font-editorial text-[0.98rem] leading-snug text-paper placeholder:text-paper/55 focus:border-paper/40"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void submit()}
                  disabled={!text.trim() || pending}
                  className="border border-paper/25 px-4 py-2 font-mono text-micro uppercase text-paper transition-colors hover:border-acid hover:text-acid disabled:opacity-30 disabled:hover:border-paper/25 disabled:hover:text-paper"
                >
                  {pending ? 'reading…' : 'send it'}
                </button>
                {!text.trim() && (
                  <button
                    onClick={() => setText(PLACEHOLDER)}
                    className="font-mono text-micro uppercase text-paper/55 underline-offset-4 hover:underline"
                  >
                    use the example
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {showReceipt && (
            <motion.div
              key="receipt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="col-start-1 row-start-1"
            >
              {/* the printed sentence */}
              <motion.div
                initial={{ y: -18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...SPRING.settle, delay: 0.05 }}
                className="u-paper u-torn-bottom origin-top px-5 py-5"
                style={{ transform: 'rotate(-0.6deg)' }}
              >
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/62">
                  Ditto · feedback · {pair.personA.name} × {pair.personB.name}
                </p>
                <div className="my-3 border-t border-dashed border-ink/25" />

                <p className="font-mono text-[0.9rem] leading-relaxed text-ink">
                  {marked.map((part, i) =>
                    part.kind ? (
                      <motion.mark
                        key={i}
                        initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
                        animate={{
                          backgroundColor: part.kind === 'up' ? '#FFD84D' : '#FF2E8855',
                        }}
                        transition={{ delay: 0.7 + i * 0.12, duration: 0.35 }}
                        className="px-0.5 text-ink"
                      >
                        {part.text}
                      </motion.mark>
                    ) : (
                      <span key={i}>{part.text}</span>
                    ),
                  )}
                </p>

                <div className="my-3 border-t border-dashed border-ink/25" />
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/62">
                  interpretation: {result.source === 'model' ? 'model' : 'deterministic'}
                </p>
              </motion.div>

              {/* what moved */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.settle, delay: 1.5 }}
                className="mt-5 grid gap-2"
              >
                {(
                  [
                    ['keep', result.preserve, 'text-paper/70'],
                    ['more of', result.increase, 'text-mint'],
                    ['less of', result.decrease, 'text-acid'],
                  ] as const
                ).map(([label, items, tone]) =>
                  items.length ? (
                    <div key={label} className="flex gap-3">
                      <span className="w-16 shrink-0 pt-0.5 font-mono text-micro uppercase text-paper/55">
                        {label}
                      </span>
                      <span className={`font-editorial text-[0.92rem] leading-snug ${tone}`}>
                        {items.join(' · ')}
                      </span>
                    </div>
                  ) : null,
                )}
              </motion.div>

              {/* the rewrite */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.settle, delay: 2.1 }}
                onAnimationComplete={() => setTorn(true)}
                className="mt-6 border-t border-paper/10 pt-5"
              >
                <p className="font-mono text-micro uppercase text-paper/55">Ditto learned</p>

                <p className="mt-3 font-editorial text-[0.98rem] leading-snug text-paper/55">
                  first hypothesis:{' '}
                  <span className={torn ? 'line-through decoration-acid decoration-2' : ''}>
                    “{pair.hearMeOut.stated}” is the problem
                  </span>
                </p>

                {result.inferredHypotheses.map((h, i) => (
                  <motion.div
                    key={h.hypothesis}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.5 + i * 0.2 }}
                    className="mt-3"
                  >
                    <p className="font-editorial text-[1.02rem] leading-snug text-paper">
                      new hypothesis: {h.hypothesis}
                    </p>
                    <p className="mt-1 font-mono text-micro uppercase text-paper/55">
                      {h.confidence} confidence · {h.evidence}
                    </p>
                  </motion.div>
                ))}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3.3 }}
                  className="mt-5 border-l-2 border-paper/15 pl-3 font-hand text-[1.05rem] leading-snug text-paper/55"
                >
                  hypothesis, not fact. we’ll test it gently.
                </motion.p>

                {result.uncertainty.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.6 }}
                    className="mt-4 space-y-1"
                  >
                    {result.uncertainty.map((u) => (
                      <li key={u} className="font-mono text-micro uppercase text-paper/55">
                        · {u}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </motion.div>

              <PrototypeDisclosure className="mt-10" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
