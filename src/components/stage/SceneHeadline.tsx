'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE, SPRING } from '@/lib/motion';
import type { Scene } from '@/lib/types';

/**
 * The verdict.
 *
 * Never a score. The strongest scene says "THIS ONE." and the weakest says
 * "calendar fit isn't human fit." — both of which carry more information than
 * a percentage, because they name *which* thing is wrong.
 */
export function SceneHeadline({ scene, isWinner }: { scene: Scene; isWinner: boolean }) {
  return (
    <div className="pointer-events-none relative select-none">
      {/*
        `popLayout`, not `wait`. The dial is a control you can spin, and `wait`
        serialises each headline swap behind the previous one's exit animation —
        so fast rotation leaves the copy trailing the dial by several scenes.
        Here the incoming headline mounts immediately and the outgoing one
        leaves out of flow. The exit is a short fixed tween rather than a spring
        for the same reason: it must never be the thing gating the next scene.
      */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={scene.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.14, ease: EASE.exit } }}
          transition={{ ...SPRING.copy }}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-display uppercase leading-none text-paper">{scene.label}</h2>
            <span className="font-mono text-label uppercase text-paper/45">{scene.time}</span>
            <span className="font-mono text-label uppercase text-paper/30">{scene.location}</span>
          </div>

          <motion.p
            className={`mt-3 max-w-[22ch] font-editorial text-lede font-medium tracking-tight sm:max-w-[26ch]
              ${isWinner ? 'text-acid' : 'text-paper/85'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06, duration: DUR.settle, ease: EASE.settle }}
          >
            {scene.verdict}
          </motion.p>

          {scene.verdictSub && (
            <motion.p
              className="mt-2 max-w-[30ch] font-editorial text-[0.95rem] leading-snug text-paper/60"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: DUR.settle, ease: EASE.settle }}
            >
              {scene.verdictSub}
            </motion.p>
          )}

          <motion.p
            className="mt-4 max-w-[34ch] font-hand text-[1.05rem] leading-snug text-paper/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22, duration: DUR.settle, ease: EASE.settle }}
          >
            {scene.annotation}
          </motion.p>

          {scene.thirdThing && (
            <motion.p
              className="mt-4 inline-flex items-center gap-2 border border-ticket/30 bg-ticket/10 px-2.5 py-1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: DUR.settle, ease: EASE.settle }}
            >
              <span className="font-mono text-micro uppercase text-ticket/80">third thing</span>
              <span className="font-mono text-micro uppercase text-paper/70">{scene.thirdThing}</span>
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
