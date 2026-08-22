'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useConditions, useCurrentPair, usePrototype, useSendDecision } from '@/store/prototypeStore';
import { rankScenes } from '@/lib/rankScenes';

/**
 * The escape hatch.
 *
 * A prototype that takes itself completely seriously is easy to admire and hard
 * to like. This offers, in the corner, an honest exit from the whole
 * production: press it and the entire 3D world is replaced by four lines of
 * plain text on white.
 *
 * It is a joke, but it is not only a joke — the answer really does fit on an
 * index card, and being willing to show that is the same instinct as the piece
 * deleting itself at the end. The world rebuilds when you ask for it back.
 */
export function TooMuch() {
  const open = usePrototype((s) => s.tldrOpen);
  const toggle = usePrototype((s) => s.toggleTldr);
  const pair = useCurrentPair();
  const conditions = useConditions();
  const decision = useSendDecision();

  // Derived, because this card is the single most screenshot-able object on
  // the site and it used to be three hardcoded strings: "coffee bad / post show
  // good / go meet her". Two of those were only true for one of the two pairs
  // the stage ships -- swap to the other and coffee WINS, which is the site's
  // own best proof, contradicted by its own shareable. And the third misgendered
  // a person whose data carries no pronoun. Names, and the real ranking, now.
  const ranked = rankScenes(pair, conditions);
  const worst = ranked[ranked.length - 1]?.scene;
  const best = ranked[0]?.scene;

  return (
    <>
      <button
        onClick={toggle}
        data-cursor="be honest"
        className="py-1.5 pointer-events-auto fixed bottom-3 right-4 z-overlay font-mono text-micro uppercase text-paper/55 underline-offset-4 transition-colors hover:text-paper/70 hover:underline"
      >
        too much?
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="tldr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-sheet flex flex-col justify-center bg-[#FBFAF6] px-gutter"
          >
            <p className="font-mono text-micro uppercase text-ink/62">tldr</p>

            <div className="mt-4 space-y-1 font-mono text-[clamp(1.1rem,3.6vw,2rem)] leading-tight text-ink">
              {decision.send ? (
                <>
                  <p>{worst?.label.toLowerCase()} bad</p>
                  <p>{best?.label.toLowerCase()} good</p>
                  <p>go meet {pair.personB.name.toLowerCase()}</p>
                </>
              ) : (
                <>
                  <p>every option bad</p>
                  <p>this week only</p>
                  <p>wait for next one</p>
                </>
              )}
            </div>

            <p className="mt-8 max-w-[42ch] font-mono text-[0.78rem] leading-relaxed text-ink/62">
              {pair.personA.name} and {pair.personB.name} are synthetic. so is everything else.
              the long version has more evidence and better lighting.
            </p>

            <button
              onClick={toggle}
              data-cursor="rebuild it"
              className="mt-10 self-start border border-ink/25 px-4 py-2.5 font-mono text-micro uppercase text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              okay bring it back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
