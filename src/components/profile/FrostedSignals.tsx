'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { privateSignals } from '@/lib/redaction';

/**
 * What we know about them, and will not show you.
 *
 * The rest of this page is about what the system knows about *you*, where the
 * honest move is to show everything including the gaps. This is the opposite
 * case and it needs the opposite treatment: reads on the person you were
 * matched with, held on their behalf, displayed only as an admission that they
 * exist.
 *
 * The glass is real. There is no text under it — see `redaction.ts` — so the
 * usual failure of this pattern does not apply here: you cannot select it,
 * inspect it, or read it aloud, because nothing was written. What is drawn is
 * word-shaped rhythm generated from a seed.
 *
 * The button is the part worth having. It lets you try, and the refusal is
 * specific rather than a disabled control, because a system that quietly greys
 * out the thing you want has not explained itself — it has just stopped
 * responding.
 */
export function FrostedSignals({ personId, name }: { personId: string; name: string }) {
  const signals = useMemo(() => privateSignals(personId), [personId]);
  const [tried, setTried] = useState(false);

  return (
    <section aria-label={`What Ditto is holding about ${name}`} className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-paper/55">
          what we know about {name.toLowerCase()}
        </p>
        <p className="font-editorial text-[0.7rem] lowercase tracking-wide text-paper/55">
          {signals.length} reads · none of them yours
        </p>
      </div>

      <ul className="mt-4 grid gap-2.5">
        {signals.map((signal, i) => (
          <motion.li
            key={signal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-artifact border border-paper/12 bg-paper/[0.02] px-4 py-3.5"
          >
            {/* public: the kind of read, and how sure. never the read. */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-editorial text-[0.78rem] lowercase tracking-wide text-paper/55">
                {signal.kind}
              </p>
              <span className="font-mono text-[0.6rem] tabular-nums text-paper/62">
                {signal.confidence.toFixed(2)}
              </span>
            </div>

            {/*
              The glass covers the private half and nothing else.

              It was originally laid over the whole card, which blurred the
              label and the confidence along with the shapes — and those two are
              deliberately public. The entire point is that you can audit *what*
              is being held and how sure it is without being shown the content,
              so softening the part you are meant to be able to read undoes the
              argument and just looks like a rendering fault.
            */}
            <div className="relative mt-3">
              <div aria-hidden className="grid gap-[0.42rem] blur-[3.5px]">
                {signal.lines.map((line, li) => (
                  <div key={li} className="flex flex-wrap items-center gap-[0.4rem]">
                    {line.words.map((w, wi) => (
                      <span
                        key={wi}
                        className="block h-[0.62rem] rounded-[2px] bg-paper/[0.22]"
                        style={{ width: `${w}ch` }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/*
                A second, physical layer over the top. Blur alone still reads as
                "text at low resolution" and invites squinting; a sheen reads as
                a surface, and a surface communicates deliberate refusal rather
                than poor rendering.
              */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-1 -inset-y-1.5"
                style={{
                  background:
                    'linear-gradient(118deg, rgba(244,237,228,0.05) 0%, rgba(244,237,228,0.012) 38%, rgba(244,237,228,0.055) 62%, rgba(244,237,228,0.015) 100%)',
                  backdropFilter: 'blur(1.5px)',
                }}
              />
            </div>
          </motion.li>
        ))}
      </ul>

      <button
        onClick={() => setTried(true)}
        data-cursor="try it"
        className="py-1.5 mt-5 font-editorial text-[0.74rem] lowercase tracking-wide text-paper/62 underline-offset-4 transition-colors hover:text-paper hover:underline"
      >
        why can&rsquo;t i see these?
      </button>

      <AnimatePresence>
        {tried && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 max-w-[46ch] border-l-2 border-acid/50 pl-4">
              <p className="font-voice text-[1.15rem] leading-snug text-paper/85">
                because they are not about you.
              </p>
              <p className="mt-3 font-editorial text-[0.8rem] lowercase leading-relaxed tracking-wide text-paper/62">
                they gave us those to be matched well, not to be described to a stranger. the
                same wall is standing on the other side of this, with your four behind it.
              </p>
              <p className="mt-4 font-editorial text-[0.74rem] lowercase leading-relaxed tracking-wide text-paper/55">
                and there is nothing behind the blur to find. no text was rendered — those are
                generated word-shaped widths, so there is nothing to select, inspect, or read
                out. a redaction you can highlight was never a redaction.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
