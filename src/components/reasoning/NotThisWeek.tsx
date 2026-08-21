'use client';

import { motion } from 'framer-motion';
import { SEND_THRESHOLD, type SendDecision } from '@/lib/rankScenes';
import { SPRING } from '@/lib/motion';
import type { MatchPair } from '@/lib/types';

/**
 * Abstention.
 *
 * Everything else in this piece argues that context decides the outcome. This
 * is the same argument taken to its conclusion: if context is the variable,
 * then some weeks *every* context is wrong, and the correct output is nothing.
 *
 * Ditto delivers one match per Wednesday. Declining costs a person their whole
 * week, which is exactly what makes it a decision rather than a UI state — the
 * system has to believe waiting beats the best thing it can currently offer.
 *
 * The copy never says "no good matches". It names the field that failed, and it
 * says out loud that the pair was not the problem — because under a strained
 * week `pairSignal` and `contextFit` are the two things the model does not
 * touch.
 */
export function NotThisWeek({
  pair,
  decision,
  onSeeWorkings,
  onEaseOff,
}: {
  pair: MatchPair;
  decision: Extract<SendDecision, { send: false }>;
  onSeeWorkings: () => void;
  onEaseOff: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12, transition: { duration: 0.24 } }}
      transition={SPRING.copy}
      aria-live="polite"
      className="pointer-events-auto max-w-[34rem]"
    >
      <p className="font-mono text-label uppercase text-paper/62">the system is declining to send</p>

      <h2 className="mt-2 font-display text-[clamp(2rem,6.5vw,4.2rem)] uppercase leading-[0.88] text-paper">
        not this
        <br />
        wednesday.
      </h2>

      <p className="mt-4 max-w-[30ch] font-editorial text-lede font-medium leading-tight text-paper/85">
        {decision.reason}
      </p>

      {/* The load-bearing sentence. Without it this reads as rejection. */}
      <p className="mt-4 max-w-[36ch] border-l-2 border-mint/50 pl-3 font-editorial text-[0.98rem] leading-snug text-paper/60">
        {pair.personA.name} and {pair.personB.name} are exactly as right for each other as they
        were an hour ago. <span className="text-mint">pair signal did not move.</span> the week did.
      </p>

      {decision.best && (
        <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-paper/10 py-3">
          <span className="font-mono text-micro uppercase text-paper/55">best available</span>
          <span className="font-mono text-[0.82rem] uppercase tracking-wider text-paper/80">
            {decision.best.scene.label}
          </span>
          <span className="font-mono text-[0.82rem] tabular-nums text-paper/60">
            {decision.best.utility.toFixed(3)}
          </span>
          <span className="font-mono text-micro uppercase text-acid">
            {decision.shortfall.toFixed(3)} under the bar ({SEND_THRESHOLD})
          </span>
        </div>
      )}

      <p className="mt-5 font-hand text-[1.15rem] leading-snug text-paper/50">
        we could send this. we&rsquo;d rather not spend their one wednesday on it.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={onSeeWorkings}
          className="min-h-[44px] border border-paper/25 px-4 py-2 font-mono text-micro uppercase text-paper/80 transition-colors hover:border-paper/60 hover:text-paper"
        >
          see every option under the bar
        </button>
        <button
          onClick={onEaseOff}
          className="min-h-[44px] px-2 py-2 font-mono text-micro uppercase text-paper/62 underline-offset-4 transition-colors hover:text-paper/80 hover:underline"
        >
          give them an easier week
        </button>
      </div>
    </motion.section>
  );
}
