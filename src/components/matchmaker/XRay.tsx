'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EASE } from '@/lib/motion';
import { MM_COPY } from '@/data/matchmaking';
import { actionCall, runMatchmaker, type RunResult } from '@/lib/matchmaker';
import { retireSignal, correctBelief } from '@/lib/personModel';
import { runAllEvals } from '@/lib/matchmakerEvals';

/**
 * The X-ray — the machinery behind the phone, on request.
 *
 * Nothing in these panels is decoration: the run numbers are the run's own
 * counts, the trace is the engine's actual event list, the replay reruns
 * the real engine with one signal moved and diffs the Wednesday, and the
 * eval marks are computed here, in the browser, from the same suite CI
 * runs. Mint throughout, because this is the system layer and mint is its
 * colour.
 */
export function XRay({ run, onClose }: { run: RunResult; onClose: () => void }) {
  const [tab, setTab] = useState<'run' | 'trace' | 'replay' | 'evals'>('run');
  const [replayWith, setReplayWith] = useState<'retire-energy' | 'soften-smoking' | null>(null);

  const pool = useMemo(() => run.evals.map((e) => e.candidate), [run]);
  const replayRun = useMemo(() => {
    if (!replayWith) return null;
    const beliefs =
      replayWith === 'retire-energy'
        ? retireSignal(run.model.beliefs, 'energy')
        : correctBelief(run.model.beliefs, 'smoking', 'soft');
    return runMatchmaker({ ...run.model, beliefs }, pool, run.week);
  }, [replayWith, run, pool]);

  const evals = useMemo(() => runAllEvals(), []);
  const call = actionCall(run);
  const counts = run.decision.counts;

  return (
    <motion.aside
      role="dialog"
      aria-label="X-ray"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.4, ease: EASE.settle }}
      className="fixed inset-x-0 bottom-0 z-sheet max-h-[82vh] overflow-y-auto border-t border-mint/25 bg-ink/97 px-gutter pb-8 pt-4 backdrop-blur-md sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-h-[86vh] sm:w-[min(30rem,94vw)] sm:rounded-sheet sm:border"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-mint">{MM_COPY.xray.open}</p>
        <button onClick={onClose} aria-label="Close" className="rounded-artifact border border-paper/20 p-2 text-paper/70 transition-colors hover:border-paper/50 hover:text-paper">
          <X size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(['run', 'trace', 'replay', 'evals'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`min-h-[36px] border px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] transition-colors ${
              tab === t ? 'border-mint/60 text-mint' : 'border-paper/20 text-paper/62 hover:border-paper/45'
            }`}
          >
            {MM_COPY.xray[t]}
          </button>
        ))}
      </div>

      {tab === 'run' && (
        <div className="mt-4 font-mono text-[0.66rem] uppercase leading-relaxed tracking-[0.1em] text-paper/80">
          <p>seeker · {run.model.name} · week {run.week}</p>
          <p className="mt-1">candidates · {counts.pool}</p>
          <p>eligible · {counts.eligible}</p>
          <p>mutual frontier · {counts.mutual}</p>
          <p>share an hour · {counts.scheduled}</p>
          <p>low friction · {counts.lowFriction}</p>
          <p>scene viable · {counts.sceneViable}</p>
          <p className="mt-1 text-mint">
            action · {run.decision.abstained ? 'abstain' : `select ${run.decision.selected?.candidate.name}`}
          </p>
          <p className="mt-3 border-t border-paper/10 pt-3 normal-case tracking-normal text-paper/70">
            <span className="uppercase tracking-[0.14em] text-paper/55">{MM_COPY.xray.policy}</span>
            <br />
            {call.action} at {call.confidence.toFixed(2)} — {call.why}
          </p>
        </div>
      )}

      {tab === 'trace' && (
        <ol className="mt-4 grid gap-1">
          {run.trace.map((ev) => (
            <li key={ev.step} className="grid grid-cols-[2rem_9rem_1fr] gap-2 font-mono text-[0.6rem] leading-relaxed text-paper/70">
              <span className="tabular-nums text-paper/55">{String(ev.step).padStart(2, '0')}</span>
              <span className="truncate text-mint/80">{ev.type}</span>
              <span className="text-paper/80">{ev.detail}</span>
            </li>
          ))}
        </ol>
      )}

      {tab === 'replay' && (
        <div className="mt-4">
          <p className="font-editorial text-[0.75rem] lowercase text-paper/62">{MM_COPY.xray.replayNote}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setReplayWith('retire-energy')}
              aria-pressed={replayWith === 'retire-energy'}
              className={`min-h-[36px] border px-3 py-1.5 font-mono text-[0.6rem] uppercase ${replayWith === 'retire-energy' ? 'border-mint/60 text-mint' : 'border-paper/20 text-paper/70 hover:border-paper/45'}`}
            >
              retire the energy signal
            </button>
            <button
              onClick={() => setReplayWith('soften-smoking')}
              aria-pressed={replayWith === 'soften-smoking'}
              className={`min-h-[36px] border px-3 py-1.5 font-mono text-[0.6rem] uppercase ${replayWith === 'soften-smoking' ? 'border-mint/60 text-mint' : 'border-paper/20 text-paper/70 hover:border-paper/45'}`}
            >
              correct smoking to soft
            </button>
          </div>
          {replayRun && (
            <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.1em]">
              <div className="border-l-2 border-paper/25 pl-3 text-paper/70">
                <p className="text-paper/55">before</p>
                <p className="mt-1">eligible · {run.decision.counts.eligible}</p>
                <p>sent · {run.decision.abstained ? '—' : run.decision.selected?.candidate.name}</p>
              </div>
              <div className="border-l-2 border-mint/50 pl-3 text-paper/80">
                <p className="text-mint">after</p>
                <p className="mt-1">eligible · {replayRun.decision.counts.eligible}</p>
                <p>sent · {replayRun.decision.abstained ? '—' : replayRun.decision.selected?.candidate.name}</p>
              </div>
              <p className="col-span-2 mt-1 normal-case tracking-normal text-paper/62">
                {replayRun.decision.selected?.candidate.id === run.decision.selected?.candidate.id &&
                replayRun.decision.counts.eligible === run.decision.counts.eligible
                  ? 'the decision held — this signal was not load-bearing today.'
                  : 'the decision moved — that is what this signal was carrying.'}
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'evals' && (
        <div className="mt-4 grid gap-2">
          {evals.map(({ case_, result }) => (
            <div key={case_.id} className="border-l-2 pl-3" style={{ borderColor: result.pass ? '#5FE3AE' : '#FF2E88' }}>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper/85">
                {result.pass ? 'pass' : 'fail'} · {case_.title}
              </p>
              <p className="font-editorial text-[0.7rem] lowercase text-paper/62">{case_.rule}</p>
              <p className="font-mono text-[0.58rem] normal-case text-paper/55">{result.detail}</p>
            </div>
          ))}
          <p className="mt-1 font-editorial text-[0.68rem] lowercase text-paper/55">
            the same suite runs in ci — these marks are computed here, now, from the real engine.
          </p>
        </div>
      )}
    </motion.aside>
  );
}
